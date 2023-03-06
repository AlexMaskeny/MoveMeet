import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { dark_colors } from '../config';
import ProfileCircle from './ProfileCircle';

function SimpleMessage({ children, ppic, username, ppOuterStyle, ppInnerStyle, bottomLine, message, style, ...props }) {
    return (
        <View style={styles.container}>
            <ProfileCircle ppic={ppic} style={ppOuterStyle} innerStyle={ppInnerStyle} />
            <View style={{ width: 6 }} />
            <View style={styles.text}>
                <Text
                    style={[styles.tStyle, style]}
                    numberOfLines={2}
                    {...props}
                >{message ? message : "Sent an Image"}</Text>
                {bottomLine && 
                <Text
                    style={styles.btStyle}
                    {...props}
                >{bottomLine}</Text>
                }
            </View>
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
        color: dark_colors.text2,
        fontSize: 16,

    },
    btStyle: {
        color: dark_colors.text4,
        fontSize: 14,
    },
    text: {
        margin: 0,
        flexDirection: 'column'
    }
})

export default SimpleMessage;