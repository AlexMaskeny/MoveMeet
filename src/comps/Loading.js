import React from 'react';
import { View, StyleSheet, Image, ActivityIndicator } from 'react-native';

import Screen from './Screen';
import { colors, css } from '../config';

function Loading({enabled}) {
    if (enabled) {
        return (
            <Screen innerStyle={styles.page} style={styles.outerPage}>
                {/*<Image*/}
                {/*    source={require('../../assets/Logo.png')}*/}
                {/*    style={styles.logo}*/}
                {/*    resizeMode="contain"*/}
                {/*/>*/}
                {/*<View height={20} />*/}
                <ActivityIndicator size='large' color={colors.pBeam} />
            </Screen>
        )
    } else {
        return (<></>)
    };
}

const styles = StyleSheet.create({
    logo: {
        height: 60,
        width: "100%"
    },
    page: {
        marginTop: 20,
        justifyContent: "flex-start",
    },
    outerPage: {
        position: "absolute",
    }
});

export default Loading;