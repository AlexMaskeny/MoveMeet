import React from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { dark_colors, css } from '../config';
import BeamTitle from './BeamTitle';
import SubTitle from './SubTitle';


function NoConnectionAlert({
    style,
    visible=false,
    ...otherProps
}) {
    return (
        <Modal transparent={true} visible={visible} {...otherProps}>
            <View style={styles.noConnection}>
                <View style={styles.noConnectionAlert}>
                    <BeamTitle size={24}>No Connection</BeamTitle>
                    <SubTitle size={16}>You are seeing this because you</SubTitle>
                    <SubTitle size={16}>don't have an internet connection.</SubTitle>
                    <SubTitle size={16}>Once you're internet comes</SubTitle>
                    <SubTitle size={16}>back, the app will reactive.</SubTitle>
                    <View height={20} />
                    <MaterialCommunityIcons name="transit-connection-variant" size={140} color={dark_colors.text3} />
                    <View height={20} />
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    noConnection: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(5,5,5,0.6)"
    },
    noConnectionAlert: {
        height: 340,
        width: 280,
        alignItems: "center",
        borderRadius: 14,
        borderColor: dark_colors.pBeam,
        borderWidth: 2,
        backgroundColor: dark_colors.container,
        ...css.beamShadow,
        shadowColor: dark_colors.background,
        padding: 14,
    },
});

export default NoConnectionAlert;