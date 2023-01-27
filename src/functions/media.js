import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import * as logger from '../functions/logger';
const openPhotos = async (onSuccess) => {
    try {
        const perms = await ImagePicker.getMediaLibraryPermissionsAsync();
        if (!perms.granted) {
            Alert.alert("No Permsision", "We don't have access to your photos.", [
                {
                    text: "Give Access", onPress: async () => {
                        try {
                            const result = await ImagePicker.requestMediaLibraryPermissionsAsync();
                            if (result.granted) openPhotos(onSuccess);
                            else return;
                        } catch (error) {
                            logger.warn(error);
                        }
                    }
                },
                { text: "Cancel", }
            ]);
        } else {
            const result = await ImagePicker.launchImageLibraryAsync();
            if (result) {
                if (result.canceled) return
                else onSuccess(result.assets[0].uri);
            } else Alert.alert("Try Again", "Something went wrong when opening your photos. Try Again.");
        }
    } catch (error) {
        logger.warn(error);
    }
}
const openCamera = async (onSuccess) => {
    try {
        const perms = await ImagePicker.getCameraPermissionsAsync();
        if (!perms.granted) {
            Alert.alert("No Permsision", "We don't have access to your Camera.", [
                {
                    text: "Give Access", onPress: async () => {
                        try {
                            const result = await ImagePicker.requestCameraPermissionsAsync();
                            if (result.granted) openCamera(onSuccess);
                            else return;
                        } catch (error) {
                            logger.warn(error);
                        }
                    }
                },
                { text: "Cancel", }
            ]);
        } else {
            const result = await ImagePicker.launchCameraAsync();
            if (result) {
                if (result.canceled) return
                else onSuccess(result.assets[0].uri);
            } else Alert.alert("Try Again", "Something went wrong when opening your camera. Try Again.");
        }
    } catch (error) {
        logger.warn(error);
    }
}

export {
    openCamera,
    openPhotos
}