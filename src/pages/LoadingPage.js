//region 3rd Party Imports
import React, { useCallback, useRef, useEffect, useState } from 'react';
import { StyleSheet, Image, ActivityIndicator, View, Platform } from 'react-native';
import {Auth} from 'aws-amplify';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import NetInfo from '@react-native-community/netinfo';
import { useFocusEffect } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
//endregion
//region 1st Party Imports
import * as logger from '../functions/logger';
import * as locConversion from '../functions/locConversion';
import Screen from '../comps/Screen';
import { storage, dark_colors, rules, version } from '../config';
import Broadcast from '../comps/Broadcast';
import { calls, instances, mmAPI } from '../api/mmAPI';
//endregion

//region Local Constants
const NO_USER = "The user is not authenticated";
const NO_PERMS = "No Perms";
//endregion
export default function LoadingPage({navigation, route}) {
    //region useRef variables
    const loc = useRef();           //Subscription to get location on an interval
    const not = useRef();           //Subscription to handle incoming notifications (navigates to proper page on click)
    const lc = useRef();            //Updates the user's chat memberships on an interval
    const currentUser = useRef();   //The current cognito user
    const user = useRef();          //The current dynamodb user
    const lastLCRunDate = useRef(); //The date of the last time lc ran
    //endregion
    //region useState variables
    const [showBroadcast, setShowBroadcast] = useState(false); //Should we show the broadcast modal?
    const [broadcastData, setBroadcastData] = useState({});    //The data to display on the broadcast modal
    //endregion

    //region [FUNCTION]   "closeBroadcast = ()" = Closes the broadcast modal & enters app
    const closeBroadcast = () => {
        setShowBroadcast(false);
        navigation.navigate("SecondaryNav");
    }
    //endregion
    //region [FUNCTION]   "unsubscribe = ()" = Unsubscribes from every subscription (ie loc, not, lc)
    const unsubscribe = () => {
        currentUser.current = null;
        try { loc.current.remove() } catch { }
        try { not.current.remove() } catch { }
        try { clearInterval(lc.current) } catch { }
        logger.log("Unsubscribed from notification / location updates.");
    };
    //endregion

    //region [HOOK] "useFocusEffect, [route.params?.signOut]" = Subscribes to all background processes of the app. Decides whether to allow user in or send them to auth stack,
    useFocusEffect(useCallback(() => {
        (async function () {
            //Unsubscribe from previous subscriptions
            unsubscribe();

            logger.log("Initiating App...");
            try {
                //get the current cognito user
                currentUser.current = await Auth.currentAuthenticatedUser();

                //If there isn't a user signed in then exit to auth stack
                if (!currentUser?.current) throw NO_USER;

                //region Get the current dynamodb user.current. Save as user
                user.current = await mmAPI.query({
                    call: calls.GET_USER_BY_COGNITO,
                    instance: instances.LEAST,
                    input: {
                        id: currentUser.current.attributes.sub
                    }
                });
                //endregion
                //region [IF] route.params.signOut == true [THEN] log user out. [warning is okay]
                if (route.params?.signOut) {
                    //region Disable allowNotifications for the user and set their status to logged out
                    await mmAPI.mutate({
                        call: calls.UPDATE_USER,
                        input: {
                            id: user.current.id,
                            allowNotifications: false,
                            loggedOut: true,
                        }
                    });
                    //endregion
                    //region Remove the user from any public chats they're apart of
                    const chatMembers = await mmAPI.query({
                        call: calls.GET_CHAT_MEMBERS_BY_IDS,
                        instance: "loadingPage",
                        input: {
                            userID: user.current.id
                        }
                    });
                    //Iterate through each chat the user is a part of. Remove them from it
                    for (let i = 0; i < chatMembers.items.length; i++) {
                        if (!chatMembers.items[i].chat.private) {
                            await mmAPI.mutate({
                                call: calls.DELETE_CHAT_MEMBERS,
                                instance: "background",
                                input: {
                                    id: chatMembers.items[i].id
                                }
                            });
                        }
                    }
                    //endregion

                    //Sign the user out
                    await Auth.signOut();
                    throw NO_USER;
                }
                //endregion

                //check if the user has notifications enabled
                const notificationStatus = await Notifications.getPermissionsAsync();
                //region [IF] we don't have access to notifications [AND] can't request them [THEN] disable notifications
                if ((Platform.OS === "android") ?
                    (notificationStatus.status === "denied") :
                    (notificationStatus.ios.status === Notifications.IosAuthorizationStatus.DENIED)
                ) {
                    await mmAPI.mutate({
                        call: calls.UPDATE_USER,
                        input: {
                            id: user.current.id,
                            allowNotifications: false,
                        },
                    })
                    user.current.allowNotifications = false;
                }
                //endregion
                //region [IF] we don't have access to notifications [AND] can request them [THEN] request access
                if ((Platform.OS === "android") ?
                    (notificationStatus.status === "undetermined") :
                    (notificationStatus.ios.status === Notifications.IosAuthorizationStatus.NOT_DETERMINED)
                ) {
                    const result = await Notifications.requestPermissionsAsync();
                    if (result.granted) {
                        const key = await Notifications.getExpoPushTokenAsync();
                        await mmAPI.mutate({
                            call: calls.UPDATE_USER,
                            input: {
                                id: user.current.id,
                                allowNotifications: true,
                                expoToken: key.data,
                            }
                        });
                        user.current.allowNotifications = true;
                    } else {
                        await mmAPI.mutate({
                            call: calls.UPDATE_USER,
                            input: {
                                id: user.current.id,
                                allowNotifications: false,
                            },
                        })
                        user.current.allowNotifications = false;
                    }
                }
                //endregion
                //region [IF] after the last 2 regions we have access to notifications [THEN] subscribe to notifications [warning is okay]
                if (user.current.allowNotifications) {
                    not.current = Notifications.addNotificationResponseReceivedListener(notification => {
                        //retryIndex is used to retry sending notifications 4 times (once ever 1200ms) before giving up.
                        let retryIndex = 0;

                        const sendNotification = async () => {
                            try {

                                //region [IF] there is no internet [THEN] exit & try to send the notification again in 1200ms (max of 4 times). Uses retryIndex
                                const netInfo = await NetInfo.fetch();
                                if (!netInfo.isInternetReachable || !netInfo.isConnected) {
                                    retryIndex++;
                                    if (retryIndex < 4) setTimeout(sendNotification, 1200);
                                    return;
                                }
                                //endregion
                                //region Verify there is a user logged in [warning is okay]
                                currentUser.current = await Auth.currentAuthenticatedUser();
                                if (!currentUser.current) throw NO_USER
                                //endregion

                                //Wait 400 ms before navigating. This ensures that nothing breaks.
                                setTimeout(async () => {
                                    //region Get the chat the notification is from
                                    const chat = await mmAPI.query({
                                        call: calls.GET_CHAT,
                                        instance: "loadingPage",
                                        input: {
                                            id: notification.notification.request.content.data.chatID
                                        }
                                    });
                                    //endregion
                                    //region Find the ID of the chat membership between the user and the chat that sent the notification
                                    const userChatMembersID = chat.members.items[chat.members.items.findIndex((el) => el.user.id === user.current.id)].id;
                                    //endregion

                                    //region [IF] the chat that sent the notification was private [THEN] navigate to the private chat navigator's chat page (also update friend status if necessary)
                                    if (notification.notification.request.content.data.privateChat) {
                                        //region Update friend status (if needed)
                                        let friendships = (await mmAPI.query({
                                            call: calls.GET_USER,
                                            instance: "friends",
                                            input: {
                                                id: user.current.id
                                            }
                                        })).friends;
                                        const friendshipIndex = friendships.findIndex(el => el.chatID === notification.notification.request.content.data.chatID);
                                        if (friendshipIndex !== -1) { //It should never be equal to -1
                                            if (friendships[friendshipIndex].status === "1") friendships[friendshipIndex].status = "0";
                                            if (friendships[friendshipIndex].status === "3") friendships[friendshipIndex].status = "2";
                                            await mmAPI.mutate({
                                                call: calls.UPDATE_USER,
                                                input: {
                                                    id: user.current.id,
                                                    friends: friendships
                                                }
                                            })
                                        }
                                        //endregion
                                        navigation.navigate("PChatNav", {
                                            screen: "ChatPage",
                                            key: chat.id,
                                            params: {
                                                name: notification.notification.request.content.title,
                                                created: chat.createdAt,
                                                id: chat.id,
                                                userChatMembersID,
                                                user: user.current,
                                                jump: true,
                                                private: true,
                                            }
                                        });
                                    }
                                    //endregion
                                    //region [ELSE] the notification is from a public chat [SO] navigate to the public chat navigator's chat page
                                    else {
                                        navigation.navigate("TChatNav", {
                                            screen: "ChatPage",
                                            key: chat.id,
                                            params: {
                                                name: notification.notification.request.content.title,
                                                created: chat.createdAt,
                                                id: chat.id,
                                                jump: true,
                                                userChatMembersID,
                                                user: user.current,
                                            }
                                        });
                                    }
                                    //endregion

                                    //The user clicked on the notification, so remove it from their phone's notification list
                                    await Notifications.dismissAllNotificationsAsync();
                                }, 400);

                            } catch (error) {
                                console.warn(error);
                                if (error !== NO_USER)
                                    logger.warn(error.errors);
                                else
                                    unsubscribe();
                            }
                        };
                        sendNotification(); //Runs on the first attempt to send the notification
                    });
                }
                //endregion

                //check if the user has locations enabled
                const locationStatus = await Location.getForegroundPermissionsAsync();
                if (locationStatus.granted) {
                    //region Begin updating the current user's location in the database [warning is okay]
                    loc.current = await Location.watchPositionAsync(
                        {
                            accuracy: rules.locationAccuracy,
                            distanceInterval: rules.locationDistanceInterval,
                            timeInterval: rules.locationUpdateFrequency
                        },
                        async (location) => {
                            try {
                                //region Verify there is still a user logged in
                                currentUser.current = await Auth.currentAuthenticatedUser();
                                if (!currentUser.current) throw NO_USER;
                                //endregion
                                //region Updated the logged in user's location in the database
                                if (location) {
                                    const convertedLocs = locConversion.toUser(location.coords.latitude, location.coords.longitude);
                                    const netInfo = await NetInfo.fetch();
                                    if (netInfo.isInternetReachable && netInfo.isConnected) {
                                        await mmAPI.mutate({
                                            call: calls.UPDATE_USER,
                                            input: {
                                                id: user.current.id,
                                                ...convertedLocs
                                            }
                                        });
                                    }
                                }
                                //endregion
                            } catch (error) {
                                logger.warn(error);
                                if (error != NO_USER)
                                    logger.warn(error.errors);
                                else
                                    unsubscribe();
                            }
                    });
                    //endregion
                    //region Begin updating the current user's chat memberships in the database [warning is okay]
                    const updateChatMembership = async () => {
                        try {
                            //region Verify the user is connected to the internet
                            const netInfo = await NetInfo.fetch();
                            if (!netInfo.isInternetReachable || !netInfo.isConnected) return;
                            //endregion
                            //region Verify the user is still logged in [warning is okay]
                            currentUser.current = await Auth.currentAuthenticatedUser();
                            if (!currentUser.current) throw NO_USER;
                            //endregion
                            //region Only update chat membership every 10s no matter what
                            if (Date.now() - lastLCRunDate.current < 10000) return;
                            lastLCRunDate.current = Date.now();
                            //endregion
                            //region Make sure we still have access to get the user's location. If not unsubscribe. [warning is okay]
                            const allow = await Location.getForegroundPermissionsAsync();
                            if (!allow.granted) throw NO_PERMS;
                            //endregion

                            //Get the user's current location and convert it to a format comparable with the database (ft)
                            const location = await Location.getLastKnownPositionAsync();
                            const convertedLocs2 = locConversion.toChat(location.coords.latitude, location.coords.longitude);

                            //region Get the chats near the user (user not necessarily a member)
                            const newChats = await mmAPI.query({
                                call: calls.LIST_CHATS_BY_LOCATION,
                                instance: "loadingPage",
                                input: {
                                    ...convertedLocs2,
                                    radius: rules.nearYouRadius,
                                }
                            });
                            //endregion
                            //region Get the chats the user is already a member of
                            const oldChats = await mmAPI.query({
                                call: calls.GET_CHAT_MEMBERS_BY_IDS,
                                instance: "loadingPage",
                                input: {
                                    userID: user.current.id
                                }
                            });
                            //endregion

                            let cData = [];
                            let bData = [];

                            //region Iterate through the chats the user is a member of. [IF] they're no longer close to that chat [THEN] delete the chat membership
                            for (let i = 0; i < oldChats.items.length; i++) {
                                //region [IF] the
                                if (bData.indexOf(el => el.chatID === oldChats.items[i].chatID) === -1) {
                                    bData.push(oldChats.items[i]);
                                    if (newChats.items.findIndex(el => el.id === oldChats.items[i].chatID) === -1) {
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
                                } else
                                    //To be safe we, we check if there are duplicate chat memberships and delete them.
                                    await mmAPI.mutate({
                                        call: calls.DELETE_CHAT_MEMBERS,
                                        instance: "background",
                                        input: {
                                            id: oldChats.items[i].id
                                        }
                                    });

                            }
                            //endregion
                            //region Iterate through the chats near the user.current. [IF] they weren't already a member of that chat [THEN] create the chat membership
                            for (let i = 0; i < newChats.items.length; i++) {
                                if (oldChats.items.findIndex(el => el.chatID === newChats.items[i].id) === -1) {
                                    if (cData.findIndex(el => el.id === newChats.items[i].id) === -1) {
                                        cData.push(newChats.items[i]);
                                        if (!newChats.items[i].private) {
                                            await mmAPI.mutate({
                                                call: calls.CREATE_CHAT_MEMBERS,
                                                instance: "background",
                                                input: {
                                                    userID: user.current.id,
                                                    chatID: newChats.items[i].id
                                                }
                                            });
                                        }
                                    }
                                }

                            }
                            //endregion
                        } catch (error) {
                            logger.warn(error);
                            if (error !== NO_USER && error !== NO_PERMS) {
                                logger.warn(error);
                            } else {
                                //[IF] no logged in user or no access to location [THEN] unsubscribe from everything.
                                unsubscribe();
                            }
                        }
                    }
                    //Update chat membership once then every 10 seconds
                    await updateChatMembership();
                    lc.current = setInterval(updateChatMembership, rules.locationUpdateFrequency);
                    //endregion
                }

                //region Show any available broadcasts
                //Get all broadcasts
                const broadcasts = (
                    await mmAPI.query({ call: calls.LIST_BROADCASTS, instance: instances.FULL })
                ).items;
                //Get the broadcasts the user has seen
                const userBroadcasts = (
                    await mmAPI.query({
                        call: calls.GET_USER,
                        instance: "userBroadcasts",
                        input: {
                            id: user.current.id
                        }
                    })
                ).broadcasts;

                let shouldShowBroadcast = false;
                let broadcast;

                //region Iterate through each broadcast. [IF] the version isn't exempt [AND] the user hasn't seen it before [THEN] display the most recent broadcast
                for (let i = 0; i < broadcasts.length; i++) {
                    if (broadcasts[i].excemptVersions.indexOf(version) !== -1) continue;
                    if (userBroadcasts.indexOf(broadcasts[i].id) !== -1) continue;
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
                            id: user.current.id,
                            broadcasts: [...userBroadcasts, broadcast.id]
                        }
                    })
                } else navigation.navigate("SecondaryNav");
                //endregion
                //endregion
            } catch (error) {
                logger.log(error);
                //region [IF] there is no logged in user [THEN] exit to auth stack
                if (error === NO_USER) {
                    try {
                        //[IF] there is an unconfirmed user [THEN] navigate to confirmation page [ELSE] navigate to authpage
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
                //endregion
            }

        })();
    },[route.params?.signOut]));
    //endregion

    return (
        <Screen innerStyle={styles.page}>
            <Image
                source={require('../../assets/Logo.png')}
                style={styles.logo}
                resizeMode="contain"
            />
            <View height={20}/>
            <ActivityIndicator size='large' color={dark_colors.pBeam} />
            <Broadcast visible={showBroadcast} broadcast={broadcastData} onClose={closeBroadcast} />
        </Screen>
    );
}

const styles = StyleSheet.create({
    //region logo
    logo: {
        height: 60,
        width: "100%"
    },
    //endregion
    //region page
    page: {
        justifyContent: "center"
	}
    //endregion
})