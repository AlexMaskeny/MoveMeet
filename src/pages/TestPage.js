import React from 'react';
import { StyleSheet, View, Text, Alert } from 'react-native';
import { API, Auth, graphqlOperation, Storage } from 'aws-amplify';

import * as Notifications from 'expo-notifications';
import { colors, debug } from '../config';
import { createUser, updateUser, createChat, updateChat, createMessage, getMessage, getChat, listChats, listUsers, createChatMembers, getLatestMessagesByTime, getUserByCognito } from '../api/calls';

import SimpleButton from '../comps/SimpleButton';
import Screen from '../comps/Screen';

import LottieView from 'lottie-react-native';
import NoConnectionAlert from '../comps/NoConnectionAlert';
import NoLocationAlert from '../comps/NoLocationAlert';


function TestScreen({ navigation }) {

    const allowNotifications = async () => {
        try {
            const result = await Notifications.requestPermissionsAsync();
            if (result.granted) {
                const key = await Notifications.getExpoPushTokenAsync();
                const currentUser = await Auth.currentAuthenticatedUser();
                const user = await API.graphql(graphqlOperation(getUserByCognito, {
                    id: currentUser.attributes.sub
                }))
                await API.graphql(graphqlOperation(updateUser, {
                    input: {
                        id: user.data.getUserByCognito.id,
                        allowNotifications: true,
                        expoToken: key.data
                    }
                }))
                Alert.alert("Notifications Enabled");
            }
        } catch (error) {
            if (debug) console.log(error);
        }
    }
    return (
        <Screen innerStyle={styles.page}>
            <NoLocationAlert visible={true} />
        </Screen>
    );
}

const styles = StyleSheet.create({
    page: {
        justifyContent: "center"
    }
})

export default TestScreen;