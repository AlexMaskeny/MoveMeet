import React from 'react';
import { StyleSheet, Image, RefreshControl, View, FlatList } from 'react-native';
import * as Location from 'expo-location';
import { getUserByCognito, onReceiveMessage, createChatMembers, listMessagesByTime, getUserChats, getChat, onMemberStatusChange, updateMessage } from '../api/calls';
import { API, Auth, graphqlOperation, Storage, Hub } from 'aws-amplify';
import { CONNECTION_STATE_CHANGE, ConnectionState } from '@aws-amplify/pubsub';
import { CONNECTION_INIT_TIMEOUT } from '@aws-amplify/pubsub/lib-esm/Providers/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as TaskManager from 'expo-task-manager';

import { colors, debug, locConversion, distance, timeLogic } from '../config';
import Screen from '../comps/Screen';
import Chat from '../comps/Chat';
import DisabledChat from '../comps/DisabledChat';
import Loading from '../comps/Loading';
import { useFocusEffect } from '@react-navigation/native';

//DESCRIPTION: A primary page of the SecondaryNav
//             is the hub for all localized chats



function ChatsPage({ navigation, route }) {
    const [ready, setReady] = React.useState(false);
    const [refresh, setRefresh] = React.useState(false);
    const [locEnabled, setLocEnabled] = React.useState(true);
    const [chats, setChats] = React.useState([]);
    const [update, setUpdate] = React.useState(false);
    const chatsRef = React.useRef([]);
    const user = React.useRef();
    var memberSub;
    var chatSubs = React.useRef([]);
    var timeClock;
    const shouldGlow = React.useRef(true);

    const getLast3Images = async (last3) => {
        for (var i = 0; i < last3.length; i++) {
            const loadFull = await Storage.get(last3[i].user.profilePicture.loadFull);
            last3[i].picture = loadFull;
        }
    }

    const subscribe = async () => {
        try {
            unSubscribeMembers();
            memberSub = API.graphql(graphqlOperation(onMemberStatusChange, {
                userID: user.current.id
            })).subscribe({
                next: () => { onRefresh() },
                error: (error) => { setUpdate(!update) }
            });
        } catch (error) {
            if(debug) console.log(error)
        }
    }

    const rearrangeChats = async (value) => {
        const index = chatsRef.current.findIndex(el => el.id == value.chatMessagesId)
        //if (value.type == "Regular") {
            if (chatsRef.current[index].last3.length == 3) {
                chatsRef.current[index].last3[2] = chatsRef.current[index].last3[1];
                chatsRef.current[index].last3[1] = chatsRef.current[index].last3[0];
                chatsRef.current[index].last3[0] = value;
            } 
            if (chatsRef.current[index].last3.length == 2) {
                chatsRef.current[index].last3.push(chatsRef.current[index].last3[1])
                chatsRef.current[index].last3[1] = chatsRef.current[index].last3[0];
                chatsRef.current[index].last3[0] = value;
            }
            if (chatsRef.current[index].last3.length == 1) {
                chatsRef.current[index].last3.push(chatsRef.current[index].last3[0]);
                chatsRef.current[index].last3[0] = value;
            }
            if (chatsRef.current[index].last3.length == 0) {
                chatsRef.current[index].last3.push(value);
            }
        //}
        getLast3Images(chatsRef.current[index].last3);
        chatsRef.current[index].latest = "Now"
        if (value.user.id != user.current.id && shouldGlow.current) {
            chatsRef.current[index].glow = true
        } else {
            chatsRef.current[index].glow = false
        }
        chatsRef.current = [
            chatsRef.current[index],
            ...chatsRef.current.filter(el => el.id != value.chatMessagesId)
        ];
        setChats(chatsRef.current.concat());
    }

    const unSubscribeMembers = () => {
        if (memberSub) {
            memberSub.unsubscribe();
        }
    }

    const unSubscribeChats = () => {
        for (var i = 0; i < chatSubs.current.length; i++) {
            chatSubs.current[i].unsubscribe()
        }
    }

    const onRefresh = async () => {
        try {
            unSubscribeChats();
            const currentUser = await Auth.currentUserInfo();
            const dbUser = await API.graphql(graphqlOperation(getUserByCognito, {
                id: currentUser.attributes.sub
            }))
            user.current = dbUser.data.getUserByCognito;
            const locPerm = await Location.getForegroundPermissionsAsync();
            if (locPerm.granted) {
                var loc = await Location.getLastKnownPositionAsync();
                const convertedLocs = locConversion(loc.coords.latitude, loc.coords.longitude);
                //const Chats200 = await API.graphql(graphqlOperation(listChatsByLocation, {
                //    ...convertedLocs,
                //    radius: 200,
                //    numMessages: 15,
                //}));
                const Chats200 = await API.graphql(graphqlOperation(getUserChats, {
                    id: user.current.id
                }))
                if (Chats200) {
                    var cs = Chats200.data.getUser.chats.items;
                    var chatData = []
                    const now = Date.now()
                    for (var i = 0; i < cs.length; i++) {
                        const Chat = cs[i].chat
                        const full = await Storage.get(Chat.background.full);
                        const loadFull = await Storage.get(Chat.background.loadFull);
                        Chat.background.full = full;
                        Chat.background.loadFull = loadFull;
                        var thisChat = Chat;
                        thisChat.createdAt = thisChat.createdAt.substring(0, 10);
                        const last3 = await API.graphql(graphqlOperation(listMessagesByTime, {
                            chatMessagesId: Chat.id,
                            limit: 3,
                        }))
                        if (last3.data.listMessagesByTime.items) {
                            thisChat.last3 = last3.data.listMessagesByTime.items;
                            getLast3Images(thisChat.last3);
                            if (last3.data.listMessagesByTime.items[0]) {
                                const msg = Date.parse(last3.data.listMessagesByTime.items[0].createdAt);
                                const diff = now - msg;
                                thisChat.latest = timeLogic(diff / 1000);
                                if (!last3.data.listMessagesByTime.items[0].read.includes(user.current.id) && shouldGlow.current) {
                                    thisChat.glow = true;
                                } else {
                                    thisChat.glow = false;
                                }
                            }
                        } else {
                            thisChat.last3 = []
                            thisChat.glow = false
                        }
                        if (!thisChat.latest) {
                            thisChat.latest = "New Chat";
                        }
                        var num = 0;
                        for (var j = 0; j < Chat.members.items.length; j++) {
                            const loadFull = await Storage.get(Chat.members.items[j].user.profilePicture.loadFull);
                            if (Chat.members.items[j].user.id == user.current.id) {
                                thisChat.userChatMembersID = Chat.members.items[j].id;
                                user.current.profilePicture.loadFull = loadFull;
                            }
                            thisChat.members.items[j].user.picture = loadFull;
                            num++;
                        }
                        thisChat.numMembers = num;
                        thisChat.distance = distance(convertedLocs.lat, convertedLocs.long, Chat.lat, Chat.long);
                        Chat = thisChat;
                        chatData.push(Chat);
                        chatSubs.current.push(API.graphql(graphqlOperation(onReceiveMessage, {
                            chatMessagesId: thisChat.id
                        })).subscribe({
                            next: ({ value }) => rearrangeChats(value.data.onReceiveMessage),
                            error: (error) => { setUpdate(!update) }
                        }));
                    }
                    //console.log(cs);
                    chatData.sort((a, b) => {
                        if (a.last3.length == 0 || b.last3.length == 0) {
                            return -1
                        } else {
                            if (Date.parse(a.last3[0].createdAt) > Date.parse(b.last3[0].createdAt)) {
                                return -1;
                            } else {
                                return 1;
                            }
                        }
                    })
                    setChats(chatData);
                    chatsRef.current = chatData;
                    if (!ready) setReady(true);
                }
            } else {
                setLocEnabled(false);
                if (!ready) setReady(true);
            }
        } catch (error) {
            if (debug) console.log(error);
            if (!ready) setReady(true);
        }
        setRefresh(false);
    }

    const updateTime = () => {
        const iterator = chatsRef.current.values();
        var i = 0;
        for (const value of iterator) {
            if (value.last3.length >= 1) {
                const now = Date.now()
                const diff = now - Date.parse(value.last3[0].createdAt);
                chatsRef.current[i].latest = timeLogic(diff / 1000);
            }
            i++
        }
        setChats(chatsRef.current.concat());
    }


    React.useEffect(() => {
        const initialFunction = async () => {
            try {
                await onRefresh();
                subscribe();
            } catch (error) {
                if (debug) console.log(error);
            }
        }
        initialFunction();
        if (timeClock) {
            clearInterval(timeClock)
            timeClock = null;
        }
        timeClock = setInterval(() => updateTime(), 10000) 
        //var priorState = ConnectionState.Disconnected;
        //const hub = Hub.listen("api", async (data) => {
        //    const { payload } = data;
        //    if (payload.event == CONNECTION_STATE_CHANGE) {
        //        if (priorState == ConnectionState.Connecting && payload.message == ConnectionState.Connected) {
        //            setReady(false);
        //            await onRefresh();
        //            subscribe();
        //            setReady(true);
        //        }
        //    } else if (payload.event == CONNECTION_INIT_TIMEOUT) {
        //            setReady(false);
        //            await onRefresh();
        //            subscribe();
        //            setReady(true);
        //    }
        //    priorState = payload.message
        //})
        return () => {
            //hub()
            clearInterval(timeClock)
            unSubscribeMembers();
            unSubscribeChats();
        }
    }, [navigation, update]);

    const messageHandler = React.useCallback((start) => {
        if (start) {
            //if (debug) console.log("Currently in a chatPage");
            shouldGlow.current = false;
        } else {
            //if (debug) console.log("No longer in chatPage");
            shouldGlow.current = true;
        }

    }, [])

    useFocusEffect(React.useCallback(() => {
        messageHandler(false);
    },[]));

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
                        userChatMembersID={item.userChatMembersID}
                        user={user.current}
                        last3={item.last3}
                        numMembers={item.numMembers}
                        messageHandler={()=> messageHandler(true)}
                        distance={item.distance}
                        title={item.name}
                        created={item.createdAt}
                        navigation={navigation}
                    />
                )
            }
        }, [chats, ready]
    )
    const navigate = async (item) => {
        if (item.last3.length >= 1) {
            if (!item.last3[0].read.includes(user.current.id)) {
                item.last3[0].read.push(user.current.id)
                await API.graphql(graphqlOperation(updateMessage, {
                    input: {
                        id: item.last3[0].id,
                        read: item.last3[0].read
                    }
                }))
                item.glow = false
                chatsRef.current = chats;
                setChats(chatsRef.current.concat())
            }
        }
    }
    const listFooterComponenet = React.useCallback(()=><View height={30} />, []);
    const keyExtractor = React.useCallback((item) => item.id, [])
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

export default ChatsPage;