import React from 'react';
import { StyleSheet, Image, ActivityIndicator, View } from 'react-native';

import Screen from '../comps/Screen';
import SimpleButton from '../comps/SimpleButton';

//DESCRIPTION: A primary page of the SecondaryNav
//             is the hub for all localized chats

function ChatPage({ navigation }) {

    return (
        <>
            <Screen innerStyle={styles.page}>
                <SimpleButton onPress={() => navigation.navigate("ChatsPage")} title="Go Back" />
            </Screen>
        </>
    );
}

const styles = StyleSheet.create({
    page: {
        padding: 14,
    },

})

export default ChatPage;