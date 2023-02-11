import { API, Auth, graphqlOperation } from 'aws-amplify';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';

import { getUserByCognito, updateUser } from '../api/calls';
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
        const user = await API.graphql(graphqlOperation(getUserByCognito, {
            id: cognitoUser.attributes.sub
        }));
        const result1 = await Notifications.getPermissionsAsync();
        var result2 = {granted: false};
        if (!result1.granted) {
            result2 = await Notifications.requestPermissionsAsync();
        }
        if (result1.granted || result2.granted || result1.ios.status == Notifications.IosAuthorizationStatus.AUTHORIZED) {
            const token = await Notifications.getExpoPushTokenAsync();
            await API.graphql(graphqlOperation(updateUser, {
                input: {
                    id: user.data.getUserByCognito.id,
                    allowNotifications: true,
                    expoToken: token
                }
            }))
        } else if (user.data.getUserByCognito.allowNotifications) {
            await API.graphql(graphqlOperation(updateUser, {
                input: {
                    id: user.data.getUserByCognito.id,
                    allowNotifications: false,
                }
            }))
        }
    } catch (error) {
        logger.warn(error);
    }
}

export {
    getLocation,
    getNotifications
}