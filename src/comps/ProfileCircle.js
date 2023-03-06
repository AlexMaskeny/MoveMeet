import React from 'react';
import { View, StyleSheet } from 'react-native';

import { dark_colors, css } from '../config';
import Image from './ImageLoader';

function ProfileCircle({
    ppic,
    style,
    innerStyle,
    disabled = false,
    
}) {
    return (
        <View style={[styles.container, style]}>
            <Image
                source={ppic ? ppic.full : " "}
                defaultSource={ppic ? ppic.loadFull : " "}
                cacheKey={ppic ? ppic.fullKey : "ErrorKey"}
                disabled={true}
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
        borderColor: dark_colors.pBeam,
        backgroundColor: dark_colors.background,
        ...css.beamShadow,
    },
    image: {
        flex: 1,
        borderRadius: 30,
        overflow: 'hidden',
    },
});

export default ProfileCircle;