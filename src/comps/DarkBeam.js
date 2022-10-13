import React from 'react';
import { View, StyleSheet } from 'react-native';

import { colors, css } from '../config';


function DarkBeam({
    style,
    ...otherProps
}) {
    return (
        <View style={[styles.beam, style]} {...otherProps} />
    );
}

const styles = StyleSheet.create({
    beam: {
        width: "100%",
        height: 2,
        backgroundColor: colors.background,
    }
});

export default DarkBeam;