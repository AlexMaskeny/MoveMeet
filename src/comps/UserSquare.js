import React from 'react';
import { View, StyleSheet, Text, TouchableHighlight } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CommonActions } from '@react-navigation/native';

import ImageLoader from './ImageLoader';
import { colors, css } from '../config';
import SubTitle from './SubTitle';

const borderRadius = 16;
export default function UserSquare({
    user,
    navigation
}) {
    const navigate = () => {
        navigation.dispatch(CommonActions.navigate({
            name: "OProfilePage",
            key: user.id,
            params: {
                opposingUser: {id: user.id}
            }
        }))
    }
    if (user.noImage) return (
        <TouchableHighlight style={styles.touchable} onPress={navigate} underlayColor={colors.dark} activeOpacity={0.5}>
            <View style={[styles.container, {backgroundColor: colors.container}]}>
                <View style={styles.subContainer}>
                    <LinearGradient
                        // Background Linear Gradient
                        colors={['rgba(0,0,0,0.8)', 'transparent']}
                        style={{ height: 24, width: "100%", borderTopRightRadius: borderRadius, borderTopLeftRadius: borderRadius }}
                    >
                    </LinearGradient>
                    <LinearGradient
                        // Background Linear Gradient
                        colors={['transparent', 'rgba(0,0,0,0.9)']}
                        style={{ height: 80, width: "100%", borderBottomRightRadius: borderRadius, borderBottomLeftRadius: borderRadius }}
                    >
                        <View style={styles.footer}>
                            <SubTitle style={styles.title} color={colors.text6} size={18}>{user.username}</SubTitle>
                            <SubTitle style={styles.title} color={colors.text1} size={14}>{user.distance}</SubTitle>
                            <SubTitle style={styles.title} color={colors.text1} size={14} numberOfLines={1}>{user.bio}</SubTitle>
                        </View>
                    </LinearGradient>
                </View>
            </View>
        </TouchableHighlight>
    )
    else return (
        <TouchableHighlight style={styles.touchable} onPress={navigate} underlayColor={colors.dark} activeOpacity={0.5}>
            <ImageLoader style={styles.container} imageStyle={styles.image} isBackground={true} source={{
                uri: user.profilePicture.full,
                loadImage: user.profilePicture.loadFull
            }}>
                <View style={styles.subContainer}>
                    <LinearGradient
                        // Background Linear Gradient
                        colors={['rgba(0,0,0,0.8)', 'transparent']}
                        style={{ height: 24, width: "100%", borderTopRightRadius: borderRadius, borderTopLeftRadius: borderRadius }}
                    >
                    </LinearGradient>
                    <LinearGradient
                        // Background Linear Gradient
                        colors={['transparent', 'rgba(0,0,0,0.9)']}
                        style={{ height: 80, width: "100%", borderBottomRightRadius: borderRadius, borderBottomLeftRadius: borderRadius}}
                    >
                        <View style={styles.footer}>
                            <SubTitle style={styles.title} color={colors.text6} size={18}>{user.username}</SubTitle>
                            <SubTitle style={styles.title} color={colors.text1} size={14}>{user.distance}</SubTitle>
                            <SubTitle style={styles.title2} color={colors.text1} size={14} numberOfLines={1}>{user.bio}</SubTitle>
                        </View>
                    </LinearGradient>
                </View>
            </ImageLoader>
        </TouchableHighlight>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 260,
        margin: 6,
        borderRadius: borderRadius,
        flex: 1,
        ...css.beamShadow,
        shadowColor: "black",
        borderWidth: 1,
        borderColor: colors.text4,
    }, 
    touchable: {
        flex: 1,
        borderRadius: borderRadius
    },
    image: {
        borderRadius: borderRadius,
        borderWidth: 2,
        height: 256
    },
    subContainer: {
        flex: 1,
        justifyContent: 'space-between'
    },
    title: {
        fontWeight: "bold",
        ...css.beamShadow,
        shadowColor: "black",
        shadowRadius: 2,
        alignSelf: "flex-start"
    },
    title2: {
        fontWeight: "500",
        ...css.beamShadow,
        shadowColor: "black",
        shadowRadius: 2,
        alignSelf: "flex-start"
    },
    footer: {
        alignSelf: "center",
        flex: 1,
        width: "100%",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        marginTop: 10,
        paddingHorizontal: 6,
    }
});