import React from 'react';
import { ImageBackground, SafeAreaView, StyleSheet, View} from 'react-native';
import { dark_colors } from '../config';

//DESCRIPTION: A screen comp which sets the background color
//             to background color set in config. Acts as a
//             safe area view.
//UTILIZED:    Utilized in all pages


function Screen({ children, style, colorBack = false, innerStyle, theme = "dark" }) {
    if (colorBack && theme === "dark") return (
        <View style={styles.img}>
            <SafeAreaView style={[styles.screen, style]}>
                <View style={[styles.inner, innerStyle]}>
                    {children}
                </View>
            </SafeAreaView>
        </View>
    )
    else if (!colorBack && theme === "dark") return (
        <ImageBackground source={require("../../assets/darkback.png")} style={styles.img} resizeMode="cover">
            <SafeAreaView style={[styles.screen, style]}>
                <View style={[styles.inner, innerStyle]}>
                    {children}
                </View>
            </SafeAreaView>
        </ImageBackground>
    )

}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        width: "100%",
        height: "100%",



    },
    inner: {
        flex: 1,
        width: "100%",

    },
    img: {
        width: "100%",
        height: "100%",
        backgroundColor: dark_colors.background,
    }
})

export default Screen;