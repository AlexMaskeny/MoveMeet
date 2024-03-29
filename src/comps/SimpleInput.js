import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from "@expo/vector-icons"

import { dark_colors } from '../config';
import BeamTitle from './BeamTitle';
import IconButton from './IconButton';

//DESCRIPTION: An input component which does NOT support multilines
//             It posses icon and far right BeamTitle support.
//UTILIZED:    Utilized in basic forms, especially in the Auth
//             layer of the app
//NOTE:        To get this component without any icons or text, take container and inputtext styles. 
//             Remove all non TextInput subcomponents of primary view container

function SimpleInput({reference, icon, text, cStyle, tStyle, showRightButton = false, rightButtonProps, ...props}) {
    return (
        <View style={[styles.container, cStyle]}>
            {icon &&
                <MaterialCommunityIcons
                    name={icon}
                    size={20}
                    color={dark_colors.text2}
                    style={styles.icon} />
            }
            <TextInput
                ref={reference}
                placeholderTextColor={dark_colors.text1}
                style={[styles.inputText, tStyle]}
                {...props}
            />
            {showRightButton && <><IconButton {...rightButtonProps} /><View style={{ width: 10 }} /></>}
            {text && <BeamTitle size={16}>{text}</BeamTitle>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: dark_colors.container,
        alignItems: "center",
        flexDirection: "row",
        marginHorizontal: 10,
        marginVertical: 4,
        paddingHorizontal: 14,
        borderRadius: 30,
	},
    inputText: {
        color: dark_colors.text1,
        fontSize: 16,
        flex: 1,
        paddingVertical: 14,
    },
    icon: {
        marginRight: 10,
        alignSelf: "center",
    },
})

export default SimpleInput;