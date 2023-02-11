import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { colors, css } from '../config';
import BeamTitle from './BeamTitle';
import SubTitle from './SubTitle';

export default function NoChatsAlert({
    isPrivate = false,
    style,
}) {
    if (!isPrivate) return (
        <View style={styles.noChatsAlert}>
            <BeamTitle size={24}>No Chats</BeamTitle>
            <SubTitle size={16}>There are no chats near</SubTitle>
            <SubTitle size={16}>you. Go to a public area</SubTitle>
            <SubTitle size={16}>to start chatting with</SubTitle>
            <SubTitle size={16}>people near you.</SubTitle>
            <View height={20} />
            <MaterialIcons name="group" size={100} color={colors.text3} />
        </View>
    );
    else return (
        <View style={styles.noChatsAlert}>
            <BeamTitle size={24}>No Messages</BeamTitle>
            <SubTitle size={16}>You have no messages from any</SubTitle>
            <SubTitle size={16}>users. Discover users through</SubTitle>
            <SubTitle size={16}>chats or the discover page.</SubTitle>
            <View height={20} />
            <MaterialIcons name="group" size={100} color={colors.text3} />
        </View> 
    )
}

const styles = StyleSheet.create({
    noChatsAlert: {
        height: 280,
        width: 280,
        alignItems: "center",
        borderRadius: 30,
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