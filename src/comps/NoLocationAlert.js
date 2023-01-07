import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { colors, css } from '../config';
import BeamTitle from './BeamTitle';
import SubTitle from './SubTitle';
import SimpleButton from './SimpleButton';
import Screen from './Screen';


export default function NoLocationAlert({
    style,
    enable,
    feature = false,
    visible = false,
    ...otherProps
}) {
    if (visible) {
        return (
            <Screen innerStyle={styles.innerStyle} style={styles.noLocation}>
                <View style={styles.noLocationAlert}>
                    <BeamTitle size={24}>Page Disabled</BeamTitle>
                    <SubTitle size={16}>You are seeing this because</SubTitle>
                    <SubTitle size={16}>you cannot use this page</SubTitle>
                    <SubTitle size={16}>without allowing ProxyChat to</SubTitle>
                    <SubTitle size={16}>use your Location.</SubTitle>
                    <View height={20} />
                    <MaterialIcons name="location-city" size={140} color={colors.text3} />
                    <View height={20} />
                    <View style={styles.buttons}>
                        <SimpleButton title="Enable" onPress={enable} outerStyle={styles.button} />
                    </View>
                </View>
            </Screen>
        );
    }
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
        borderRadius: 14,
        borderColor: colors.pBeam,
        borderWidth: 2,
        backgroundColor: colors.container,
        ...css.beamShadow,
        shadowColor: colors.background,
        padding: 14,
        marginBottom: 100
    },
    buttons: {
        width: "100%",
        flexDirection: "row",
    },
    button: {
        backgroundColor: colors.container,
        margin: 0,
        flex: 1,
    }
});