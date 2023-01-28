import React from 'react';
import { StyleSheet, Image, View, TouchableOpacity } from 'react-native';

import { colors } from '../config';
import ProfileCircle from './ProfileCircle';
import SubTitle from './SubTitle';
import ImageLoader from './ImageLoader';

function ImageMessage({ children, ppic, username, source, style, time, onPress,...props }) {
    return (
        <View style={styles.container}>
            <ProfileCircle ppic={ppic} style={styles.pCircle} />
            <View style={{ width: 6 }} />
            <View style={{ flex: 1, marginRight: 10 }}>
                <View style={{ flexDirection: 'row', flex: 1, justifyContent: "space-between" }}>
                    <SubTitle size={16} color={colors.text4}>{username}</SubTitle>
                    <SubTitle size={14} color={colors.text4}>{time}</SubTitle>
                </View>
                <View style={{height: 4}} />
                <TouchableOpacity onPress={onPress}> 
                {!source.local &&
                    <ImageLoader style={styles.image} source={source} />
                }
                {source.local &&
                        <Image style={styles.image} source={{uri: source.uri}} />
                }
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: "flex-start",
        flexDirection: "row",
        borderRadius: 30,

    },
    tStyle: {
        color: colors.text3,
        fontSize: 16,
        flex: 2,

    },
    pCircle: {
        width: 44,
        height: 44,
        borderWidth: 1,
        shadowOpacity: 0,
        borderColor: colors.text3
    }, 
    image: {
        width: 200,
        height: 280,
        borderRadius: 30,
        overflow: 'hidden',
        alignItems: "flex-end",
    }
})

export default ImageMessage;