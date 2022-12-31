import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { colors, css } from '../config';
import BeamTitle from './BeamTitle';
import SubTitle from './SubTitle';
import SimpleButton from './SimpleButton';
import Screen from './Screen';


export default function NoChatsAlert({
    style,
    visible = false,
    ...otherProps
}) {
    if (visible) {
        return (
            <Screen innerStyle={styles.innerStyle} style={styles.noLocation}>
                <View style={styles.noLocationAlert}>
                    <BeamTitle size={24}>No Chats</BeamTitle>
                    <SubTitle size={16}>There are no chats near</SubTitle>
                    <SubTitle size={16}>you. Go to a public area</SubTitle>
                    <SubTitle size={16}>to start chatting with</SubTitle>
                    <SubTitle size={16}>people near you.</SubTitle>
                    <View height={20} />
                    <MaterialIcons name="group" size={140} color={colors.text3} />
                    <View height={20} />
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
        height: 360,
        width: 280,
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
});