import { Auth } from 'aws-amplify';
import {Alert} from "react-native";
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';

import { calls, mmAPI } from '../api/mmAPI';
import * as logger from './logger';
import {strings} from "../config";

const getLocation = async (alertOnCannotAsk = false) => { //returns either none, cannotAsk, foreground, or background
    try {
        let type = "none";
        const result1 = await Location.getForegroundPermissionsAsync();
        let result2 = {granted: false};
        if (!result1.granted && result1.canAskAgain) {
            result2 = await Location.requestForegroundPermissionsAsync();
        } else if (!result1.canAskAgain) {
            if (alertOnCannotAsk) {
                Alert.alert("Go to your settings", "In order to enable " + strings.APPNAME + " to access your location, you need to enable it in your settings");
            }
            type = "cannotAsk";
        }
        if (result2.granted || result1.granted) {
            type = "foreground";
            // let result3 = await Location.getBackgroundPermissionsAsync();
            // let result4 = {granted: false};
            // if (!result3.granted && result3.canAskAgain) {
            //     result4 = await Location.requestBackgroundPermissionsAsync();
            // }
            // if (result3.granted || result4.granted) {
            //     type = "background";
            // }
        }
        return type;
    } catch (error) {
        logger.warn(error);
    }
}

const getNotifications = async (alertOnCannotAsk = false) => { //returns true / false
    try {
        const cognitoUser = await Auth.currentAuthenticatedUser();
        const user = await mmAPI.query({
            call: calls.GET_USER_BY_COGNITO,
            input: {
                id: cognitoUser.attributes.sub
            }
        })
        const result1 = await Notifications.getPermissionsAsync();
        let result2 = {granted: false};
        if (!result1.granted && result1.canAskAgain) {
            result2 = await Notifications.requestPermissionsAsync();
        } else if (!result1.canAskAgain) {
            if (alertOnCannotAsk) {
                Alert.alert("Go to your settings", "In order to enable " + strings.APPNAME + " to send you notifications, you need to enable it in your settings");
            }
            return false;
        }

        if (result1.granted || result2.granted) {
            const token = await Notifications.getExpoPushTokenAsync();
            mmAPI.mutate({
                call: calls.UPDATE_USER,
                input: {
                    id: user.id,
                    allowNotifications: true,
                    expoToken: token.data
                }
            });
            return true;
        } else return false;

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