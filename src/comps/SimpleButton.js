import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ActivityIndicator, View, Platform } from 'react-native';

import { dark_colors, css } from '../config';

//DESCRIPTION: A button component which is 100% with and cicular radius
//             It posses loading and disabled support.
//UTILIZED:    Utilized in basic forms, especially in the Auth
//             layer of the app

function SimpleButton({
    title,
    onPress,
    innerStyle,
    outerStyle,
    disabled = false,
    loading = false,
}) {
    return (
        <TouchableOpacity style={[{ ...styles.bContainer, borderWidth: disabled ? ( Platform.OS=="android" ? 2 : 0) : 3, borderColor: disabled ? dark_colors.pBeamDisabled : dark_colors.pBeam }, outerStyle]} onPress={onPress} disabled={disabled}>
            <View style={[styles.innerContainer, innerStyle]}>
                {!loading &&
                    <Text style={styles.text}>{title}</Text>
                }
                {loading &&
                    <ActivityIndicator size="small" color={dark_colors.text1} />
                }
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    bContainer: {
        justifyContent: "center",
        //backgroundColor: colors.background,
        backgroundColor: dark_colors.dark,
        alignItems: "center",
        padding: 15,
        marginHorizontal: 10,
        marginVertical: 4,
        elevation: 4,
        borderColor: dark_colors.pBeam,
        borderWidth: 3,
        borderRadius: 30,
        ...css.beamShadow
    },
    text: {
        fontSize: 18,
        fontWeight: 'bold',
        color: dark_colors.text1,
    },
    innerContainer: {
        width: "100%",
        alignItems: "center",
    },
})

export default SimpleButton;