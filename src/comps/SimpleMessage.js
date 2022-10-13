import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../config';
import ProfileCircle from './ProfileCircle';

function SimpleMessage({ children, ppic, username, message, style, ...props }) {
    return (
        <View style={styles.container}>
            <ProfileCircle ppic={ppic} />
            <View style={{width: 6} } />
            <Text
                style={[styles.tStyle, style]}
                numberOfLines={2}
                {...props}
            >{message}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
        flexDirection: "row",
        borderRadius: 30,

    },
    tStyle: {
        color: colors.text2,
        fontSize: 16,
        flex: 2,

    },
})

export default SimpleMessage;