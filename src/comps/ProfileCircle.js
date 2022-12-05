import React from 'react';
import { Text, View, StyleSheet, Image } from 'react-native';

import { colors, css } from '../config';
//import Image from './ImageLoader';

function ProfileCircle({
    ppic,
    style
    
}) {
    return (
        <View style={[styles.container, style]}>
            <Image
                source={{uri: ppic.loadImage ? ppic.loadImage : ppic.uri}}
                style={styles.image}
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
        ...css.beamShadow,
    },
    image: {
        flex: 1,
        borderRadius: 30,
        overflow: 'hidden',
    }
    
});

export default ProfileCircle;