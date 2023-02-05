import React from 'react';
import { Text, View, StyleSheet, ImageBackground } from 'react-native';

import { colors, css } from '../config';
import IconButton from './IconButton';
//import Image from './ImageLoader';

function ImageInput({
    pic,
    onDisable,
    style

}) {
    return (
        <View style={[styles.container, style]}>
            <ImageBackground
                source={{ uri: pic }}
                style={styles.image}
            >
            </ImageBackground>
            <IconButton brand="Ionicons" icon="close-circle" size={34} color={colors.text1} style={styles.removeButton} onPress={() => onDisable()} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.container,
        flex: 1,
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginHorizontal: 10,
        height: 300,
        marginVertical: 4,
        padding: 10,
        borderRadius: 30,
    },
    image: {
        width: 200,
        height: 280,
        borderRadius: 20,
        overflow: 'hidden',
        alignItems: "flex-end",
    },
    removeButton: {
        margin: 4,
    }

});

export default ImageInput;