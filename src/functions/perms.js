import { Auth } from 'aws-amplify';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';

import { calls, mmAPI } from '../api/mmAPI';
import * as logger from './logger';

const getLocation = async () => {
    try {   
        const result1 = await Location.getForegroundPermissionsAsync();
        if (!result1.granted) await Location.requestForegroundPermissionsAsync();
    } catch (error) {
        logger.warn(error);
    }
}

const getNotifications = async () => {
    try {
        const cognitoUser = await Auth.currentAuthenticatedUser();
        const user = await mmAPI.query({
            call: calls.GET_USER_BY_COGNITO,
            input: {
                id: cognitoUser.attributes.sub
            }
        })
        const result1 = await Notifications.getPermissionsAsync();
        var result2 = {granted: false};
        if (!result1.granted) {
            result2 = await Notifications.requestPermissionsAsync();
        }
        if (result1.granted || result2.granted || result1.ios.status == Notifications.IosAuthorizationStatus.AUTHORIZED) {
            const token = await Notifications.getExpoPushTokenAsync();
            await mmAPI.mutate({
                call: calls.UPDATE_USER,
                input: {
                    id: user.id,
                    allowNotifications: true,
                    expoToken: token.data
                }
            });
        }
    } catch (error) {
        logger.eWarn("error getting notification perms");
        logger.warn(error);
    }
}

const signIn = async () => {
    try {
        const cognitoUser = await Auth.currentAuthenticatedUser();
        const user = await mmAPI.query({
            call: calls.GET_USER_BY_COGNITO,
            input: {
                id: cognitoUser.attributes.sub
            }
        })
        await mmAPI.mutate({
            call: calls.UPDATE_USER,
            input: {
                id: user.id,
                loggedOut: false,
            }
        });
    } catch (error) {
        logger.eWarn("error updating user loggedout status");
        logger.warn(error);
    }
}

export {
    getLocation,
    getNotifications,
    signIn,
}