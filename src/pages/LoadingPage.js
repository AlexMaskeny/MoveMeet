import React from 'react';
import { StyleSheet, Image, ActivityIndicator, View } from 'react-native';
import { API, Auth, graphqlOperation } from 'aws-amplify';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useFocusEffect } from '@react-navigation/native';

import { getUserByCognito, updateUser } from '../api/calls';
import { colors, debug, locConversion2 } from '../config';
import Screen from '../comps/Screen';

export default function LoadingPage({navigation, route}) {

    useFocusEffect(() => {
        var loc;
        const unsubscribe = () => {
            if (loc) {
                loc.remove();

            }
        }
        const initialFunction = async () => {
            if (debug) console.log("Initiating...");
                try {
                    var currentUser = await Auth.currentAuthenticatedUser();
                    if (currentUser) {
                        const perm = await Location.getForegroundPermissionsAsync();
                        const user = await API.graphql(graphqlOperation(getUserByCognito, {
                            id: currentUser.attributes.sub
                        }))
                        if (perm.granted) {
                            loc = await Location.watchPositionAsync({ accuracy: 6, distanceInterval: 0, timeInterval: 10000, }, async (location) => {
                                try {
                                    currentUser = await Auth.currentAuthenticatedUser();
                                    if (currentUser) {
                                        const convertedLocs = locConversion2(location.coords.latitude, location.coords.longitude)
                                        await API.graphql(graphqlOperation(updateUser, {
                                            input: {
                                                id: user.data.getUserByCognito.id,
                                                ...convertedLocs
                                            }
                                        }))
                                    } else {
                                        unsubscribe()
                                    }
                                } catch (error) {
                                    if (debug) console.log(error);
                                    unsubscribe()
                                }
                                
                            })
                        }
                        //not = Notifications.addNotificationReceivedListener(async (notification) => {
                        //    if (debug) console.log(notification);
                        //    await Notifications.cancelScheduledNotificationAsync(notification.request.identifier);
                        //})

                        navigation.navigate("SecondaryNav");
                    }
                } catch (error) {
                    if (debug) console.log(error);
                    if (error == "The user is not authenticated") {
                        const result = await AsyncStorage.getItem("unconfirmed");
                        if (result) {
                            const parsed = JSON.parse(result);
                            if (parsed.val) {
                                if (debug) console.log("Unconfirmed User Exists");
                                //navigate to signup with unconfirmed route.
                            }
                        }
                        //else navigate to loginpage, possibly a general page if you want.
                        navigation.navigate("LoginPage");
                    } else if (error == "No current user") unsubscribe();
			    }
        }
        initialFunction();
        return () => { unsubscribe(); }
    });

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