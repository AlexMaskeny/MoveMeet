import React, { useCallback, useState, useRef, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { Auth, Storage } from 'aws-amplify';
import { useFocusEffect } from '@react-navigation/native';
import { useNetInfo } from "@react-native-community/netinfo";
import * as Location from 'expo-location';

import Screen from '../comps/Screen';
import Chat from '../comps/Chat';
import { colors, rules } from '../config';
import useSubSafe from '../hooks/useSubSafe';
import * as logger from '../functions/logger';
import * as locConversion from '../functions/locConversion';
import * as timeLogic from '../functions/timeLogic';
import * as distance from '../functions/distance';
import NoLocationAlert from '../comps/NoLocationAlert';
import CreateChat from '../comps/CreateChat';
import IconButton from '../comps/IconButton';
import HelpChatsPage from '../comps/HelpChatsPage';
import BugReport from '../comps/BugReport';
import CheckingForUsers from '../comps/CheckingForUsers';
import NoChatsAlert from '../comps/NoChatsAlert';
import { calls, instances, mmAPI } from '../api/mmAPI';

export default function ChatsPage({ navigation }) {
    const memberStatusSub = useRef();
    const userChatsSub = useRef([]);
    const timeClockSub = useRef();
    const currentUser = useRef();

    const [refresh, setRefresh] = useState(false);
    const [ready, setReady] = useState(false);
    const [locEnabled, setLocEnabled] = useState(true);
    const [rerender, setRerender] = useState(false);
    const [chats, setChats] = useState([]);
    const [showCreate, setShowCreate] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [showBug, setShowBug] = useState(false);
    const [checkingForUsers, setCheckingForUsers] = useState(false);
    const netInfo = useNetInfo();

    //SIMPLY TO MAKE THE HEADERBUTTON WORK
    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <View style={{ alignItems: "center", justifyContent: "center", marginRight: 10, flex: 1 }}>
                    <IconButton
                        icon="add-circle"
                        brand="Ionicons"
                        color={colors.text1}
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
                        color={colors.text1}
                        size={32}
                        onPress={() => setShowHelp(true)}
                    />
                </View>
            )
        })
    }, [navigation])

    useFocusEffect(useCallback(() => {
        if (timeClockSub.current) clearInterval(timeClockSub.current);
        timeClockSub.current = setInterval(updateTime, 10000);
        logger.eLog("[SUBMANAGER] ChatsPage timeClock subscription begun.")

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
                    })
                    currentUser.current.profilePicture.loadFull = await Storage.get(currentUser.current.profilePicture.loadFull);
                    if (memberStatusSub.current) memberStatusSub.current.unsubscribe();
                    memberStatusSub.current = mmAPI.subscribe({
                        call: calls.ON_MEMBER_STATUS_CHANGE,
                        instance: instances.EMPTY,
                        input: {
                            userID: currentUser.current.id
                        },
                        onReceive: () => {
                            logger.eLog("[SUBMANAGER]: onMemberStatusChange notification received.");
                            onRefresh();                            
                        },
                        onError: (error) => {
                            if (memberStatusSub.current) memberStatusSub.current.unsubscribe();
                            logger.warn(error);
                            logger.eWarn("[SUBMANAGER]: Error detected receiving onMemberStatusChange notification. Reconnecting...");
                            setRerender(!rerender);
                        }
                    })
                    onRefresh();
                }
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
            } catch (error) { }
        }
    }, [rerender]));
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

                    const userChatsResponse = await mmAPI.query({
                        call: calls.GET_USER,
                        instance: "chatsFull",
                        input: {
                            id: currentUser.current.id
                        }
                    });

                    if (userChatsResponse) {
                        const userChats = userChatsResponse.chats.items;
                        var chatData = [];
                        for (var i = 0; i < userChats.length; i++) {
                            var chat = userChats[i].chat;
                            if (chat.private) continue;
                            if (!chat.enabled) continue;
                            if (distance.raw(userLocationConverted.lat, userLocationConverted.long, chat.lat, chat.long) > 1000) {
                                setCheckingForUsers(true);
                                throw "Far Away Chat";
                            } 
                            chat.distance = distance.formula(userLocationConverted.lat, userLocationConverted.long, chat.lat, chat.long);

                            const last3 = await mmAPI.query({
                                call: calls.LIST_MESSAGES_BY_TIME,
                                instance: "chatsPage",
                                input: {
                                    chatMessagesId: chat.id,
                                    limit: 3
                                }
                            })

                            chat.last3 = [];
                            chat.glow = false;
                            chat.latest = "New Chat";

                            try {
                                if ((Date.now() - Date.parse(last3.items[0].createdAt)) / 1000 > 60 * 60 * rules.chatDeletionTime) { //if enabled and greater than rules.chatDeletionTime hours old then remove
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
                            try {
                                if (last3.items.length == 0 && (Date.now() - Date.parse(chat.createdAt)) / 1000 > 60 * 60 * rules.chatDeletionTime) {
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

                            if (last3) {
                                chat.last3 = last3.items;
                                if (last3.items[0]) {
                                    chat.latest = timeLogic.ago((Date.now() - Date.parse(last3.items[0].createdAt)) / 1000);
                                    if (!last3.items[0].read.includes(currentUser.current.id)) { chat.glow = true }
                                }
                                getLast3(chat.last3);
                            } else {
                                chat.glow = false;
                                throw "[CHATSPAGE] onRefresh failed because of an error getting a chat's last3 messages"
                            }
                            if (!chat.background.enableColor) {
                                chat.background.full = await Storage.get(chat.background.full);
                                chat.background.loadFull = await Storage.get(chat.background.loadFull);
                                chat.background.isColor = false;
                            } else {
                                chat.background.isColor = true;
                            }
                            chat.createdAt = chat.createdAt.substring(0, 10);
                            chat.numMembers = chat.members.items.length;

                            const userChatMembersIDIndex = chat.members.items.findIndex((el) => {
                                if (el.user.id == currentUser.current.id) return true;
                                return false;
                            });
                            chat.userChatMembersID = chat.members.items[userChatMembersIDIndex].id;
                            if (chat.userChatMembersID == -1) {
                                logger.warn("Userchat member not found in userchat...");
                                //setRerender(true);
                            }
                            for (var j = 0; j < chat.numMembers; j++) {
                                const picture = await Storage.get(chat.members.items[j].user.profilePicture.loadFull);
                                chat.members.items[j].user.picture = picture;

                            }
                            if (chatData.findIndex((el) => el.id == chat.id) == -1) chatData.push(chat);
                            userChatsSub.current.push(mmAPI.subscribe({
                                call: calls.ON_RECEIVE_MESSAGE,
                                instance: "chatsPage",
                                input: {
                                    chatMessagesId: chat.id,
                                },
                                onReceive: ({ value }) => {
                                    logger.eLog("[SUBMANAGER]: userChats notification received.");
                                    messageUpdate(value);
                                },
                                onError: (error) => {
                                    unsubscribeChats();
                                    logger.warn(error);
                                    logger.eWarn("[SUBMANAGER]: Error detected receiving userChats notification. Reconnecting");
                                    setRerender(!rerender);
                                },
                                sendData: true
                            }));
                        }
                        setCheckingForUsers(false);
                        sortChats(chatData);
                        setChats(chatData);
                    } else throw "[CHATSPAGE] onRefresh failed because of an error getting userChats."
                } else {
                    setLocEnabled(false);
                    setChats([])
                    throw "[CHATSPAGE] onRefresh failed because location is disabled.";
                }
            } else {
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
                if (Chats[index].last3.length > 3) Chats[index].last3.splice(-1);
                Chats[index].latest = "Now";
                if (value.user.id != currentUser.current.id) Chats[index].glow = true;
            }
            sortChats(Chats);
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
        logger.eLog("ChatsPage TimeClock activated.");
    }
    const enableLocation = async () => {
        setLocEnabled(true);
        setReady(false);
        navigation.navigate("LoadingPage");
    }

    //UI COMPONENTS
    const ListEmptyComponent = React.useCallback(() => {
        if (ready && locEnabled) return <NoChatsAlert />;
        else if (ready && !locEnabled) return <NoLocationAlert enable={enableLocation} /> 
    },[chats,ready])
    const ListFooterComponent = React.useCallback(() => {
        if (ready) return <View style={{ height: 30 }} />;
        else return <ActivityIndicator color={colors.pBeam} size="large" style={{marginTop: 10} } />
    }, [ready]);
    const keyExtractor = React.useCallback((item) => item.id, [])
    const renderItem = React.useCallback(
        ({ item }) => {
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
        }, [chats, ready, checkingForUsers, locEnabled]
    )
    return (
        <>
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
                            tintColor={colors.pBeam}
                        />
                    }
                    ListFooterComponent={ListFooterComponent}
                    ListEmptyComponent={ListEmptyComponent}
                    renderItem={renderItem}
                />
            </Screen>
            <CheckingForUsers visible={checkingForUsers} />
            <CreateChat visible={showCreate} onClose={() => setShowCreate(false)} currentUser={currentUser.current} navigation={navigation}/>
            <HelpChatsPage visible={showHelp} onClose={() => setShowHelp(false)} onCreateChat={() => setShowCreate(true)} openBug={()=>setShowBug(true)}/>
            <BugReport visible={showBug} onClose={() => setShowBug(false)} currentUser={currentUser.current}/>

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