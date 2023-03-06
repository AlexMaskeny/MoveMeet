import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { dark_colors, css } from '../config';

//DESCRIPTION: An icon of 3 types imported above that is clickable
//             acts as a button
//UTILIZED:    Utilized in tab navigators and 
//             other similar secenerios

function IconButton({
    icon,
    size,
    onPress,
    brand = "MaterialCommunityIcons",
    color = dark_colors.text2,
    disabled = false,
    style,
}) {
    return (
        <TouchableOpacity
            style={styles.container}
            onPress={onPress}
            disabled={disabled}
        >
            {brand == "MaterialCommunityIcons" &&
                <MaterialCommunityIcons
                    name={icon}
                    size={size}
                    style={style}
                    color={color}
                />
            }            
            {brand == "Ionicons" &&
                <Ionicons
                    name={icon}
                    size={size}
                    style={style}
                    color={color}
                />
            }
            {brand == "MaterialIcons" &&
                <MaterialIcons
                    name={icon}
                    size={size}
                    style={style}
                    color={color}
                />
            }
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
        justifyContent: "center"
    }
});

export default IconButton;