import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ActivityIndicator, View } from 'react-native';

import { colors, css } from '../config';

//DESCRIPTION: A button component which is 100% with and cicular radius
//             It posses loading and disabled support.
//UTILIZED:    Utilized in basic forms, especially in the Auth
//             layer of the app

function ChatButton({
    title,
    style,
    onPress,
    disabled = false,
    loading = false,
}) {
    return (
        <TouchableOpacity style={[styles.bContainer,style]} onPress={onPress} disabled={disabled}>
            <View style={styles.innerContainer}>
                {!loading &&
                    <Text style={styles.text}>{title}</Text>
                }
                {loading &&
                    <ActivityIndicator size="small" color={colors.text1} />
                }
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    bContainer: {
        width: 160,
        justifyContent: "center",
        backgroundColor: 'rgba(18, 18, 18,0.3)',
        alignItems: "center",
        padding: 10,
        marginHorizontal: 10,
        marginVertical: 4,
        elevation: 10,
        
    },
    text: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text2,
    },
    innerContainer: {
        width: "100%",
        alignItems: "center",
    },
})

export default ChatButton;