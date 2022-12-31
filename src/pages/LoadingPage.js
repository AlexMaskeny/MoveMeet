import React, { useCallback, useRef } from 'react';
import { StyleSheet, Image, ActivityIndicator, View } from 'react-native';
import { API, Auth, graphqlOperation } from 'aws-amplify';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useFocusEffect } from '@react-navigation/native';

import { getUserByCognito, updateUser } from '../api/calls';
import * as logger from '../functions/logger';
import * as locConversion from '../functions/locConversion';
import Screen from '../comps/Screen';
import { storage, colors } from '../config';

const NO_USER = "The user is not authenticated";

export default function LoadingPage({navigation}) {
    const loc = useRef();
    const currentUser = useRef();

    const unsubscribe = useCallback(() => {
        currentUser.current = null;
        loc.current.remove();
        logger.log("Unsubscribed from location updates");
    });

    useFocusEffect(useCallback(() => {
        const initialFunction = async () => {
            logger.log("Initiating...");

            try {
                currentUser.current = await Auth.currentAuthenticatedUser();
                if (currentUser.current) {
                    const perm = await Location.getForegroundPermissionsAsync();
                    if (perm.granted) {
                        const user = await API.graphql(graphqlOperation(getUserByCognito, {
                            id: currentUser.current.attributes.sub
                        }));
                        loc.current = await Location.watchPositionAsync({ accuracy: 6, distanceInterval: 0, timeInterval: 10000 }, async (location) => {
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