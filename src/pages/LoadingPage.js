import React, { useCallback, useRef, useEffect } from 'react';
import { StyleSheet, Image, ActivityIndicator, View } from 'react-native';
import { API, Auth, graphqlOperation } from 'aws-amplify';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useFocusEffect } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { CommonActions } from '@react-navigation/native';

import { getChat, getUserByCognito, updateUser } from '../api/calls';
import * as logger from '../functions/logger';
import * as locConversion from '../functions/locConversion';
import Screen from '../comps/Screen';
import { storage, colors } from '../config';

const NO_USER = "The user is not authenticated";

export default function LoadingPage({navigation}) {
    const loc = useRef();
    const not = useRef();
    const currentUser = useRef();


    const unsubscribe = () => {
        currentUser.current = null;
        try { loc.current.remove() } catch { }
        try { not.current.remove()} catch { }
        logger.log("Unsubscribed from notification / location updates.");
    };

    useEffect(() => { return () => {unsubscribe()} }, []);

    useFocusEffect(useCallback(() => {
        const initialFunction = async () => {
            unsubscribe();
            logger.log("Initiating...");
            try {
                currentUser.current = await Auth.currentAuthenticatedUser();
                if (currentUser.current) {
                    const perm = await Location.getForegroundPermissionsAsync();
                    const user = await API.graphql(graphqlOperation(getUserByCognito, {
                        id: currentUser.current.attributes.sub
                    }));
                    if (user.data.getUserByCognito.allowNotifications) {
                        const result = await Notifications.getPermissionsAsync();
                        if (result.ios.status == Notifications.IosAuthorizationStatus.NOT_DETERMINED) {
                            const result2 = await Notifications.requestPermissionsAsync();
                            if (result2.granted) {
                                const key = await Notifications.getExpoPushTokenAsync();
                                await API.graphql(graphqlOperation(updateUser, {
                                    input: {
                                        id: user.data.getUserByCognito.id,
                                        allowNotifications: true,
                                        expoToken: key.data
                                    }
                                }))
                            }
                        }
                        const result3 = await Notifications.getPermissionsAsync();
                        if (result3.ios.status == Notifications.IosAuthorizationStatus.AUTHORIZED) {
                            not.current = Notifications.addNotificationResponseReceivedListener(notification => {
                                const iF = async () => {
                                    try {
                                        const chat = await API.graphql(graphqlOperation(getChat, {
                                            id: notification.notification.request.content.data.chatID
                                        }));
                                        const userChatMembersID = chat.data.getChat.members.items[chat.data.getChat.members.items.findIndex((el) => el.user.id == user.data.getUserByCognito.id)];
                                        if (notification.notification.request.content.data.privateChat) {
                                            navigation.dispatch(
                                                CommonActions.navigate({
                                                    name: "ChatPage",
                                                    key: chat.data.getChat.id,
                                                    params: {
                                                        name: notification.notification.request.content.title,
                                                        created: chat.data.getChat.createdAt,
                                                        id: chat.data.getChat.id,
                                                        userChatMembersID,
                                                        user: user.data.getUserByCognito,
                                                        private: true,
                                                    }
                                                })
                                            );
                                        } else {
                                            navigation.dispatch(
                                                CommonActions.navigate({
                                                    name: "ChatPage",
                                                    key: chat.data.getChat.id,
                                                    params: {
                                                        name: chat.data.getChat.name,
                                                        created: chat.data.getChat.createdAt,
                                                        id: chat.data.getChat.id,
                                                        userChatMembersID,
                                                        user: user.data.getUserByCognito,
                                                    }
                                                })
                                            );
                                        }
                                        await Notifications.dismissAllNotificationsAsync();
                                    } catch (error) {
                                        logger.warn(error);
                                    }
                                }
                                iF();
                            });
                        } else {
                            await API.graphql(graphqlOperation(updateUser, {
                                input: {
                                    id: user.data.getUserByCognito.id,
                                    allowNotifications: false,
                                }
                            }))
                        }
                    }
                    if (perm.granted) {
                        loc.current = await Location.watchPositionAsync({ accuracy: 5, distanceInterval: 0, timeInterval: 10000 }, async (location) => {
                            try {
                                currentUser.current = await Auth.currentAuthenticatedUser();
                                if (currentUser.current) {
                                    const convertedLocs = locConversion.toUser(location.coords.latitude, location.coords.longitude);
                                    await API.graphql(graphqlOperation(updateUser, {
                                        input: {
                                            id: user.data.getUserByCognito.id,
                                            ...convertedLocs
                                        }
                                    }));
                                } else throw NO_USER
                            } catch (error) {
                                logger.warn(error);
                                if (error != NO_USER) {
                                    logger.warn(error.errors);
                                } else {
                                    unsubscribe();
                                }
                            }
                        });
                    }
                } else throw NO_USER;
                navigation.navigate("SecondaryNav");
            } catch (error) {
                logger.log(error);
                if (error == NO_USER) {
                    try {
                        const result = await AsyncStorage.getItem(storage.UNCONFIRMED);
                        if (result) {
                            const parsed = JSON.parse(result);
                            if (parsed.val) {
                                logger.log("Unconfirmed User Exists");
                                //send to signup page;
                                return;
                            }
                        }
                        navigation.navigate("LoginPage");
                    } catch (error) {
                        logger.warn(error);
                    }
                }
            }
        }

        initialFunction();
    }));

    return (
        <Screen innerStyle={styles.page}>
            <Image
                source={require('../../assets/Logo.png')}
                style={styles.logo}
                resizeMode="contain"
            />
            <View height={20}/>
            <ActivityIndicator size='large' color={colors.pBeam} />
        </Screen>
    );
}

const styles = StyleSheet.create({
    logo: {
        height: 60,
        width: "100%"
    },
    page: {
        justifyContent: "center"
	}
})