import React from 'react';
import { Text, View, StyleSheet, ImageBackground, Modal } from 'react-native';

import { dark_colors, css } from '../config';

import Screen from './Screen';
import IconButton from './IconButton';
//import Image from './ImageLoader';

function PreviewImage({
    pic,
    visible,
    onDisable,
    style

}) {
    return (
        <Modal visible={visible} s>
            <Screen>
                <ImageBackground
                    source={{ uri: pic }}
                    style={styles.image}
                    resizeMode="cover"
                >
                    <IconButton brand="Ionicons" icon="close-circle" size={34} color={dark_colors.background} style={styles.removeButton} onPress={() => onDisable()} />
                </ImageBackground>
            </Screen>
        </Modal>
    );
}

const styles = StyleSheet.create({

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

export default PreviewImage;