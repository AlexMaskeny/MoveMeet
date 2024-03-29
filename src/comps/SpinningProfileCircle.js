import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';

import Image from './ImageLoader';
import { dark_colors, css } from '../config';

function SpinningProfileCircle({
    ppic,
    style,
    Ref

}) {
    return (
        <View style={styles.hoContainer}>
            <View style={[styles.container, style]}>
                <Image
                    source={ppic ? ppic.full : " "}
                    defaultSource={ppic ? ppic.loadFull : " "}
                    cacheKey={ppic ? ppic.fullKey : "ErrorKey"}
                    disabled={true}
                    style={styles.image}
                    resizeMode="cover"
                />
            </View>
            <View style={styles.msg}>
                <LottieView
                    ref={Ref}
                    style={{ width: 14, height: 14, }}
                    source={require('../lotties/loader.json')}
                    autoPlay={true}
                    colorFilters={[
                        {
                            keypath: 'Dot_1',
                            color: dark_colors.text3,
                        },
                        {
                            keypath: 'Dot_2',
                            color: dark_colors.text3,
                        },
                        {
                            keypath: 'Dot_3',
                            color: dark_colors.text3,
                        },

                    ]}

                    loop={true}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: 44,
        height: 44,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: dark_colors.pBeam,
        ...css.beamShadow,
    },
    image: {
        flex: 1,
        borderRadius: 30,
        overflow: 'hidden',
    },
    hoContainer: {
        flexDirection: "row",
        marginBottom: 10,
        marginLeft: 2,
        alignItems: "center"
    },
    msg: {
        backgroundColor: dark_colors.container,
        borderRadius: 10,
        width: 50,
        height: 36,
        marginLeft: 8,
        alignItems: "center",
        justifyContent: "center"
    }

});

export default SpinningProfileCircle;