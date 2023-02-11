import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { colors, css } from '../config';
import BeamTitle from './BeamTitle';
import SubTitle from './SubTitle';

export default function NoUsersAlert({
    style,
}) {
    return (
        <View style={styles.noUsersAlert}>
            <BeamTitle size={24}>No Users</BeamTitle>
            <SubTitle size={16}>There are no users near</SubTitle>
            <SubTitle size={16}>you. Go to a public area</SubTitle>
            <SubTitle size={16}>to start chatting with</SubTitle>
            <SubTitle size={16}>people near you.</SubTitle>
            <View height={20} />
            <MaterialIcons name="group" size={100} color={colors.text3} />
        </View>
    )
}

const styles = StyleSheet.create({
    noUsersAlert: {
        height: 280,
        width: 280,
        alignItems: "center",
        borderRadius: 40,
        borderColor: colors.pBeam,
        borderWidth: 2,
        backgroundColor: colors.container,
        ...css.beamShadow,
        shadowColor: colors.background,
        padding: 14,
        marginTop: 20,
        alignSelf: "center"
    },
});