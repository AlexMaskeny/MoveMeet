import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';

import { colors, css } from '../config';
import BeamTitle from './BeamTitle';
import SubTitle from './SubTitle';
import Screen from './Screen';


export default function CheckingForUsers({
    style,
    searchingFor="chats",
    visible = false,
    ...otherProps
}) {
    if (visible) {
        return (
            <Screen innerStyle={styles.innerStyle} style={styles.noLocation}>
                <View style={styles.noLocationAlert}>

                    <BeamTitle size={24}>Searching for {searchingFor}</BeamTitle>
                    <SubTitle size={16}>Sometimes this takes some time. If</SubTitle>
                    <SubTitle size={16}>you find a bug please report it!</SubTitle>
                    <View height={20} />
                    <ActivityIndicator size="large" color={colors.text1} />
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

        padding: 14,
        marginBottom: 100
    },
});