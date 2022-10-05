import React from 'react';
import { SafeAreaView, StyleSheet, View} from 'react-native';
import { colors } from '../config';

//DESCRIPTION: A screen comp which sets the background color
//             to background color set in config. Acts as a
//             safe area view.
//UTILIZED:    Utilized in all pages


function Screen({children, style, innerStyle}) {
    return (
        <SafeAreaView style={[styles.screen, style]}>
            <View style={[styles.inner, innerStyle]}>
                {children}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
        alignSelf: "center",
        backgroundColor: colors.background,
    },
    inner: {
        flex: 1,
        width: "100%",
        backgroundColor: colors.background,
    },
})

export default Screen;