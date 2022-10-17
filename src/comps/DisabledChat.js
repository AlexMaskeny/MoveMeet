import React from 'react';
import { Text, View, StyleSheet, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, css } from '../config';
import DarkBeam from './DarkBeam';
import BeamTitle from './BeamTitle';
import IconTitle from './IconTitle';
import PCircleAndTitle from './PCircleAndTitle';
import ChatButton from './ChatButton';
import ImageBackground from './ImageLoader'

//DESCRIPTION: A generalized chat box which will be embedded
//             inside of a flatlist on the ChatsPage
//UTILIZED:    Utilized on the ChatsPage


function DisabledChat({
    background,
    members,
    title,
    ...props
}) {
    return (
        <>
        <View style={styles.container}>
            <ImageBackground
                source={background}
                isBackground={true}
                imageStyle={styles.image}
                style={styles.imageBackground}
                resizeMode="cover"
            >
                    <BeamTitle style={{ ...styles.title, color: colors.text2 }}>{title}</BeamTitle>
            </ImageBackground>
            <View style={styles.sub1}>
                <View style={styles.listContain}>
                    <FlatList
                        data={members}
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={item => item.id}
                        horizontal={true}
                        {...props}
                        renderItem={({ item }) => (
                            <View style={styles.ppContain}>
                                <PCircleAndTitle username={item.username} ppic={item.ppic} />
                            </View>
                        )}
                    />
                </View>
                <View style={styles.details}>
                    <IconTitle
                        brand="MaterialCommunityIcons"
                        icon="google-maps"
                        style={{ fontSize: 14 }}
                    >2 miles</IconTitle>
                    <IconTitle
                        brand="MaterialCommunityIcons"
                        icon="account"
                        style={{ fontSize: 14 }}
                    >2 Members</IconTitle>
                    <IconTitle
                        brand="Ionicons"
                        icon="chatbubble-ellipses"
                        style={{ fontSize: 14 }}
                    >24h ago</IconTitle>
                </View>
            </View>
            </View>
            <View style={{ ...styles.container, shadowOpacity: 0, backgroundColor: "transparent", overflow: "hidden", marginTop: -188 }}>
                <LinearGradient
                    // Background Linear Gradient
                    colors={['rgba(18, 18, 18,0.7)', 'rgba(18, 18, 18,0.95)', 'rgba(18, 18, 18,0.6)']}
                    style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
                >
                    <BeamTitle style={{ ...styles.title, ...css.beamShadow }}>Out of Range</BeamTitle>
                </LinearGradient>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        maxWidth: "100%",
        height: 180,
        borderRadius: 20,
        backgroundColor: colors.passiveImg,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 3,
        shadowOpacity: 0.3,
        marginHorizontal: 3,
        marginVertical: 8,
        borderColor: colors.container,
        borderWidth: 2

    },
    sub1: {
        flex: 1,
        backgroundColor: colors.container,
        borderBottomEndRadius: 18,
        borderBottomStartRadius: 18,
        borderTopColor: colors.pBeam,
        borderTopWidth: 2,

    },
    imageBackground: {
        height: 90,
        alignItems: "center",
        justifyContent: "center",
        borderTopEndRadius: 18,
        borderTopStartRadius: 18,
    },
    image: {
        height: 90,
        opacity: 0.5,
        alignItems: "center",
        justifyContent: "center",
        borderTopEndRadius: 18,
        borderTopStartRadius: 18,
    },
    ppContain: {
        margin: 4
    },
    listContain: {
        marginTop: -30,
    },
    title: {
        shadowRadius: 3,
        color: colors.pBeamBright,
        shadowColor: "black"

    },
    details: {
        paddingTop: 4,
        paddingHorizontal: 10,
        paddingRight: 20,
        justifyContent: "space-between",
        flexDirection: "row",
        width: "100%",

    },
});

export default DisabledChat;