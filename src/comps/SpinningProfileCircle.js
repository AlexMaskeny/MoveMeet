import React from 'react';
import { Text, View, StyleSheet, Image } from 'react-native';

import { colors, css } from '../config';
import LottieView from 'lottie-react-native';

function SpinningProfileCircle({
    ppic,
    style,
    Ref

}) {
    return (
        <View style={styles.hoContainer}>
            <View style={[styles.container, style]}>
                <Image
                    source={{ uri: ppic.loadImage ? ppic.loadImage : ppic.uri }}
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
                            color: colors.text3,
                        },
                        {
                            keypath: 'Dot_2',
                            color: colors.text3,
                        },
                        {
                            keypath: 'Dot_3',
                            color: colors.text3,
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
        borderColor: colors.pBeam,
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
        backgroundColor: colors.container,
        borderRadius: 10,
        width: 50,
        height: 36,
        marginLeft: 8,
        alignItems: "center",
        justifyContent: "center"
    }

});

export default SpinningProfileCircle;