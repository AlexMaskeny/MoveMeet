//region 3rd Party Imports
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { Auth, Storage } from 'aws-amplify';
import { useFocusEffect } from '@react-navigation/native';
import { useNetInfo } from "@react-native-community/netinfo";
//endregion
//region 1st Party Imports
import Screen from '../comps/Screen';
import NoChatsAlert from '../comps/NoChatsAlert';
import PrivateChat from '../comps/PrivateChat';
import SettingsChat from '../comps/SettingsChat';
import IconButton from '../comps/IconButton';
import UserSearch from '../comps/UserSearch';
import HelpPrivateChatsPage from '../comps/HelpPrivateChatsPage';
import BugReport from '../comps/BugReport';
import { calls, instances, mmAPI } from '../api/mmAPI';
import { colors } from '../config';
import * as logger from '../functions/logger';
import * as timeLogic from '../functions/timeLogic';
//endregion

export default function PrivateChatsPage({ navigation }) {
    //region useRef variables
    const userChatsSub = useRef([]);
    const timeClockSub = useRef();
    const currentUser = useRef();
    const subSafeSub = useRef();
    //endregion
    //region useState variables
    const [refresh, setRefresh] = useState(false);
    const [ready, setReady] = useState(false);
    const [rerender, setRerender] = useState(false);
    const [chats, setChats] = useState([]);
    const [showSettings, setShowSettings] = useState(false);
    const [settingsChat, setSettingsChat] = useState({});
    const [showSearch, setShowSearch] = useState(false); //set true on open. On close or navigate set to false
    const [showHelp, setShowHelp] = useState(false);
    const [showBug, setShowBug] = useState(false);
    //endregion
    const netInfo = useNetInfo();

    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                
                <View style={{ alignItems: "center", justifyContent: "center", marginRight: 10, flex: 1 }}>
                    <IconButton
                        icon="account-search"
                        brand="MaterialCommunityIcons"
                        color={colors.text1}
                        size={32}
                        onPress={() => setShowSearch(true)}
                    />
                </View>   
            ),
            headerLeft: () => (
                <View style={{ alignItems: "center", justifyContent: "center", marginLeft: 10, flex: 1 }}>
                    <IconButton
                        icon="help-circle"
                        brand="Ionicons"
                        color={colors.text1}
                        size={32}
                        onPress={() => setShowHelp(true)}
                    />
                </View> 
            )
        })
    }); //Header Initialization For Screen Specific Icons
    useFocusEffect(useCallback(() => {
        if (timeClockSub.current) clearInterval(timeClockSub.current);
        timeClockSub.current = setInterval(updateTime, 10000);
        logger.eLog("[SUBMANAGER] PrivateChatsPage timeClock subscription begun.")

        const initialFunction = async () => {
            try {
                if (netInfo.isConnected || !ready) {
                    const cognitoUser = await Auth.currentAuthenticatedUser();
                    currentUser.current = await mmAPI.query({
                        call: calls.GET_USER_BY_COGNITO,
                        instance: instances.LEAST,
                        input: {
                            id: cognitoUser.attributes.sub
                        }
                    });
                    onRefresh();
                }
            } catch (error) {
                logger.warn(error);
            }
        }
        initialFunction();
        return () => {
            try {
                subSafeSub.current();
                logger.eLog("[SUBMANAGER] PrivateChatsPage subSafe subscription closed");
            } catch (error) { }
            try {
                clearInterval(timeClockSub.current);
                logger.eLog("[SUBMANAGER] PrivateChatsPage timeClock subscription closed.");
            } catch (error) { }
            try {
                unsubscribeChats();
            } catch (error) { }
        }
    }, [rerender])); //Get data on open page & on rerender

    const onRefresh = async () => {
        try {
            if (netInfo.isConnected || !ready) {
                //Unsubscribe from the previous message subscriptions
                unsubscribeChats();

                //Remove previous SubSafe
                try {
                    subSafeSub.current();
                    logger.eLog("[SUBMANAGER] PrivateChatsPage subSafe subscription closed");
                } catch (error) { }

                //Get the current user's friends
                const userFriendsResponse = await mmAPI.query({
                    call: calls.GET_USER,
                    instance: "friends",
                    input: {
                        id: currentUser.current.id
                    }
                })
                if (userFriendsResponse) {
                    let userFriends = userFriendsResponse.friends;
                    let chatData = [];

                    //Iterate through the user's friends and get the necessary data to create a chat (or skip the user)
                    for (let i = 0; i < userFriends.length; i++) {
                        //If user blocked, skip user
                        if (userFriends[i].status === "666") continue;

                        //Get the chat of the friendship
                        let chat = await mmAPI.query({
                            call: calls.GET_CHAT,
                            instance: instances.FULL,
                            input: {
                                id: userFriends[i].chatID
                            }
                        });

                        //Add the current friendship data to the chat
                        chat.friend = userFriends[i];

                        //If a user is friends with some who blocked them, skip user
                        if (chat.members.items.length < 2) continue;

                        //region Find the opposing user and set chat.opposingUser, chat.userChatMembersID
                        if (chat.members.items[0].user.id === currentUser.current.id) {
                            chat.opposingMember = chat.members.items[1];
                            chat.userChatMembersID = chat.members.items[0].id
                        }
                        else {
                            chat.opposingMember = chat.members.items[0];
                            chat.userChatMembersID = chat.members.items[1].id
                        }
                        //endregion

                        //region Get the profile picture associated with the chat
                        const picture = await Storage.get(chat.opposingMember.user.profilePicture.loadFull);
                        chat.profilePicture = {
                            uri: {
                                full: picture,
                                loadFull: picture,
                                fullKey: chat.opposingMember.user.profilePicture.loadFull
                            }
                        }
                        //endregion

                        //We can only read the first 10 chars of AWSDates.
                        chat.createdAt = chat.createdAt.substring(0, 10);

                        //region Get the latest message [the warning is okay]
                        const last1 = await mmAPI.query({
                            call: calls.LIST_MESSAGES_BY_TIME,
                            instance: "chatsPage",
                            input: {
                                chatMessagesId: chat.id,
                                limit: 1
                            }
                        });
                        chat.last1 = [];
                        chat.status = userFriends[i].status;
                        chat.glow = false;
                        chat.latest = "";

                        if (last1) {
                            chat.last1 = last1.items;
                            if (last1.items[0]) {
                                chat.latest = timeLogic.ago((Date.now() - Date.parse(last1.items[0].createdAt)) / 1000);
                                if (!last1.items[0].read.includes(currentUser.current.id)) { chat.glow = true }
                            } //Set the glow and latest chat
                        } else throw "[PRIVATECHATSPAGE] onRefresh failed because of an error getting a chat's last1 messages";
                        //endregion

                        //region Handle the glow feature. Things will be different based on friend status
                        if (!chat.glow && (userFriends[i].status === "1" || userFriends[i].status === "3"))
                            chat.glow = false;
                        else chatData.push(chat);
                        if (chat.glow) {
                            if (userFriends[i].status === "1") userFriends[i].status = "0";
                            if (userFriends[i].status === "3") userFriends[i].status = "2";
                            await mmAPI.mutate({
                                call: calls.UPDATE_USER,
                                input: {
                                    id: currentUser.current.id,
                                    friends: userFriends
                                }
                            });
                        }
                        //endregion

                        //Subscribe to updates to that chat
                        userChatsSub.current.push(mmAPI.subscribe({
                            call: calls.ON_RECEIVE_MESSAGE,
                            input: {
                                chatMessagesId: chat.id,
                            },
                            onReceive: (data) => {
                                logger.eLog("[SUBMANAGER]: userChats notification received.");
                                messageUpdate(data);
                            },
                            onError: (error) => {
                                unsubscribeChats();
                                logger.warn(error);
                                logger.eWarn("[SUBMANAGER]: Error detected receiving userChats notification. Reconnecting");
                                setRerender(!rerender);
                            },
                            sendData: true,
                        }))
                    }
                    //After getting the chatData, sort chats then update the chats state variable
                    sortChats(chatData);
                    setChats(chatData);
                } else throw "[PRIVATECHATSPAGE] onRefresh failed because of an error getting userChats."
            } else throw "[PRIVATECHATSPAGE] onRefresh failed because there is no connection";
        } catch (error) {
            logger.warn("ONREFRESH ERROR ON PRIVATECHATSPAGE: " + error);
        } finally {
            setReady(true);
            setRefresh(false);
            logger.eLog("Finished Refreshing PrivateChatsPage, enabling subSafe");
            //Activate the SubSafe for the updated subscriptions
            subSafeSub.current = mmAPI.subSafe(() => onRefresh());
            logger.eLog("subSafe enabled");
        }
    } //Get data and call necessary functions to update the UI and subscriptions
    const unsubscribeChats = () => {
        for (var i = 0; i < userChatsSub.current.length; i++) {
            userChatsSub.current[i].unsubscribe();
        }
        logger.eLog("[SUBMANAGER] " + userChatsSub.current.length + " PrivateChatsPage userChatsSub subscriptions closed.");
        userChatsSub.current = [];
    } //Unsubscribe from updates for all chats receiving messages
    const messageUpdate = async (data) => {
        setChats(existingItems => {
            let Chats = [...existingItems];
            const index = Chats.findIndex(el => el.id === data.chatMessagesId);
            if (index === -1) {
                unsubscribeChats();
                onRefresh();

            } else {
                Chats[index].latest = "Now";
                Chats[index].last1 = [data];  
                if (data.user.id !== currentUser.current.id) Chats[index].glow = true;
            }
            return [...Chats];

        });
    } //Called when receiving a message from subscription
    const sortChats = (chatData) => {
        chatData.sort((a, b) => {
            if (a.last1.length > 0 && b.last1.length > 0) {
                if (Date.parse(a.last1[0].createdAt) > Date.parse(b.last1[0].createdAt)) {
                    return -1;
                } else {
                    return 1;
                }
            } else {
                if (Date.parse(a.createdAt) > Date.parse(b.createdAt)) {
                    return -1;
                } else {
                    return 1;
                }
            }
        })
    } //Put the recent messages on top. If no recent messages, put the most recent friendship on top
    const navigate = async (item) => {
        try {
            if (item.last1.length >= 1) {
                if (!item.last1[0].read.includes(currentUser.current.id)) {
                    item.last1[0].read.push(currentUser.current.id)
                    await mmAPI.mutate({
                        call: calls.UPDATE_MESSAGE,
                        input: {
                            id: item.last1[0].id,
                            read: item.last1[0].read
                        }
                    })
                    item.glow = false
                }
            }
        } catch (error) {
            logger.error(error);
        }
    } //TRIGGERED UPON "OPEN CHAT". NAVIGATES TO THAT CHAT AFTER THIS.
    const updateTime = () => {
        setChats(existingItems => {
            let Chats = [...existingItems];
            for (let i = 0; i < Chats.length; i++) {
                if (Chats[i].last1.length >= 1) {
                    Chats[i].latest = timeLogic.ago((Date.now() - Date.parse(Chats[i].last1[0].createdAt)) / 1000);
                }
            }
            return [...Chats];
        });
        logger.eLog("PrivateChatsPage TimeClock activated.");
    } //Trigger every 10 seconds by the time clock to update times
    const openSettings = (item) => {
        setSettingsChat(item);
        setShowSettings(true);
    } //Opens a user settings modal
    const closeSettings = () => {
        setShowSettings(false);
        setSettingsChat({});
        setRefresh(true);
        onRefresh();
    } //Closes a user settings modal
    const closeSearch = () => {
        setShowSearch(false);
    } //Closes the search modal

    const keyExtractor = React.useCallback((item) => item.id, []); //Tell the list what field to uniquely identify chats
    const ListEmptyComponent = React.useCallback(() => {
        if (ready) return <NoChatsAlert isPrivate={true} />
    }, [ready]); //Displays an alert when no private chats
    const ListFooterComponent = React.useCallback(() => {
        if (ready) return <View style={{ height: 30 }} />
        else return <ActivityIndicator color={colors.pBeam} size="large" style={{ marginTop: 10 }} />
    }, [ready]); //Displays a spacer when ready, activity indicator when not ready
    const RenderItem = React.useCallback(({ item }) => {
            if (ready) {
                return (
                    <PrivateChat
                        status={item.status}
                        profilePicture={item.profilePicture}
                        last1={item.last1}
                        latest={item.latest}
                        id={item.id}
                        openSettings={()=>openSettings(item)}
                        user={currentUser.current}
                        title={item.opposingMember.user.username}
                        navigation={navigation}
                        onPress={() => navigate(item)}
                        userChatMembersID={item.userChatMembersID}
                        glow={item.glow}
                        created={item.createdAt}
                    />
                )
            } else {
                return (<></>);
            }
        }, [chats, ready]) //Render the private chat component for each chat
    const Modals = () => <>
        <SettingsChat
            item={settingsChat}
            onClose={closeSettings}
            visible={showSettings}
            navigate={() => navigate(settingsChat)}
            currentUser={currentUser.current}
            navigation={navigation}
        />
        <UserSearch
            onClose={closeSearch}
            visible={showSearch}
            currentUser={currentUser.current}
            navigation={navigation}
        />
        <HelpPrivateChatsPage
            visible={showHelp}
            onClose={() => setShowHelp(false)}
            onSearch={() => setShowSearch(true)}
            openBug={()=>setShowBug(true) }
        />
        <BugReport
            visible={showBug}
            onClose={() => setShowBug(false)}
            currentUser={currentUser.current}
        />
    </> //These modals display conditionally

    return <>
        <Screen>
            <FlatList
                data={chats}
                style={styles.page}
                keyExtractor={keyExtractor}
                maxToRenderPerBatch={6}
                windowSize={8}
                ListEmptyComponent={ListEmptyComponent}
                refreshControl={
                    <RefreshControl
                        refreshing={refresh}
                        onRefresh={() => {
                            setRefresh(true);
                            onRefresh();
                        }}
                        tintColor={colors.pBeam}
                    />
                }
                ListFooterComponent={ListFooterComponent}
                renderItem={RenderItem}
            />
        </Screen>
        <Modals />
    </> //Return the list of chats in a screen and the modals implicitly on top of them
}

const styles = StyleSheet.create({
    page: {
        marginVertical: 10,
    },
});