import React, { useEffect } from 'react';
import { Text, View, StyleSheet, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { colors, css } from '../config';
//import Image from './ImageLoader';

function ProfileCircle({
    ppic,
    style,
    innerStyle,
    
}) {
    return (
        <View style={[styles.container, style]}>
            <Image
                source={{ uri: ppic.loadImage ? ppic.loadImage : ppic.uri }}
                style={[styles.image, innerStyle]}
                resizeMode="cover"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: 50,
        height: 50,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: colors.pBeam,
        backgroundColor: colors.background,
        ...css.beamShadow,
    },
    image: {
        flex: 1,
        borderRadius: 30,
        overflow: 'hidden',
    },

    
});

export default ProfileCircle;