import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../config';
import ProfileCircle from './ProfileCircle';
import SubTitle from './SubTitle';

function ComplexMessage({ children, ppic, username, message, style, time, ...props }) {
    return (
        <View style={styles.container}>
            <ProfileCircle ppic={ppic} style={styles.pCircle} />
            <View style={{ width: 6 }} />
            <View style={{ flex: 1, marginRight: 10}}>
                <View style={{ flexDirection: 'row', flex: 1, justifyContent: "space-between" }}>
                    <SubTitle size={16} color={colors.text4}>{username}</SubTitle>
                    <SubTitle size={14} color={colors.text4}>{time}</SubTitle>
                </View>
                <Text
                    style={[styles.tStyle, style]}
                    numberOfLines={0}
                    
                    {...props}
                >{message}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: "flex-start",
        flexDirection: "row",
        justifyContent: "flex-start",
        borderRadius: 30,

    },
    tStyle: {
        color: colors.text3,
        fontSize: 16,
        flex: 2,
    },
    pCircle: {
        width: 44,
        height: 44,
        borderWidth: 1,
        shadowOpacity: 0,
        borderColor: colors.text3
    }
})

export default ComplexMessage;