//region 3rd Party Imports
import React, {useState} from 'react';
import {View, StyleSheet, ActivityIndicator} from 'react-native';
//endregion
//region 1st Party Imports
import { colors } from '../config';
import IconButton from './IconButton';
import ImageLoader from './ImageLoader';
//endregion

export default function ImageInput({
    uri,
    onDisable,
    style
}) {
    return (
        <View style={[styles.container, style]}>
            <ImageLoader
                isBackground={true}
                source={uri.full}
                defaultSource={uri.loadFull}
                disabled={true}
                style={styles.image}
            />
            <IconButton brand="Ionicons" icon="close-circle" size={34} color={colors.text1} style={styles.removeButton} onPress={() => onDisable()} />

        </View>
    );
}

const styles = StyleSheet.create({
    //region container
    container: {
        backgroundColor: colors.container,
        flex: 1,
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginHorizontal: 10,
        height: 300,
        marginVertical: 4,
        padding: 10,
        borderRadius: 30,
    },
    //endregion
    //region image
    image: {
        width: 200,
        height: 280,
        borderRadius: 20,
        overflow: 'hidden',
        alignItems: "flex-end",
    },
    //endregion
    //region removeButton
    removeButton: {
        margin: 4,
    },
    //endregion
    //region loading
    loading: {
        height: 280,
        width: "100%",
        alignItems: "center",
        justifyContent: "center"
    },
    //endregion
});