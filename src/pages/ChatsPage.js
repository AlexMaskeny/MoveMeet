import React from 'react';
import { StyleSheet, Image, RefreshControl, View, FlatList } from 'react-native';
import * as Location from 'expo-location';
import { listChatsByLocation, listUsersByLocation } from '../api/calls';
import { API, Auth, graphqlOperation, Storage } from 'aws-amplify';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { colors, debug,locConversion } from '../config';
import Screen from '../comps/Screen';
import Chat from '../comps/Chat';
import DisabledChat from '../comps/DisabledChat';
import Loading from '../comps/Loading';

//DESCRIPTION: A primary page of the SecondaryNav
//             is the hub for all localized chats


//REMOVE ON PRODUCTON [START]
//!!!!!!
//!!!!!!
//!!!!!!
const testMembers = [
    {
        id: "1",
        username: "alexander",
        ppic: {
            uri: 'https://cbeyondata.com/wp-content/uploads/2020/10/iStock-1237546531-1920x1280.jpg',
            loadImage: 'https://th.bing.com/th/id/R.4ef44de48283a70c345215439710e076?rik=DbmjSu8b4rFcmQ&riu=http%3a%2f%2fwww.kneson.com%2fnews%2fIII3%2fKELSEY_AD_example1.jpg&ehk=5jg5ZditRXiSNMQ9tGa0nhrMY8OnQBmFdvwW%2f%2bGfiCU%3d&risl=&pid=ImgRaw&r=0',
            key: "testMembers1",
        }
    },
    {
        id: "2",
        username: "alexander",
        ppic: {
            uri: 'https://cbeyondata.com/wp-content/uploads/2020/10/iStock-1237546531-1920x1280.jpg',
            loadImage: 'https://th.bing.com/th/id/R.4ef44de48283a70c345215439710e076?rik=DbmjSu8b4rFcmQ&riu=http%3a%2f%2fwww.kneson.com%2fnews%2fIII3%2fKELSEY_AD_example1.jpg&ehk=5jg5ZditRXiSNMQ9tGa0nhrMY8OnQBmFdvwW%2f%2bGfiCU%3d&risl=&pid=ImgRaw&r=0',
            key: "testMembers2",
        }
    },
    {
        id: "3",
        username: "alexander",
        ppic: {
            uri: 'https://cbeyondata.com/wp-content/uploads/2020/10/iStock-1237546531-1920x1280.jpg',
            loadImage: 'https://th.bing.com/th/id/R.4ef44de48283a70c345215439710e076?rik=DbmjSu8b4rFcmQ&riu=http%3a%2f%2fwww.kneson.com%2fnews%2fIII3%2fKELSEY_AD_example1.jpg&ehk=5jg5ZditRXiSNMQ9tGa0nhrMY8OnQBmFdvwW%2f%2bGfiCU%3d&risl=&pid=ImgRaw&r=0',
            key: "testMembers3",
        }
    },
]
//!!!!!!
//!!!!!!
//!!!!!!
//REMOVE ON PRODUCTON [END]

function ChatsPage({ navigation, route }) {
    const [ready, setReady] = React.useState(false);
    const [refresh, setRefresh] = React.useState(false);
    const [locEnabled, setLocEnabled] = React.useState(true);
    const [chats, setChats] = React.useState([]);
    const [users, setUsers] = React.useState([]);

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
                const loc = await Location.getCurrentPositionAsync({ accuracy: 25 });
                const convertedLocs = locConversion(loc.coords.latitude, loc.coords.longitude);
                const Chats200 = await API.graphql(graphqlOperation(listChatsByLocation, {
                    ...convertedLocs,
                    radius: 200,
                    numMessages: 15,
                }));
                if (Chats200) {
                    if (debug) {
                        //console.log(Chats200.data.listChatsByLocation.items);
                    }
                    var cs = Chats200.data.listChatsByLocation.items;
                    for (i = 0; i < cs.length; i++) {
                        const full = await Storage.get(cs[i].background.full);
                        const loadFull = await Storage.get(cs[i].background.loadFull);
                        cs[i].background.full = full;
                        cs[i].background.loadFull = loadFull;
                    }
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
    return (
        <>
            <Screen>
                <FlatList
                    data={chats}
                    style={styles.page}
                    keyExtractor={item => item.id}
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
                    ListFooterComponent={() => <View height={30} />}
                    renderItem={({ item }) => {
                        if (ready) {
                            return(
                                <Chat
                                    background={{
                                        uri: item.background.full,
                                        loadImage: item.background.loadFull ? item.background.loadFull : item.background.full,
                                        key: "background"+item.id,
                                    }}
                                    members={testMembers}
                                    title={item.name}
                                    created="10/16/2022"
                                    navigation={navigation}
                                    onEndReached={() => console.log("Emd")}
                                />
                            )
                        }
                    }}
                />
                {/*<DisabledChat*/}
                {/*    background={{*/}
                {/*        uri: 'https://cbeyondata.com/wp-content/uploads/2020/10/iStock-1237546531-1920x1280.jpg',*/}
                {/*        loadImage: 'https://th.bing.com/th/id/R.4ef44de48283a70c345215439710e076?rik=DbmjSu8b4rFcmQ&riu=http%3a%2f%2fwww.kneson.com%2fnews%2fIII3%2fKELSEY_AD_example1.jpg&ehk=5jg5ZditRXiSNMQ9tGa0nhrMY8OnQBmFdvwW%2f%2bGfiCU%3d&risl=&pid=ImgRaw&r=0',*/}
                {/*        key: 'background2'*/}
                {/*    }}*/}
                {/*    title="Mega Chat"*/}
                {/*    members={testMembers}*/}
                {/*/>*/}
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