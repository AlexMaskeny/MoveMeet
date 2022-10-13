import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons"

import { colors } from '../config';

function IconTitle({ brand = "MaterialCommunityIcons", icon, children, style, ...props }) {
    return (
        <View style={styles.container}>
            {brand == "MaterialCommunityIcons" &&
                <MaterialCommunityIcons
                    name={icon}
                    size={20}
                    color={colors.text1}
                    style={styles.icon} />
            }
            {brand == "Ionicons" &&
                <Ionicons
                    name={icon}
                    size={20}
                    color={colors.text1}
                    style={styles.icon} />
            }
            <Text
                style={[styles.tStyle, style]}
                {...props}
            >{children}</Text>
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
        
    },
    icon: {
        marginRight: 4,
        alignSelf: "center",
    },
})

export default IconTitle;