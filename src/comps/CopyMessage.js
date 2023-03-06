import React from 'react';
import { View, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

import { dark_colors, css } from '../config';
import BeamTitle from './BeamTitle';
import SubTitle from './SubTitle';
import SimpleButton from './SimpleButton';
import ComplexMessage from './ComplexMessage';
import DarkBeam from './DarkBeam';


export default function CopyMessage({
    style,
    visible = false,
    onRequestClose,
    keyboardShown,
    item,
    ...otherProps
}) {
    const copy = async () => {
        await Clipboard.setStringAsync(item.message);
        onRequestClose();
    }
    if (item && visible) {
        return (
            <Modal visible={visible} transparent={true}>
                <ComplexMessage {...item} />
            </Modal>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        height: "100%",
        width: "100%",
        //alignItems: "center",
        //padding: 10,
        //paddingTop: 50,
        //paddingBottom: 30,
        //justifyContent: "center",
        //backgroundColor: "rgba(0,0,0,0.3)",
    },
    messageContainer: {
        backgroundColor: dark_colors.container,
        padding: 10,
        margin: 10,
        borderRadius: 20,
        borderColor: dark_colors.pBeam,
        borderWidth: 1,
        ...css.beamShadow,
    },
    buttonContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-start",
    },
    belowContainer: {
        backgroundColor: dark_colors.container,
        paddingHorizontal: 10,
        paddingVertical: 14,
        marginHorizontal: 10,
        borderRadius: 20,
        borderColor: dark_colors.pBeam,
        borderWidth: 1,
        ...css.beamShadow,

    },
});
