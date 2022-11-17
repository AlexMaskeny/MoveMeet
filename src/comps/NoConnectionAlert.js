import React from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { colors, css } from '../config';
import BeamTitle from './BeamTitle';
import SubTitle from './SubTitle';


function NoConnectionAlert({
    style,
    ...otherProps
}) {
    return (
        <Modal transparent={true} {...otherProps}>
            <View style={styles.noConnection}>
                <View style={styles.noConnectionAlert}>
                    <BeamTitle size={24}>No Connection</BeamTitle>
                    <SubTitle size={16}>You are seeing this because you</SubTitle>
                    <SubTitle size={16}>don't have an internet connection.</SubTitle>
                    <SubTitle size={16}>Once you're internet comes</SubTitle>
                    <SubTitle size={16}>back, the app will reactive.</SubTitle>
                    <View height={20} />
                    <MaterialCommunityIcons name="transit-connection-variant" size={140} color={colors.text3} />
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
        borderColor: colors.pBeam,
        borderWidth: 2,
        backgroundColor: colors.container,
        ...css.beamShadow,
        shadowColor: colors.background,
        padding: 14,
    },
});

export default NoConnectionAlert;