import React, { useCallback, useState, useRef } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { API, Auth, graphqlOperation, Storage} from 'aws-amplify';
import { useFocusEffect } from '@react-navigation/native';
import { useNetInfo } from "@react-native-community/netinfo";
import * as Location from 'expo-location';

import Screen from '../comps/Screen';
import Loading from '../comps/Loading';
import Chat from '../comps/Chat';
import { getUserByCognito, getUserChats, listMessagesByTime, updateMessage, onMemberStatusChange, onReceiveMessage } from '../api/calls';
import { colors } from '../config';
import useSubSafe from '../hooks/useSubSafe';
import * as logger from '../functions/logger';
import * as locConversion from '../functions/locConversion';
import * as timeLogic from '../functions/timeLogic';
import * as distance from '../functions/distance';
import NoConnectionAlert from '../comps/NoConnectionAlert';
import NoLocationAlert from '../comps/NoLocationAlert';
import NoChatsAlert from '../comps/NoChatsAlert';

export default function ChatsPage({ navigation }) {
    const memberStatusSub = useRef();
    const userChatsSub = useRef([]);
    const timeClockSub = useRef();
    const currentUser = useRef();

    const [refresh, setRefresh] = useState(false);
    const [ready, setReady] = useState(false);
    const [connected, setConnected] = useState(true);
    const [locEnabled, setLocEnabled] = useState(true);
    const [noChats, setNoChats] = useState(false);
    const [rerender, setRerender] = useState(false);
    const [chats, setChats] = useState([]);

    const netInfo = useNetInfo();


    useFocusEffect(useCallback(() => {
        if (timeClockSub.current) clearInterval(timeClockSub.current);
        logger.eLog("Generating Time Clock...");
        timeClockSub.current = setInterval(updateTime, 10000);
        logger.eLog("[SUBMANAGER] ChatsPage timeClock subscription begun.")

        const initialFunction = async () => {
            try {
                if (netInfo.isConnected || !ready) {
                    const cognitoUser = await Auth.currentAuthenticatedUser();
                    currentUser.current = (await API.graphql(graphqlOperation(getUserByCognito, {
                        id: cognitoUser.attributes.sub
                    }))).data.getUserByCognito;

                    if (memberStatusSub.current) memberStatusSub.current.unsubscribe();
                    memberStatusSub.current = API.graphql(graphqlOperation(onMemberStatusChange, {
                        userID: currentUser.current.id
                    })).subscribe({
                        next: () => {
                            logger.eLog("[SUBMANAGER]: onMemberStatusChange notification received.");
                            onRefresh();
                        },
                        error: (error) => {
                            if (memberStatusSub.current) memberStatusSub.current.unsubscribe();
                            logger.warn(error);
                            logger.eWarn("[SUBMANAGER]: Error detected receiving onMemberStatusChange notification. Reconnecting...");
                            setRerender(!rerender);
                        }
                    })
                    onRefresh();
                } else setConnected(false);
            } catch (error) {
                logger.warn(error);
            }
        }
        initialFunction();
        logger.eLog("[SUBMANAGER] onMemberStatusChange subscription begun.")
        return () => {
            try {
                clearInterval(timeClockSub.current);
                logger.eLog("[SUBMANAGER] ChatsPage timeClock subscription closed.");
            } catch (error) { }
            try {
                memberStatusSub.current.unsubscribe();
                logger.eLog("[SUBMANAGER] ChatsPage onMemberStatusChange subscription closed.");
            } catch (error) { }
            try {
                unsubscribeChats();
            } catch (error) {  }
        }
    },[rerender]));
    useSubSafe(onRefresh);
    const unsubscribeChats = () => {
        for (var i = 0; i < userChatsSub.current.length; i++) {
            userChatsSub.current[i].unsubscribe();
        }
        logger.eLog("[SUBMANAGER] " + userChatsSub.current.length + " ChatsPage userChatsSub subscriptions closed.");
        userChatsSub.current = [];
    }

    const onRefresh = async () => {
        try {
            if (netInfo.isConnected || !ready) {
                const locPerm = await Location.getForegroundPermissionsAsync();
                unsubscribeChats();
                if (locPerm.granted) {
                    const userLocation = await Location.getLastKnownPositionAsync();
                    const userLocationConverted = locConversion.toChat(userLocation.coords.latitude, userLocation.coords.longitude);

                    const userChatsResponse = await API.graphql(graphqlOperation(getUserChats, {
                        id: currentUser.current.id
                    }));
                    if (userChatsResponse) {
                        const userChats = userChatsResponse.data.getUser.chats.items;
                        if (userChats.length == 0) setNoChats(true);
                        else setNoChats(false);
                        var chatData = [];
                        for (var i = 0; i < userChats.length; i++) {
                            var chat = userChats[i].chat;
                            chat.background.full = await Storage.get(chat.background.full);
                            chat.background.loadFull = await Storage.get(chat.background.loadFull);
                            chat.createdAt = chat.createdAt.substring(0, 10);
                            chat.numMembers = chat.members.items.length;
                            chat.distance = distance.formula(userLocationConverted.lat, userLocationConverted.long, chat.lat, chat.long);

                            const last3 = await API.graphql(graphqlOperation(listMessagesByTime, {
                                chatMessagesId: chat.id,
                                limit: 3
                            }));
                            chat.last3 = [];
                            chat.glow = false;
                            chat.latest = "New Chat";
                            if (last3) {
                                chat.last3 = last3.data.listMessagesByTime.items;
                                getLast3(chat.last3);
                                if (last3.data.listMessagesByTime.items[0]) {
                                    chat.latest = timeLogic.ago((Date.now() - Date.parse(last3.data.listMessagesByTime.items[0].createdAt)) / 1000);
                                    if (!last3.data.listMessagesByTime.items[0].read.includes(currentUser.current.id)) { chat.glow = true }
                                }
                            } else {
                                chat.glow = false;
                                throw "[CHATSPAGE] onRefresh failed because of an error getting a chat's last3 messages"
                            }

                            for (var j = 0; j < chat.numMembers; j++) {
                                chat.members.items[j].user.picture = await Storage.get(chat.members.items[j].user.profilePicture.loadFull);
                            }
                            chatData.push(chat);
                            userChatsSub.current.push(API.graphql(graphqlOperation(onReceiveMessage, {
                                chatMessagesId: chatData[i].id,
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
                        sortChats(chatData);
                        setChats(chatData);
                    } else throw "[CHATSPAGE] onRefresh failed because of an error getting userChats."
                } else {
                    setLocEnabled(false);
                    throw "[CHATSPAGE] onRefresh failed because location is disabled.";
                }
            } else {
                setConnected(false);
                throw "[CHATSPAGE] onRefresh failed because there is no connection";
            }
        } catch (error) {
            logger.warn("ONREFRESH ERROR: " + error);
        } finally {
            setReady(true);
            setRefresh(false);
            logger.eLog("Finished Refreshing");
        }
    }
    //HELPER FUNCTIONS
    const getLast3 = async (last3) => {
        for (var i = 0; i < last3.length; i++) {
            last3[i].picture = await Storage.get(last3[i].user.profilePicture.loadFull);
        }
    }
    const messageUpdate = async (data) => {
        const value = data.data.onReceiveMessage; 

        setChats(existingItems => {
            var Chats = [...existingItems];
            const index = Chats.findIndex(el => el.id == value.chatMessagesId);
            if (Chats[index].last3) {
                Chats[index].last3.unshift(value);
                Chats[index].last3.splice(-1);
                Chats[index].latest = "Now";
                if (value.user.id != currentUser.current.id) Chats[index].glow = true;
            }

            return [...Chats];
        });
    }
    const sortChats = (chatData) => {
        chatData.sort((a, b) => {
            if (a.last3.length == 0 && b.last3.length != 0) {
                return 1;
            } else if (a.last3.length != 0 && b.last3.length == 0) { 
                return -1;
            } else if (a.last3.length == 0 && b.last3.length == 0) {
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

    //UI ORIENTED FUNCTIONS
    const navigate = async (item) => { //TRIGGERED UPON "OPEN CHAT". NAVIGATES TO THAT CHAT AFTER THIS.
        try {
            if (item.last3.length >= 1) {
                if (!item.last3[0].read.includes(currentUser.current.id)) {
                    item.last3[0].read.push(currentUser.current.id)
                    await API.graphql(graphqlOperation(updateMessage, {
                        input: {
                            id: item.last3[0].id,
                            read: item.last3[0].read
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
                if (Chats[i].last3.length >= 1) {
                    Chats[i].latest = timeLogic.ago((Date.now() - Date.parse(Chats[i].last3[0].createdAt)) / 1000);
                }
            }
            return [...Chats];
        });
        logger.eLog("TimeClock activated.");
    }
    const enableLocation = async () => {
        const result = await Location.requestForegroundPermissionsAsync();
        if (result.granted) {
            setLocEnabled(true);
            navigation.navigate("LoadingPage");
        }
    }

    //UI COMPONENTS
    const listFooterComponenet = React.useCallback(() => <View height={30} />, []);
    const keyExtractor = React.useCallback((item) => item.id, [])
    const renderItem = React.useCallback(
        ({ item }) => {
            if (ready) {
                return (
                    <Chat
                        background={{
                            uri: item.background.full,
                            loadImage: item.background.loadFull ? item.background.loadFull : item.background.full,
                            key: "background" + item.id,
                        }}
                        members={item.members.items}
                        latest={item.latest}
                        onPress={() => navigate(item)}
                        glow={item.glow}
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
        }, [chats, ready]
    )
    return (
        <>
            <Screen>
                <FlatList
                    data={chats}
                    style={styles.page}
                    keyExtractor={keyExtractor}
                    maxToRenderPerBatch={4}
                    windowSize={6}
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
            <NoChatsAlert visible={noChats} />
            <NoLocationAlert visible={!locEnabled} enable={enableLocation}/>
            <NoConnectionAlert visible={!connected} />
            <Loading enabled={!ready} />
        </>
    );
}
const styles = StyleSheet.create({
    logo: {
        height: 60,
        width: "100%"
    },
    page: {
        padding: 14,
    },
    header: {
        backgroundColor: colors.container,
        height: 100,
    },
})