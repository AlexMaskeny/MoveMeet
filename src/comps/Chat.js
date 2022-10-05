import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

import { colors, css } from '../config';

//DESCRIPTION: A generalized chat box which will be embedded
//             inside of a flatlist on the ChatsPage
//UTILIZED:    Utilized on the ChatsPage

function Chat({
    
}) {
    return (
        <View style={styles.container}>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
        height: 100,
        borderRadius: 20,
        backgroundColor: colors.container,
        shadowOffset: { width: 1, height: 2 },
        shadowRadius: 3,
        shadowOpacity: 0.3,
        margin: 6,
    }
});

export default Chat;