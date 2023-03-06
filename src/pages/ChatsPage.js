//region 3rd Party Imports
import React, { useCallback, useState, useRef, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { Auth, Storage } from 'aws-amplify';
import { useFocusEffect } from '@react-navigation/native';
import { useNetInfo } from "@react-native-community/netinfo";
import * as Location from 'expo-location';
//endregion
//region 1st Party Imports
import Screen from '../comps/Screen';
import Chat from '../comps/Chat';
import NoLocationAlert from '../comps/NoLocationAlert';
import CreateChat from '../comps/CreateChat';
import IconButton from '../comps/IconButton';
import HelpChatsPage from '../comps/HelpChatsPage';
import BugReport from '../comps/BugReport';
import CheckingForUsers from '../comps/CheckingForUsers';
import NoChatsAlert from '../comps/NoChatsAlert';
import { calls, instances, mmAPI } from '../api/mmAPI';
import { dark_colors, rules } from '../config';
import * as logger from '../functions/logger';
import * as locConversion from '../functions/locConversion';
import * as timeLogic from '../functions/timeLogic';
import * as distance from '../functions/distance';
//endregion

export default function ChatsPage({ navigation }) {
    /* =============[ VARS ]============ */
    //region useRef variables
    const memberStatusSub = useRef(); //Subscription to get the chats the user is currently a member of
    const userChatsSub = useRef([]);  //A list of subscriptions to messages for the chats currently displayed
    const timeClockSub = useRef();    //Subscription for the timeClock. (timeClockSub.current = setInterval(...))
    const currentUser = useRef();     //The current dynamoDB user (not cognito)
    const subSafeSub = useRef();      //Subscription to the SubSafety mechanism
    //endregion
    //region useState variables
    const [refresh, setRefresh] = useState(false);                   //Are we currently attempting to get chats?
    const [ready, setReady] = useState(false);                       //Have we attempted to get chats at least once?
    const [locEnabled, setLocEnabled] = useState(true);              //Does the user have their location on? If no display a no location alert
    const [chats, setChats] = useState([]);                          //List of the chats currently displayed
    const [showCreate, setShowCreate] = useState(false);             //Should display the chat creation modal?
    const [showHelp, setShowHelp] = useState(false);                 //Should display the help modal?
    const [showBug, setShowBug] = useState(false);                   //Should display the bug report modal?
    const [checkingForUsers, setCheckingForUsers] = useState(false); //Should display the checkingForUsers modal?
    //endregion
    const netInfo = useNetInfo();

    /* =============[ HOOKS ]============ */
    //region [HOOK] "useEffect, [navigation]" = Header Initialization For Screen Specific Icons
    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <View style={{ alignItems: "center", justifyContent: "center", marginRight: 10, flex: 1 }}>
                    <IconButton
                        icon="add-circle"
                        brand="Ionicons"
                        color={dark_colors.text1}
                        size={32}
                        onPress={() => setShowCreate(true)}
                    />
                </View>
            ),
            headerLeft: () => (
                <View style={{ alignItems: "center", justifyContent: "center", marginLeft: 10, flex: 1 }}>
                    <IconButton
                        icon="help-circle"
                        brand="Ionicons"
                        color={dark_colors.text1}
                        size={32}
                        onPress={() => setShowHelp(true)}
                    />
                </View>
            )
        })
    }, [navigation])
    //endregion
    //region [HOOK] "useFocusEffect, []" = Get data on open page & on rerender
    useFocusEffect(useCallback(() => {
        //region Enable the time clock
        if (timeClockSub.current) clearInterval(timeClockSub.current);
        timeClockSub.current = setInterval(updateTime, 10000);
        logger.eLog("[SUBMANAGER] ChatsPage timeClock subscription begun.");
        //endregion

        //Async calls must live in a block like this in useEffect & useFocusEffect functions
        (async function () {
            try {
                //Ensure the user is connected. Sometimes it displays disconnected on first run through, so always run on first run through.
                if (!netInfo.isConnected && ready) return;

                //region Get the current user & its profile picture
                const cognitoUser = await Auth.currentAuthenticatedUser();
                currentUser.current = await mmAPI.query({
                    call: calls.GET_USER_BY_COGNITO,
                    instance: instances.LEAST,
                    input: {
                        id: cognitoUser.attributes.sub
                    }
                });
                const loadFull = await Storage.get(currentUser.current.profilePicture.loadFull);
                currentUser.current.profilePicture.uri = {
                    full: loadFull,
                    loadFull: loadFull,
                    disabled: false,
                    fullKey: currentUser.current.profilePicture.loadFull
                }
                //endregion
                //region Subscribe to chat membership updates (calls onRefresh on new chat membership)
                memberStatusSub?.current?.unsubscribe();
                memberStatusSub.current = mmAPI.subscribe({
                    call: calls.ON_MEMBER_STATUS_CHANGE,
                    instance: "chatsPage",
                    input: {
                        userID: currentUser.current.id
                    },
                    onReceive: () => {
                        logger.eLog("[SUBMANAGER]: onMemberStatusChange notification received.");
                        onRefresh();
                    },
                    onError: (error) => {
                        memberStatusSub?.current?.unsubscribe();
                        logger.warn(error);
                        logger.eWarn("[SUBMANAGER]: Error detected receiving onMemberStatusChange notification. Reconnecting...");
                    }
                });
                logger.eLog("[SUBMANAGER] onMemberStatusChange subscription begun.");
                //endregion

                //Now, get the chats the user is a member of.
                await onRefresh();
            } catch (error) {
                logger.warn(error);
            }
        })();

        return () => {
            //region When the screen leaves focus, unsubscribe from everything
            //region Remove the SubSafe
            try {
                subSafeSub.current();
                logger.eLog("[SUBMANAGER] ChatsPage subSafe subscription closed");
            } catch (error) { }
            //endregion
            //region Disable the time clock
            try {
                clearInterval(timeClockSub.current);
                logger.eLog("[SUBMANAGER] ChatsPage timeClock subscription closed.");
            } catch (error) { }
            //endregion
            //region Unsubscribe from chat membership updates (AKA stop calling onRefresh)
            try {
                memberStatusSub.current.unsubscribe();
                logger.eLog("[SUBMANAGER] ChatsPage onMemberStatusChange subscription closed.");
            } catch (error) { }
            //endregion
            //region Unsubscribe from message updates for chats the current user a member of
            try {
                unsubscribeChats();
            } catch (error) { }
            //endregion
            //endregion
        }
    }, []));
    //endregion

    /* =============[ FUNCS ]============ */
    //region [FUNC ASYNC] "onRefresh = async ()" = Get data and call necessary functions to update the UI and subscriptions [warning is okay]
    const onRefresh = async () => {
        try {
            //Ensure the user is connected. Sometimes it displays disconnected on first run through, so always run on first run through.
            if (netInfo.isConnected || !ready) {
                //Unsubscribe from the previous message subscriptions
                unsubscribeChats();

                //region Remove previous SubSafe
                try {
                    subSafeSub.current();
                    logger.eLog("[SUBMANAGER] ChatsPage subSafe subscription closed");
                } catch (error) { }
                //endregion

                //If locations are enabled, continue.
                const locPerm = await Location.getForegroundPermissionsAsync();
                if (locPerm.granted) {
                    //region Get the current user's location (in coordinate degrees) and convert it to units comparable to database units (ft)
                    const userLocation = await Location.getLastKnownPositionAsync();
                    const userLocationConverted = locConversion.toChat(userLocation.coords.latitude, userLocation.coords.longitude);
                    //endregion
                    //region Get the chats the user is a member of (membership is assigned on a subscription created on LoadingPage)
                    const userChatsResponse = await mmAPI.query({
                        call: calls.GET_USER,
                        instance: "chatsFull",
                        input: {
                            id: currentUser.current.id
                        }
                    });
                    //endregion
                    if (userChatsResponse?.chats.items) {
                        const userChats = userChatsResponse.chats.items;
                        let chatData = [];

                        //Iterate through each chat and get the necessary data to display the chat on UI and start subscriptions (or skip chat)
                        for (let i = 0; i < userChats.length; i++) {
                            //A mutable version of the chat at this index
                            let chat = userChats[i].chat;

                            //if the chat is disabled or private then skip to next chat
                            if (chat.private) continue;
                            if (!chat.enabled) continue;

                            //region Get the chat's distance from the user [the warning is okay]
                            //If the chat is somehow further than the limit (should occur if phone is off for a while) then error.
                            if (distance.raw(userLocationConverted.lat, userLocationConverted.long, chat.lat, chat.long) > 1000) {
                                setCheckingForUsers(true);
                                throw "Far Away Chat";
                            }
                            //Otherwise, set the chat's distance from the user
                            chat.distance = distance.formula(userLocationConverted.lat, userLocationConverted.long, chat.lat, chat.long);
                            //endregion
                            //region Get the last 3 messages of the chat
                            const last3 = await mmAPI.query({
                                call: calls.LIST_MESSAGES_BY_TIME,
                                instance: "chatsPage",
                                input: {
                                    chatMessagesId: chat.id,
                                    limit: 3
                                }
                            })
                            chat.last3 = [];
                            //endregion
                            //region Verify the chat isn't too old
                            //If there is a last message, and it was sent a while ago (defined in config), then disable it and skip it.
                            try {
                                if ((Date.now() - Date.parse(last3.items[0].createdAt)) / 1000 > 60 * 60 * rules.chatDeletionTime) {
                                    await mmAPI.mutate({
                                        call: calls.UPDATE_CHAT,
                                        input: {
                                            id: chat.id,
                                            enabled: false
                                        }
                                    });
                                    continue;
                                }
                            } catch (error) { }
                            //If there is no last message, then if the chat was created a while ago (defined in config), then disable it and skip it.
                            try {
                                if (last3.items.length === 0 && (Date.now() - Date.parse(chat.createdAt)) / 1000 > 60 * 60 * rules.chatDeletionTime) {
                                    await mmAPI.mutate({
                                        call: calls.UPDATE_CHAT,
                                        input: {
                                            id: chat.id,
                                            enabled: false
                                        }
                                    });
                                    continue;
                                }
                            } catch (error) { }
                            //endregion
                            //region Download the profile pictures of the users who sent the last 3 messages. [the warning is okay]
                            if (last3?.items) {
                                chat.last3 = last3.items;
                                //If there is at least one message in the chat, set the "last message time" value to the latest message's creation time
                                //AND If the user hasn't read the latest message, then make the chat glow
                                if (last3.items.length > 0) {
                                    chat.latest = timeLogic.ago((Date.now() - Date.parse(last3.items[0].createdAt)) / 1000);
                                    chat.glow = !last3.items[0].read.includes(currentUser.current.id);
                                }
                                //Otherwise set the "last message time" to New Chat
                                else {
                                    chat.glow = false;
                                    chat.latest = "New Chat";
                                }

                                //Get the profile pictures of the users who sent the last 3 messages.
                                await getLast3(chat.last3);
                            }
                            //If there was a problem with the last 3 then throw a BREAKING error
                            else throw "[CHATSPAGE] onRefresh failed because of an error getting a chat's last3 messages"
                            //endregion
                            //region Get the chat's background color/image
                            if (!chat.background.enableColor) {
                                const full = await Storage.get(chat.background.full);
                                const loadFull = await Storage.get(chat.background.loadFull);
                                chat.background.isColor = false;
                                chat.background.uri = {
                                    full: full,
                                    loadFull: loadFull,
                                    fullKey: chat.background.full,
                                }
                            } else {
                                chat.background.isColor = true;
                                chat.background.uri = {};
                            }
                            //endregion

                            chat.createdAt = chat.createdAt.substring(0, 10);
                            chat.numMembers = chat.members.items.length;

                            //region Get the current user's chatMember ID associated with this chat
                            const userChatMembersIDIndex = chat.members.items.findIndex((el) => {
                                return el.user.id === currentUser.current.id;
                            });
                            chat.userChatMembersID = chat.members.items[userChatMembersIDIndex].id;
                            //endregion
                            //region Iterate through the chat's members and download their profile pictures
                            for (let j = 0; j < chat.numMembers; j++) {
                                const picture = await Storage.get(chat.members.items[j].user.profilePicture.loadFull);
                                chat.members.items[j].user.picture = {
                                    loadFull: picture,
                                    full: picture,
                                    fullKey: chat.members.items[j].user.profilePicture.loadFull
                                };
                            }
                            //endregion

                            //Add the chat to the chatData variable (so long as it wasn't already added)
                            if (chatData.findIndex((el) => el.id === chat.id) === -1) chatData.push(chat);

                            //region Subscribe to the chat's message updates
                            userChatsSub.current.push(mmAPI.subscribe({
                                call: calls.ON_RECEIVE_MESSAGE,
                                instance: "chatsPage",
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

                                },
                                sendData: true
                            }));
                            //endregion
                        }
                        //region Update the chats based on the new data
                        //If a chat was found quite far away, we will display a message saying "Checking for Chats..."
                        //Once we finish then we can disable this
                        setCheckingForUsers(false);

                        //After we finish getting the chat data we can sort them and set them
                        sortChats(chatData);
                        setChats(chatData);

                        //Enable the subSafe for the updated subscriptions
                        subSafeSub.current = mmAPI.subSafe(() => onRefresh());
                        //endregion
                    }
                    //If there is a problem getting the user chats then throw a BREAKING error
                    else throw "[CHATSPAGE] onRefresh failed because of an error getting userChats."
                }
                //If locations are disabled then display location disabled & throw non-breaking error
                else {
                    setLocEnabled(false);
                    setChats([])
                    throw "[CHATSPAGE] onRefresh failed because location is disabled.";
                }

            }
            //if not connected then display no connection and throw a non-breaking error
            else throw "[CHATSPAGE] onRefresh failed because there is no connection";

        } catch (error) {
            logger.warn("ONREFRESH ERROR: " + error);
        }
        finally {
            setReady(true);
            setRefresh(false);
            logger.eLog("Finished Refreshing ChatsPage");
        }
    }
    //endregion
    //region [FUNCTION]   "unsubscribeChats = ()" = Unsubscribes from chat message updates
    const unsubscribeChats = () => {
        for (let i = 0; i < userChatsSub.current.length; i++) {
            userChatsSub.current[i].unsubscribe();
        }
        logger.eLog("[SUBMANAGER] " + userChatsSub.current.length + " ChatsPage userChatsSub subscriptions closed.");
        userChatsSub.current = [];
    }
    //endregion
    //region [ASYNC FUNC] "getLast3 = async (last3)" = Downloads the profile pictures for the inputted array of messages
    const getLast3 = async (last3) => {
        for (let i = 0; i < last3.length; i++) {
            const picture = await Storage.get(last3[i].user.profilePicture.loadFull);
            last3[i].picture = {
                loadFull: picture,
                full: picture,
                fullKey: last3[i].user.profilePicture.loadFull
            }
        }
    }
    //endregion
    //region [ASYNC FUNC] "messageUpdate = async (data)" = Called when receiving a message from subscription. Updates the chat locally to reflect the new message.
    const messageUpdate = async (data) => {
        let newMessage = data;
        //region Download the new last3's picture
        const newMessageLoadFull = await Storage.get(newMessage.user.profilePicture.loadFull);
        newMessage.picture = {
            loadFull: newMessageLoadFull,
            full: newMessageLoadFull,
            fullKey: newMessage.user.profilePicture.loadFull
        }
        //endregion

        setChats(existingItems => {
            let Chats = [...existingItems];

            //Find the index of the chat that received a message
            const index = Chats.findIndex(el => el.id === newMessage.chatMessagesId);

            //Update that chat's last3
            if (Chats[index]?.last3) {
                Chats[index].last3.unshift(newMessage);
                if (Chats[index].last3.length > 3) Chats[index].last3.splice(-1);
                Chats[index].latest = "Now";
                if (newMessage.user.id !== currentUser.current.id) Chats[index].glow = true;
            }

            //Put that chat to the top
            sortChats(Chats);
            return [...Chats];
        });
    }
    //endregion
    //region [FUNCTION]   "sortChats = (chatData)" = Put the most recently active chat on top. If no recently active chat, put the most recently created chat on top
    const sortChats = (chatData) => {
        chatData.sort((a, b) => {
            if (a.last3.length === 0 && b.last3.length !== 0) {
                return 1;
            } else if (a.last3.length !== 0 && b.last3.length === 0) {
                return -1;
            } else if (a.last3.length === 0 && b.last3.length === 0) {
                return 0;
            } else {
                if (Date.parse(a.last3[0].createdAt) > Date.parse(b.last3[0].createdAt)) {
                    return -1;
                } else {
                    return 1;
                }
            }
        })
    }
    //endregion
    //region [FUNCTION]   "navigate = async (item)" = When clicking "open chat" this function is called. Navigates to that chat.
    const navigate = async (item) => {
        try {
            if (item.last3.length >= 1) {
                if (!item.last3[0].read.includes(currentUser.current.id)) {
                    item.last3[0].read.push(currentUser.current.id)
                    await mmAPI.mutate({
                        call: calls.UPDATE_MESSAGE,
                        input: {
                            id: item.last3[0].id,
                            read: item.last3[0].read
                        }
                    })
                    item.glow = false
                }
            }
        } catch (error) {
            logger.error(error);
        }
    }
    //endregion
    //region [FUNCTION]   "updateTime = ()" = Updates the chat time from last message. Triggered by time clock
    const updateTime = () => {
        setChats(existingItems => {
            let Chats = [...existingItems];
            for (let i = 0; i < Chats.length; i++) {
                if (Chats[i].last3.length >= 1) {
                    Chats[i].latest = timeLogic.ago((Date.now() - Date.parse(Chats[i].last3[0].createdAt)) / 1000);
                }
            }
            return [...Chats];
        });
        logger.eLog("ChatsPage TimeClock activated.");
    }
    //endregion
    //region [FUNCTION]   "enableLocation = ()" = If you enable location then navigate to LoadingPage for refresh.
    const enableLocation = () => {
        setLocEnabled(true);
        setReady(false);
        navigation.navigate("LoadingPage");
    }
    //endregion

    /* =============[ LIST ]============ */
    const keyExtractor = React.useCallback((item) => item.id, []);
    //region [CALL COMP] "ListEmptyComponent, [chats,ready]" = [IF] the chat is empty [AND] ready [AND] loc is enabled [THEN] display there are no nearby chats. [ELSE IF] loc is disabled [THEN] display no loc.
    const ListEmptyComponent = React.useCallback(() => {
        if (ready && locEnabled) return <NoChatsAlert />;
        else if (ready && !locEnabled) return <NoLocationAlert enable={enableLocation} />
    },[chats,ready]);
    //endregion
    //region [CALL COMP] "ListFooterComponent, [ready]" = Displays a spacer when ready. When not ready, displays an activity indicator.
    const ListFooterComponent = React.useCallback(() => {
        if (ready) return <View style={{ height: 30 }} />;
        else return <ActivityIndicator color={dark_colors.pBeam} size="large" style={{marginTop: 10} } />
    }, [ready]);
    //endregion
    //region [CALL COMP] "RenderItem, [chats, ready, checkingForUsers, locEnabled]" = Render the chat component for each chat
    const RenderItem = React.useCallback(({ item }) => {
            if (ready && !checkingForUsers && locEnabled) {
                return (
                    <Chat
                        background={item.background}
                        members={item.members.items}
                        latest={item.latest}
                        onPress={() => navigate(item)}
                        glow={item.glow}
                        userChatMembersID={item.userChatMembersID}
                        id={item.id}
                        user={currentUser.current}
                        last3={item.last3}
                        numMembers={item.numMembers}
                        distance={item.distance}
                        title={item.name}
                        created={item.createdAt}
                        navigation={navigation}
                    />
                )
            } else {
                return (<></>);
            }
        }, [chats, ready, checkingForUsers, locEnabled]);
    //endregion

    /* =============[ COMPS ]============ */
    //region [COMPONENT] "Modals" = Renders modals implicitly on top of the screen
    const Modals = useCallback(() => <>
        <CheckingForUsers visible={checkingForUsers} />
        <CreateChat
            visible={showCreate}
            onClose={() => setShowCreate(false)}
            currentUser={currentUser.current}
            navigation={navigation}
        />
        <HelpChatsPage
            visible={showHelp}
            onClose={() => setShowHelp(false)}
            onCreateChat={() => setShowCreate(true)}
            openBug={()=>setShowBug(true)}
        />
        <BugReport
            visible={showBug}
            onClose={() => setShowBug(false)}
            currentUser={currentUser.current}
        />
    </>,[showCreate,showBug,showHelp]);
    //endregion

    return <>
        <Screen>
            <FlatList
                data={chats}
                style={styles.page}
                keyExtractor={keyExtractor}
                maxToRenderPerBatch={10}
                windowSize={4}
                refreshControl={
                    <RefreshControl
                        refreshing={refresh}
                        onRefresh={() => {
                            setRefresh(true);
                            onRefresh();
                        }}
                        tintColor={dark_colors.pBeam}
                    />
                }
                ListFooterComponent={ListFooterComponent}
                ListEmptyComponent={ListEmptyComponent}
                renderItem={RenderItem}
            />
        </Screen>
        <Modals />
    </> //Return the list of chats in a screen and the modals implicitly on top of them
}
const styles = StyleSheet.create({
    //region logo
    logo: {
        height: 60,
        width: "100%"
    },
    //endregion
    //region page
    page: {
        padding: 14,
    },
    //endregion
    //region header
    header: {
        backgroundColor: dark_colors.container,
        height: 100,
    },
    //endregion
});