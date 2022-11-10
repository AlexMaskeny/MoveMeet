import React from 'react';
import { StyleSheet, Image, RefreshControl, View, FlatList } from 'react-native';
import * as Location from 'expo-location';
import { getUserByCognito, listChatsByLocation, createChatMembers, listMessagesByTime } from '../api/calls';
import { API, Auth, graphqlOperation, Storage } from 'aws-amplify';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as TaskManager from 'expo-task-manager';

import { colors, debug, locConversion, distance, timeLogic } from '../config';
import Screen from '../comps/Screen';
import Chat from '../comps/Chat';
import DisabledChat from '../comps/DisabledChat';
import Loading from '../comps/Loading';

//DESCRIPTION: A primary page of the SecondaryNav
//             is the hub for all localized chats



function ChatsPage({ navigation, route }) {
    const [ready, setReady] = React.useState(false);
    const [refresh, setRefresh] = React.useState(false);
    const [locEnabled, setLocEnabled] = React.useState(true);
    const [chats, setChats] = React.useState([]);
    const user = React.useRef();

    const onRefresh = async () => {
        try {
            const locPerm = await Location.getForegroundPermissionsAsync();
            //Just allowing developer to get access if not already requested
            if (debug) {
                if (!locPerm.granted) {
                    const loc = await Location.requestForegroundPermissionsAsync();
                    locPerm.granted = true;
                }
            }
            //End debug section...
            if (locPerm.granted) {
                var loc;
                if (ready) {
                    loc = await Location.getLastKnownPositionAsync();
                } else {
                    loc = await Location.getCurrentPositionAsync({ accuracy: 25 }); // Might change to 6
                }
                //console.log(loc);
                const convertedLocs = locConversion(loc.coords.latitude, loc.coords.longitude);
                const Chats200 = await API.graphql(graphqlOperation(listChatsByLocation, {
                    ...convertedLocs,
                    radius: 200,
                    numMessages: 15,
                }));
                if (Chats200) {
                    var cs = Chats200.data.listChatsByLocation.items;
                    const currentUser = await Auth.currentUserInfo();
                    const dbUser = await API.graphql(graphqlOperation(getUserByCognito, {
                        id: currentUser.attributes.sub
                    }))
                    user.current = dbUser.data.getUserByCognito;
                    //console.log(JSON.parse(dbUser.data.getUserByCognito));

                    // use nested loop to add remote uris to the local chat array.
                    // Profile circles of the chat preview just the background of chat and grab the 3 latests chats. If 
                    const now = Date.now()
                    for (var i = 0; i < cs.length; i++) {
                        const full = await Storage.get(cs[i].background.full);
                        const loadFull = await Storage.get(cs[i].background.loadFull);
                        cs[i].background.full = full;
                        cs[i].background.loadFull = loadFull;
                        var userPresent = false;
                        var thisChat = cs[i];
                        thisChat.createdAt = thisChat.createdAt.substring(0, 10);
                        const last3 = await API.graphql(graphqlOperation(listMessagesByTime, {
                            chatMessagesId: cs[i].id,
                            limit: 3,
                        }))
                        if (last3.data.listMessagesByTime.items) {
                            thisChat.last3 = last3.data.listMessagesByTime.items;
                            if (last3.data.listMessagesByTime.items[0]) {
                                const msg = Date.parse(last3.data.listMessagesByTime.items[0].createdAt);
                                const diff = now - msg;
                                thisChat.latest = timeLogic(diff / 1000);
                            }
                        } else {
                            thisChat.last3 = []
                        }
                        if (!thisChat.latest) {
                            thisChat.latest = "New Chat";
                        }
                        var num = 0;
                        for (var j = 0; j < cs[i].members.items.length; j++) {
                            const loadFull = await Storage.get(cs[i].members.items[j].user.profilePicture.loadFull);
                            if (cs[i].members.items[j].user.id == dbUser.data.getUserByCognito.id) {
                                userPresent = true;
                                user.current.profilePicture.loadFull = loadFull;
                            }
                            thisChat.members.items[j].user.picture = loadFull;
                            num++;
                        }
                        if (!userPresent) {
                            //console.log(dbUser.data.getUserByCognito.id);
                            //console.log(cs[i].id);
                            await API.graphql(graphqlOperation(createChatMembers, {
                                input: {
                                    userID: ""+dbUser.data.getUserByCognito.id,
                                    chatID: ""+cs[i].id
                                }
                            }));
                            const loadFull = await Storage.get("LOADFULLprofilePicture" + dbUser.data.getUserByCognito.id + ".jpg");
                            user.current.profilePicture.loadFull = loadFull;
                            thisChat.members.items[thisChat.members.items.length] = {
                                user: {
                                    id: dbUser.data.getUserByCognito.id,
                                    picture: loadFull
                                }
                                
                            };
                            num++;
                        }
                        thisChat.numMembers = num;
                        thisChat.distance = distance(convertedLocs.lat, convertedLocs.long, cs[i].lat, cs[i].long);
                        cs[i] = thisChat;
                        
                    }
                    //console.log(cs);
                    setChats(cs);
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
    React.useEffect(() => {
        const initialFunction = async () => {
            try {
                await onRefresh();
            } catch (error) {
                if (debug) console.log(error);
            }
        }
        initialFunction();
    }, []);

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
                        id={item.id}
                        user={user.current}
                        last3={item.last3}
                        numMembers={item.numMembers}
                        distance={item.distance}
                        title={item.name}
                        created={item.createdAt}
                        navigation={navigation}
                    />
                )
            }
        }, [chats, ready]
    )
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