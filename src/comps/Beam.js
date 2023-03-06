import React from 'react';
import { View, StyleSheet } from 'react-native';

import { dark_colors, css } from '../config';


function Beam({
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
        backgroundColor: dark_colors.pBeam,
        ...css.beamShadow,
	}
});

export default Beam;