import React from 'react';
import { StyleSheet, Image, ActivityIndicator, View } from 'react-native';
import { colors, debug } from '../config';

import Screen from '../comps/Screen';
import Chat from '../comps/Chat';

//DESCRIPTION: A primary page of the SecondaryNav
//             is the hub for all localized chats

function ChatsPage({ navigation }) {

    return (
        <>
            <Screen innerStyle={styles.page}>
                <Chat />
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