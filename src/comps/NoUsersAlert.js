import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { colors, css } from '../config';
import BeamTitle from './BeamTitle';
import SubTitle from './SubTitle';
import SimpleButton from './SimpleButton';
import Screen from './Screen';


export default function NoUsersAlert({
    style,
    visible = false,
    ...otherProps
}) {
    if (visible) {
        return (
            <Screen innerStyle={styles.innerStyle} style={styles.noLocation}>
                <View style={styles.noLocationAlert}>
                    <BeamTitle size={24}>No Users</BeamTitle>
                    <SubTitle size={16}>There aren't any users in your</SubTitle>
                    <SubTitle size={16}>Area right now. You might find</SubTitle>
                    <SubTitle size={16}>some in a more popular place.</SubTitle>
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