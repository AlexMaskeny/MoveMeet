import React from 'react';
import { View, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

import { colors, css } from '../config';
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
            <View style={styles.container} onPress={onRequestClose}>

                    <ComplexMessage {...item} />
             
                {/*<View style={styles.belowContainer}>*/}
                {/*    <TouchableOpacity style={styles.buttonContainer} onPress={copy}>*/}
                {/*        <MaterialCommunityIcons name="content-copy" size={26} color={colors.text1} />*/}
                {/*        <View style={{width: 10}} />*/}
                {/*        <SubTitle color={colors.text2} size={18}>Copy Message</SubTitle>*/}
                {/*    </TouchableOpacity>*/}
                {/*    <DarkBeam style={{ backgroundColor: colors.text4, height: 1, marginVertical: 14 }} />*/}
                {/*    <TouchableOpacity style={styles.buttonContainer} onPress={onRequestClose}>*/}
                {/*        <MaterialCommunityIcons name="cancel" size={26} color={colors.text1} />*/}
                {/*        <View style={{ width: 10 }} />*/}
                {/*        <SubTitle color={colors.text2} size={18}>Cancel</SubTitle>*/}
                {/*    </TouchableOpacity>*/}
                {/*</View>*/}
            </View>
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
        backgroundColor: colors.container,
        padding: 10,
        margin: 10,
        borderRadius: 20,
        borderColor: colors.pBeam,
        borderWidth: 1,
        ...css.beamShadow,
    },
    buttonContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-start",
    },
    belowContainer: {
        backgroundColor: colors.container,
        paddingHorizontal: 10,
        paddingVertical: 14,
        marginHorizontal: 10,
        borderRadius: 20,
        borderColor: colors.pBeam,
        borderWidth: 1,
        ...css.beamShadow,

    },
});
