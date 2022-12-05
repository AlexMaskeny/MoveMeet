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
                resizeMode="contain"
            >
                <IconButton brand="Ionicons" icon="close-circle" size={34} color={colors.background} style={styles.removeButton} onPress={() => onDisable()} />
            </ImageBackground>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.container,
        flex: 1,
        marginHorizontal: 10,
        height: 300,
        marginVertical: 4,
        padding: 10,
        borderRadius: 30,
    },
    image: {
        flex: 1,
        borderRadius: 30,
        overflow: 'hidden',
        alignItems: "flex-end",
    },
    removeButton: {
        margin: 4,
    }

});

export default ImageInput;