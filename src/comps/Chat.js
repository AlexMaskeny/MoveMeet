import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';

import { colors, css } from '../config';
import BeamTitle from './BeamTitle';
import IconTitle from './IconTitle';
import PCircleAndTitle from './PCircleAndTitle';
import ChatButton from './ChatButton';
import { LinearGradient } from 'expo-linear-gradient';
import SimpleMessage from './SimpleMessage';
import ImageBackground from './ImageBackgroundLoader'

//DESCRIPTION: A generalized chat box which will be embedded
//             inside of a flatlist on the ChatsPage
//UTILIZED:    Utilized on the ChatsPage


function Chat({
    background,
    members,
    title,
    created,
    navigation,
    ...props
}) {
    return (
        <View style={styles.container}>
            <ImageBackground
                source={{ uri: background.uri }}
                loadImage={{uri: background.loadImage}}
                imageStyle={styles.image}
                style={styles.imageBackground}
                resizeMode="cover"
            >
                <BeamTitle style={styles.title}>{title}</BeamTitle>
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
                                <PCircleAndTitle username={item.username} ppic={item.ppic}/>  
                            </View>
                        )}
                    />
                </View>
                <View style={styles.details}>
                    <IconTitle
                        brand="MaterialCommunityIcons"
                        icon="google-maps"
                        style={{fontSize: 14}}
                    >0.1 miles</IconTitle>
                    <IconTitle
                        brand="MaterialCommunityIcons"
                        icon="account"
                        style={{ fontSize: 14 }}
                    >13 Members</IconTitle>
                    <IconTitle
                        brand="Ionicons"
                        icon="chatbubble-ellipses"
                        style={{ fontSize: 14 }}
                    >3m ago</IconTitle>
                </View>
                <View style={styles.chat}>
                    <View style={styles.chatSub}>
                        <SimpleMessage ppic={background} username="Alexander" message="bro i like trains sooooooooooooooooooooooo much I" />
                        <View style={{height: 4} } />
                        <SimpleMessage ppic={background} username="Alexander" message="bro i like trains sooooooooooooooooooooooo much I" />
                        <View style={{ height: 4 }} />
                        <SimpleMessage ppic={background} username="Alexander" message="bro i like trains sooooooooooooooooooooooo much I" />
                    </View>
                    <LinearGradient
                        // Background Linear Gradient
                        colors={['rgba(18, 18, 18,0.4)', colors.background]}
                        style={{ flex: 1, marginTop: -156 } }
                    />
                </View>
                <ChatButton
                    title="Open Chat"
                    style={{
                        marginTop: -60,
                        alignSelf: "center",
                    }}
                    onPress={() => navigation.navigate("ChatPage", { name: title, created: created })}
                    
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        maxWidth: "100%",
        height: 340,
        borderRadius: 20,
        backgroundColor: colors.passiveImg,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 3,
        shadowOpacity: 0.3,
        marginHorizontal: 3,
        marginVertical: 8,
        //...css.beamShadow,
        //borderColor: colors.pBeam,
        //borderWidth: 1,
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
    chat: {
        backgroundColor: colors.background,
        margin: 10,
        marginTop: 14,
        height: 156,
        borderRadius: 18,
        overflow: "hidden",
    },
    chatSub: {
        height: 156,
        padding: 8,
    }
});

export default Chat;