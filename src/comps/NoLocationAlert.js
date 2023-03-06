import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';

import { dark_colors, css, strings } from '../config';
import BeamTitle from './BeamTitle';
import SubTitle from './SubTitle';
import SimpleButton from './SimpleButton';


export default function NoLocationAlert({
    style,
    enable,
    ...otherProps
}) {
    const enableLocation = async () => {
        const result = await Location.getForegroundPermissionsAsync();
        if (result.canAskAgain) {
            const result = await Location.requestForegroundPermissionsAsync();
            if (result.granted) enable();
        } else {
            Alert.alert("Go to your settings", "In order to enable " + strings.APPNAME + " to access your location, you need to enable it in your settings");
        }
    }
    return (
        <View style={styles.noLocationAlert}>
            <BeamTitle size={24}>Page Disabled</BeamTitle>
            <SubTitle size={16}>You are seeing this because</SubTitle>
            <SubTitle size={16}>you cannot use this page</SubTitle>
            <SubTitle size={16}>without allowing {strings.APPNAME} to</SubTitle>
            <SubTitle size={16}>use your Location.</SubTitle>
            <View height={20} />
            <MaterialIcons name="location-city" size={140} color={dark_colors.text3} />
            <View height={20} />
            <View style={styles.buttons}>
                <SimpleButton title="Enable" onPress={enableLocation} outerStyle={styles.button} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    noLocation: {

        position: "absolute"
    },
    innerStyle: {
        justifyContent: "center",
        alignItems: "center",
    },
    noLocationAlert: {
        height: 400,
        width: 300,
        alignItems: "center",
        alignSelf: "center",
        borderRadius: 14,
        borderColor: dark_colors.pBeam,
        borderWidth: 2,
        backgroundColor: dark_colors.container,
        ...css.beamShadow,
        shadowColor: dark_colors.background,
        padding: 14,
        marginTop: 20,
        marginBottom: 100
    },
    buttons: {
        width: "100%",
        flexDirection: "row",
    },
    button: {
        backgroundColor: dark_colors.container,
        margin: 0,
        flex: 1,
    }
});