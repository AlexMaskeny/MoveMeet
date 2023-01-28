import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { API, Auth, graphqlOperation, Storage } from 'aws-amplify';
import { useFocusEffect } from '@react-navigation/native';
import { useNetInfo } from "@react-native-community/netinfo";

import Screen from '../comps/Screen';
import Loading from '../comps/Loading';
import { colors } from '../config';
import { getUserByCognito, listMessagesByTime, updateMessage, onReceiveMessage, getUserFriends, getChat, updateUser } from '../api/calls';
import useSubSafe from '../hooks/useSubSafe';
import * as logger from '../functions/logger';
import * as locConversion from '../functions/locConversion';
import * as timeLogic from '../functions/timeLogic';
import * as distance from '../functions/distance';
import NoChatsAlert from '../comps/NoChatsAlert';
import PrivateChat from '../comps/PrivateChat';
import SettingsChat from '../comps/SettingsChat';

export default function PrivateChatsPage({ navigation }) {
    const userChatsSub = useRef([]);
    const timeClockSub = useRef();
    const currentUser = useRef();

    const [refresh, setRefresh] = useState(false);
    const [ready, setReady] = useState(false);
    const [noChats, setNoChats] = useState(false);
    const [rerender, setRerender] = useState(false);
    const [chats, setChats] = useState([]);
    const [showSettings, setShowSettings] = useState(false);
    const [settingsChat, setSettingsChat] = useState({});

    const netInfo = useNetInfo();

    useFocusEffect(useCallback(() => {
        if (timeClockSub.current) clearInterval(timeClockSub.current);
        timeClockSub.current = setInterval(updateTime, 10000);
        logger.eLog("[SUBMANAGER] PrivateChatsPage timeClock subscription begun.")

        const initialFunction = async () => {
            try {
                if (netInfo.isConnected || !ready) {
                    const cognitoUser = await Auth.currentAuthenticatedUser();
                    currentUser.current = (await API.graphql(graphqlOperation(getUserByCognito, {
                        id: cognitoUser.attributes.sub
                    }))).data.getUserByCognito;
                    onRefresh();
                }
            } catch (error) {
                logger.warn(error);
            }
        }
        initialFunction();
        return () => {
            try {
                clearInterval(timeClockSub.current);
                logger.eLog("[SUBMANAGER] PrivateChatsPage timeClock subscription closed.");
            } catch (error) { }
            try {
                unsubscribeChats();
            } catch (error) { }
        }
    }, [rerender]));
    useSubSafe(onRefresh);
    const unsubscribeChats = () => {
        for (var i = 0; i < userChatsSub.current.length; i++) {
            userChatsSub.current[i].unsubscribe();
        }
        logger.eLog("[SUBMANAGER] " + userChatsSub.current.length + " PrivateChatsPage userChatsSub subscriptions closed.");
        userChatsSub.current = [];
    }

    const onRefresh = async () => {
        try {
            if (netInfo.isConnected || !ready) {
                const userFriendsResponse = await API.graphql(graphqlOperation(getUserFriends, {
                    UserID: currentUser.current.id,
                }));
                if (userFriendsResponse) {
                    var userFriends = userFriendsResponse.data.getUser.friends;
                    if (userFriends.length == 0) setNoChats(true);
                    else setNoChats(false);
                    var chatData = [];
                    for (var i = 0; i < userFriends.length; i++) {
                        if (userFriends[i].status == "666") continue;
                        const chatResponse = await API.graphql(graphqlOperation(getChat, {
                            id: userFriends[i].chatID
                        }));
                        var chat = chatResponse.data.getChat;
                        chat.friend = userFriends[i];
                        if (chat.members.items.length < 2) continue;
                        if (chat.members.items[0].user.id == currentUser.current.id) { chat.opposingMember = chat.members.items[1]; chat.userChatMembersID = chat.members.items[0].id }
                        else { chat.opposingMember = chat.members.items[0]; chat.userChatMembersID = chat.members.items[1].id }
                        chat.profilePicture = await Storage.get(chat.opposingMember.user.profilePicture.loadFull);
                        chat.createdAt = chat.createdAt.substring(0, 10);

                        const last1 = await API.graphql(graphqlOperation(listMessagesByTime, {
                            chatMessagesId: chat.id,
                            limit: 1
                        }));
                        chat.last1 = [];
                        chat.status = userFriends[i].status;
                        chat.glow = false;
                        chat.latest = "";
                        if (last1) {
                            chat.last1 = last1.data.listMessagesByTime.items;
                            if (last1.data.listMessagesByTime.items[0]) {
                                chat.latest = timeLogic.ago((Date.now() - Date.parse(last1.data.listMessagesByTime.items[0].createdAt)) / 1000);
                                if (!last1.data.listMessagesByTime.items[0].read.includes(currentUser.current.id)) { chat.glow = true }
                            }
                        } else throw "[PRIVATECHATSPAGE] onRefresh failed because of an error getting a chat's last1 messages";
                        if (!chat.glow && (userFriends[i].status == "1" || userFriends[i].status == "3")) chat.glow = false;
                        else chatData.push(chat);
                        if (chat.glow) {
                            if (userFriends[i].status == "1") userFriends[i].status = "0";
                            if (userFriends[i].status == "3") userFriends[i].status = "2";
                            await API.graphql(graphqlOperation(updateUser, {
                                input: {
                                    id: currentUser.current.id,
                                    friends: userFriends
                                }
                            }));
                        }
                        userChatsSub.current.push(API.graphql(graphqlOperation(onReceiveMessage, {
                            chatMessagesId: chat.id,
                        })).subscribe({
                            next: ({ value }) => {
                                logger.eLog("[SUBMANAGER]: userChats notification received.");
                                messageUpdate(value);
                            },
                            error: (error) => {
                                unsubscribeChats();
                                logger.warn(error);
                                logger.eWarn("[SUBMANAGER]: Error detected receiving userChats notification. Reconnecting");
                                setRerender(!rerender);
                            }
                        }));
                    }
                    if (chatData.length == 0) setNoChats(true);
                    sortChats(chatData);
                    setChats(chatData);
                } else throw "[PRIVATECHATSPAGE] onRefresh failed because of an error getting userChats."
            } else throw "[PRIVATECHATSPAGE] onRefresh failed because there is no connection";
        } catch (error) {
            logger.warn("ONREFRESH ERROR ON PRIVATECHATSPAGE: " + error);
        } finally {
            setReady(true);
            setRefresh(false);
            logger.eLog("Finished Refreshing PrivateChatsPage");
        }
    }

    const messageUpdate = async (data) => {
        const value = data.data.onReceiveMessage;
        setChats(existingItems => {
            var Chats = [...existingItems];
            const index = Chats.findIndex(el => el.id == value.chatMessagesId);
            if (index == -1) {
                unsubscribeChats();
                onRefresh();

            } else {
                Chats[index].latest = "Now";
                Chats[index].last1 = [value];  
                if (value.user.id != currentUser.current.id) Chats[index].glow = true;
            }
            return [...Chats];

        });
    }
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
    }
    const navigate = async (item) => { //TRIGGERED UPON "OPEN CHAT". NAVIGATES TO THAT CHAT AFTER THIS.
        try {
            if (item.last1.length >= 1) {
                if (!item.last1[0].read.includes(currentUser.current.id)) {
                    item.last1[0].read.push(currentUser.current.id)
                    await API.graphql(graphqlOperation(updateMessage, {
                        input: {
                            id: item.last1[0].id,
                            read: item.last1[0].read
                        }
                    }))
                    item.glow = false
                }
            }
        } catch (error) {
            logger.error(error);
        }
    }
    const updateTime = () => {
        setChats(existingItems => {
            var Chats = [...existingItems];
            for (var i = 0; i < Chats.length; i++) {
                if (Chats[i].last1.length >= 1) {
                    Chats[i].latest = timeLogic.ago((Date.now() - Date.parse(Chats[i].last1[0].createdAt)) / 1000);
                }
            }
            return [...Chats];
        });
        logger.eLog("PrivateChatsPage TimeClock activated.");
    }
    const openSettings = (item) => {
        setSettingsChat(item);
        setShowSettings(true);
    }
    const closeSettings = () => {
        setShowSettings(false);
        setSettingsChat({});
        setRefresh(true);
        onRefresh();
    }
    const listFooterComponenet = React.useCallback(() => <View height={30} />, []);
    const keyExtractor = React.useCallback((item) => item.id, []);
    const renderItem = React.useCallback(
        ({ item }) => {
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
        }, [chats, ready]
    )
    return (<>
        <Screen>
            <FlatList
                data={chats}
                style={styles.page}
                keyExtractor={keyExtractor}
                maxToRenderPerBatch={6}
                windowSize={8}
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
                ListFooterComponent={listFooterComponenet}
                renderItem={renderItem}
            />
        </Screen>
        <NoChatsAlert privateChat={true} visible={noChats} />
        <SettingsChat item={settingsChat} onClose={closeSettings} visible={showSettings} navigate={() => navigate(settingsChat)} currentUser={currentUser.current} navigation={navigation}/>
        <Loading enabled={!ready} />
    </>)
}

const styles = StyleSheet.create({
    page: {
        marginVertical: 10,
    },
});