import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons"

import { dark_colors } from '../config';

function IconTitle({ brand = "MaterialCommunityIcons", icon, children, style, ...props }) {
    if (brand == "MaterialCommunityIcons") {
        return (
            <View style={styles.container}>
                <MaterialCommunityIcons
                    name={icon}
                    size={20}
                    color={dark_colors.text1}
                    style={styles.icon}
                />
                <Text
                    style={[styles.tStyle, style]}
                    {...props}
                >{children}</Text>
            </View>
        )
    } else if (brand == "Ionicons") {
        return (
            <View style={styles.container}>
                <Ionicons
                    name={icon}
                    size={20}
                    color={dark_colors.text1}
                    style={styles.icon}
                />
                <Text
                    style={[styles.tStyle, style]}
                    {...props}
                >{children}</Text>
            </View>
        )
    } else {
        return <></>
    }
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
    icon: {
        marginRight: 4,
        alignSelf: "center",
    },
})

export default IconTitle;