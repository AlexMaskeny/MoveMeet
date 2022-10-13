import React from 'react';
import { StyleSheet, Image, ActivityIndicator, View } from 'react-native';
import { colors, debug } from '../config';

import Screen from '../comps/Screen';
import Chat from '../comps/Chat';
import DisabledChat from '../comps/DisabledChat';
import SimpleButton from '../comps/SimpleButton';

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
        ppic: {uri: 'https://alexmaskeny.com/wp-content/uploads/2020/11/dragonbackground.jpg'}
    },
    {
        id: "2",
        username: "alex",
        ppic: { uri: 'https://alexmaskeny.com/wp-content/uploads/2020/11/dragonbackground.jpg' }
    },
    {
        id: "3",
        username: "grace",
        ppic: { uri: 'https://alexmaskeny.com/wp-content/uploads/2020/11/dragonbackground.jpg' }
    },
    {
        id: "4",
        username: "Grace Suber",
        ppic: { uri: 'https://alexmaskeny.com/wp-content/uploads/2020/11/dragonbackground.jpg' }
    },
    {
        id: "5",
        username: "Augustus",
        ppic: { uri: 'https://alexmaskeny.com/wp-content/uploads/2020/11/dragonbackground.jpg' }
    },
    {
        id: "6",
        username: "Augustus",
        ppic: { uri: 'https://alexmaskeny.com/wp-content/uploads/2020/11/dragonbackground.jpg' }
    },
    {
        id: "7",
        username: "alexander",
        ppic: { uri: 'https://alexmaskeny.com/wp-content/uploads/2020/11/dragonbackground.jpg' }
    },
    {
        id: "8",
        username: "alex",
        ppic: { uri: 'https://alexmaskeny.com/wp-content/uploads/2020/11/dragonbackground.jpg' }
    },
    {
        id: "9",
        username: "grace",
        ppic: { uri: 'https://alexmaskeny.com/wp-content/uploads/2020/11/dragonbackground.jpg' }
    }, {
        id: "10",
        username: "Grace Suber",
        ppic: { uri: 'https://alexmaskeny.com/wp-content/uploads/2020/11/dragonbackground.jpg' }
    },
    {
        id: "11",
        username: "Augustus",
        ppic: { uri: 'https://alexmaskeny.com/wp-content/uploads/2020/11/dragonbackground.jpg' }
    },
    {
        id: "12",
        username: "Augustus",
        ppic: { uri: 'https://alexmaskeny.com/wp-content/uploads/2020/11/dragonbackground.jpg' }
    },
]
//!!!!!!
//!!!!!!
//!!!!!!
//REMOVE ON PRODUCTON [END]

function ChatsPage({ navigation }) {

    return (
        <>
            <Screen innerStyle={styles.page}>
                <Chat
                    background={{ uri: 'https://alexmaskeny.com/wp-content/uploads/2020/11/dragonbackground.jpg' }}
                    members={testMembers}
                    title="Mega Chat"
                    navigation={navigation}
                    onEndReached={()=>console.log("end")}
                />
                <DisabledChat
                    background={{ uri: 'https://alexmaskeny.com/wp-content/uploads/2020/11/dragonbackground.jpg' }}
                    title="Mega Chat"
                    members={testMembers}
                />
                {/*<SimpleButton onPress={() => navigation.navigate("ChatPage",{ name: "Mega Chat" })} title="Navigate" />*/}
            </Screen>
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