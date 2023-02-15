import React, { useCallback, useRef, useEffect, useState } from 'react';
import { StyleSheet, Image, ActivityIndicator, View, Platform } from 'react-native';
import {Auth} from 'aws-amplify';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import NetInfo from '@react-native-community/netinfo';
import { useFocusEffect } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';

import * as logger from '../functions/logger';
import * as locConversion from '../functions/locConversion';
import Screen from '../comps/Screen';
import { storage, colors, rules, version } from '../config';
import Broadcast from '../comps/Broadcast';
import { calls, instances, mmAPI } from '../api/mmAPI';

const NO_USER = "The user is not authenticated";
const NO_PERMS = "No Perms";

export default function LoadingPage({navigation}) {
    const loc = useRef();
    const not = useRef();
    const lc = useRef();
    const currentUser = useRef();
    const locUpdateHandler = useRef();
    const [showBroadcast, setShowBroadcast] = useState(false);
    const [broadcastData, setBroadcastData] = useState({});

    const closeBroadcast = () => {
        setShowBroadcast(false);
        navigation.navigate("SecondaryNav");
    }

    const unsubscribe = () => {
        currentUser.current = null;
        try { loc.current.remove() } catch { }
        try { not.current.remove() } catch { }
        try { clearInteveral(lc.current) } catch { }
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
                    const user = await mmAPI.query({
                        call: calls.GET_USER_BY_COGNITO,
                        instance: instances.LEAST,
                        input: {
                            id: currentUser.current.attributes.sub
                        }
                    });
                    const notificationStatus = await Notifications.getPermissionsAsync();
                    if (!notificationStatus.granted && user.allowNotifications) {
                        await mmAPI.mutate({
                            call: calls.UPDATE_USER,
                            input: {
                                id: user.id,
                                allowNotifications: false,
                            },
                        })

                        user.allowNotifications = false;
                    }
                    if (user.allowNotifications && notificationStatus.granted) {
                        const result = await Notifications.getPermissionsAsync();
                        if (Platform.OS == "android" ?
                            (result.status == "undetermined") :
                            (result.ios.status == Notifications.IosAuthorizationStatus.NOT_DETERMINED)
                        ) {
                            const result2 = await Notifications.requestPermissionsAsync();
                            if (result2.granted) {
                                const key = await Notifications.getExpoPushTokenAsync();
                                await mmAPI.mutate({
                                    call: calls.UPDATE_USER,
                                    input: {
                                        id: user.id,
                                        allowNotifications: true,
                                        expoToken: key.data,
                                    }
                                });
                            }
                        }
                        const result3 = await Notifications.getPermissionsAsync();
                        if (Platform.OS == "android" ?
                            (result3.status == "granted") :
                            (result3.ios.status == Notifications.IosAuthorizationStatus.AUTHORIZED)
                        ) {
                            not.current = Notifications.addNotificationResponseReceivedListener(notification => {
                                var i = 0;
                                const iF = async () => {
                                    try {
                                        const netInfo = await NetInfo.fetch();
                                        if (!netInfo.isInternetReachable) {
                                            i++;
                                            if (i < 4) setTimeout(iF, 1200);
                                        } else {
                                            setTimeout(async () => {
                                                const chat = await mmAPI.query({
                                                    call: calls.GET_CHAT,
                                                    instance: "loadingPage",
                                                    input: {
                                                        id: notification.notification.request.content.data.chatID
                                                    }

                                                })
                                                const userChatMembersID = chat.members.items[chat.members.items.findIndex((el) => el.user.id == user.id)].id;
                                                if (notification.notification.request.content.data.privateChat) {
                                                    navigation.navigate("PChatNav", {
                                                        screen: "ChatPage",
                                                        key: chat.id,
                                                        params: {
                                                            name: notification.notification.request.content.title,
                                                            created: chat.createdAt,
                                                            id: chat.id,
                                                            userChatMembersID,
                                                            user: user,
                                                            private: true,
                                                        }
                                                    });
                                                } else {
                                                    navigation.navigate("TChatNav", {
                                                        screen: "ChatPage",
                                                        key: chat.id,
                                                        params: {
                                                            name: notification.notification.request.content.title,
                                                            created: chat.createdAt,
                                                            id: chat.id,
                                                            userChatMembersID,
                                                            user: user,
                                                        }
                                                    });
                                                }
                                                await Notifications.dismissAllNotificationsAsync();

                                            }, 400);
                                        }
                                    } catch (error) {
                                        logger.warn(error.errors);
                                    }
                                }
                                iF();
                            });
                        } else {
                            await mmAPI.mutate({
                                call: calls.UPDATE_USER,
                                input: {
                                    id: user.id,
                                    allowNotifications: false,
                                }
                            })
                        }
                    }
                    if (perm.granted) {
                        //var i = 0;
                        loc.current = await Location.watchPositionAsync({ accuracy: rules.locationAccuracy, distanceInterval: rules.locationDistanceInterval, timeInterval: rules.locationUpdateFrequency }, async (location) => {
                            try {
                                //i++
                                //if (i % rules.locationDismissalRate == 0) {
                                currentUser.current = await Auth.currentAuthenticatedUser();
                                if (currentUser.current) {
                                    const convertedLocs = locConversion.toUser(location.coords.latitude, location.coords.longitude);
                                    const netInfo = await NetInfo.fetch();
                                    if (netInfo.isInternetReachable) {
                                        await mmAPI.mutate({
                                            call: calls.UPDATE_USER,
                                            input: {
                                                id: user.id,
                                                ...convertedLocs
                                            }
                                        });
                                    }

                                } else throw NO_USER
                                //}
                            } catch (error) {
                                logger.warn(error);
                                if (error != NO_USER) {
                                    logger.warn(error.errors);
                                } else {
                                    unsubscribe();
                                }
                            }
                        });
                        const updateChatMembership = async () => {
                            try {
                                const netInfo = await NetInfo.fetch();
                                if (currentUser.current && netInfo.isInternetReachable) {
                                    if (Date.now() - locUpdateHandler.current < 10000) return;
                                    locUpdateHandler.current = Date.now();
                                    const allow = await Location.getForegroundPermissionsAsync();
                                    if (!allow.granted) throw NO_PERMS;
                                    const location = await Location.getLastKnownPositionAsync();
                                    const convertedLocs2 = locConversion.toChat(location.coords.latitude, location.coords.longitude);
                                    const newChats = await mmAPI.query({
                                        call: calls.LIST_CHATS_BY_LOCATION,
                                        instance: "loadingPage",
                                        input: {
                                            ...convertedLocs2,
                                            radius: rules.nearYouRadius,
                                        }
                                    })

                                    var cdata = [];
                                    var bdata = [];
                                    const oldChats = await mmAPI.query({
                                        call: calls.GET_CHAT_MEMBERS_BY_IDS,
                                        instance: "loadingPage",
                                        input: {
                                            userID: user.id
                                        }
                                    })
                                    for (var i = 0; i < oldChats.items.length; i++) {
                                        if (bdata.indexOf(el => el.chatID == oldChats.items[i].chatID) == -1) {
                                            bdata.push(oldChats.items[i]);
                                            if (newChats.items.findIndex(el => {
                                                if (el.id == oldChats.items[i].chatID) return true;
                                                else return false;
                                            }) == -1) {
                                                if (!oldChats.items[i].chat.private) {
                                                    await mmAPI.mutate({
                                                        call: calls.DELETE_CHAT_MEMBERS,
                                                        instance: "background",
                                                        input: {
                                                            id: oldChats.items[i].id
                                                        }
                                                    });
                                                }
                                            }
                                        } else {
                                            await mmAPI.mutate({
                                                call: calls.DELETE_CHAT_MEMBERS,
                                                instance: "background",
                                                input: {
                                                    id: oldChats.items[i].id
                                                }
                                            });
                                        }
                                    }
                                    for (var i = 0; i < newChats.items.length; i++) {
                                        if (oldChats.items.findIndex(el => {
                                            if (el.chatID == newChats.items[i].id) return true;
                                            else return false;
                                        }) == -1) {
                                            if (cdata.findIndex(el => {
                                                if (el.id == newChats.items[i].id) return true;
                                                else return false;
                                            }) == -1) {
                                                cdata.push(newChats.items[i]);
                                                if (!newChats.items[i].private) {
                                                    await mmAPI.mutate({
                                                        call: calls.CREATE_CHAT_MEMBERS,
                                                        instance: "background",
                                                        input: {
                                                            userID: user.id,
                                                            chatID: newChats.items[i].id
                                                        }
                                                    });
                                                }
                                            }
                                        }
                                    }
                                }
                            } catch (error) {
                                logger.warn(error);
                                if (error != NO_USER && error != NO_PERMS) {
                                    logger.warn(error);
                                } else {
                                    unsubscribe();
                                }
                            }
                        }

                        await updateChatMembership();

                        lc.current = setInterval(updateChatMembership, rules.locationUpdateFrequency);
                    }
                    const broadcasts = (
                        await mmAPI.query({ call: calls.LIST_BROADCASTS, instance: instances.FULL })
                    ).items;
                    const userBroadcasts = (
                        await mmAPI.query({
                            call: calls.GET_USER,
                            instance: "userBroadcasts",
                            input: {
                                id: user.id
                            }
                        })
                    ).broadcasts;

                    var shouldShowBroadcast = false;
                    var broadcast;
                    for (var i = 0; i < broadcasts.length; i++) {
                        if (broadcasts[i].excemptVersions.indexOf(version) != -1) continue;
                        if (userBroadcasts.indexOf(broadcasts[i].id) != -1) continue;
                        if (shouldShowBroadcast) {
                            if (broadcasts[i].createdAt > broadcast.createdAt) broadcast = broadcasts[i];
                        } else {
                            shouldShowBroadcast = true;
                            broadcast = broadcasts[i];
                        }
                    }
                    if (shouldShowBroadcast) {
                        setBroadcastData(broadcast);
                        setShowBroadcast(true);
                        await mmAPI.mutate({
                            call: calls.UPDATE_USER,
                            input: {
                                id: user.id,
                                broadcasts: [...userBroadcasts, broadcast.id]
                            }
                        })

                    } else navigation.navigate("SecondaryNav");
                } else throw NO_USER;
            } catch (error) {
                logger.log(error);
                if (error == NO_USER) {
                    try {
                        const result = await AsyncStorage.getItem(storage.UNCONFIRMED);
                        if (result) {
                            const parsed = JSON.parse(result);
                            if (parsed.val) {
                                logger.log("Unconfirmed User Exists");
                                navigation.navigate("SignupPage3");
                                return;
                            }
                        }
                        navigation.navigate("AuthPage");
                    } catch (error) {
                        logger.warn(error);
                    }
                }
            }
        }

        initialFunction();
    },[]));

    return (
        <Screen innerStyle={styles.page}>
            <Image
                source={require('../../assets/Logo.png')}
                style={styles.logo}
                resizeMode="contain"
            />
            <View height={20}/>
            <ActivityIndicator size='large' color={colors.pBeam} />
            <Broadcast visible={showBroadcast} broadcast={broadcastData} onClose={closeBroadcast} />
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