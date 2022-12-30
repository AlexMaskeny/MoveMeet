import React, { useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';

import { colors, css } from '../config';
import BeamTitle from './BeamTitle';
import IconTitle from './IconTitle';
import PCircleAndTitle from './PCircleAndTitle';
import ChatButton from './ChatButton';
import { LinearGradient } from 'expo-linear-gradient';
import SimpleMessage from './SimpleMessage';
import ImageBackground from './ImageLoader'
import { CommonActions } from '@react-navigation/native';

//DESCRIPTION: A generalized chat box which will be embedded
//             inside of a flatlist on the ChatsPage
//UTILIZED:    Utilized on the ChatsPage


function Chat({
    background,
    members,
    latest,
    last3,
    user,
    glow = false,
    userChatMembersID,
    id,
    numMembers,
    distance,
    title,
    created,
    navigation,
    onPress,
    ...props
}) {
    const keyExtractor = React.useCallback((item) => item.user.id, [])
    const renderItem = React.useCallback(({ item }) => (
        <View style={styles.ppContain}>
            <PCircleAndTitle username={item.user.username} ppic={{
                uri: item.user.picture,
                loadImage: item.user.picture,
            }} />
        </View>
    ), [])
    const onEndReached = React.useCallback(() => {
        console.log("End!!!");
    }, [])
    const getChatsHeight = () => {
        if (last3.length == 3) return 156
        if (last3.length == 2) return 104
        if (last3.length == 1) return 104
        if (last3.length == 0) return 60
    }
    const getHeight = () => {
        return 340 - (156 - getChatsHeight());
    }
    const glowStyle = () => {
        if (glow) {
            return ({
                ...css.beamShadow,
                borderWidth: 2,
                borderColor: colors.pBeam
            })
        } else {
            return ({})
        }
    }
    const navigate = () => {
        onPress(); 
        navigation.dispatch(
            CommonActions.navigate({
                name: "ChatPage",
                key: id,
                params: {
                    name: title,
                    created: created,
                    userChatMembersID,
                    id: id,
                    user: user
                }
            })
        );
    }
    return (
        <View style={{
            ...styles.container,
            height: getHeight(),
            ...glowStyle()
        }}>
            <ImageBackground
                source={background}
                isBackground={true}
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
                        keyExtractor={keyExtractor}
                        horizontal={true} 
                        {...props}
                        onEndReached={onEndReached}
                        renderItem={renderItem}
                    />
                </View>
                <View style={styles.details}>
                    <IconTitle
                        brand="Ionicons"
                        icon="chatbubble-ellipses"
                        style={{ fontSize: 14 }}
                    >{latest}</IconTitle>
                    <IconTitle
                        brand="MaterialCommunityIcons"
                        icon="account"
                        style={{ fontSize: 14 }}
                    >{numMembers > 1 ? numMembers : ""} {numMembers == 1 ? "It's Just You" : "Members"}</IconTitle>
                    <IconTitle
                        brand="MaterialCommunityIcons"
                        icon="google-maps"
                        style={{fontSize: 14}}
                    >{distance}</IconTitle>
                </View>
                <View style={{
                    ...styles.chat,
                    height: getChatsHeight()
                }}>
                    <View style={styles.chatSub}>
                        {last3.length >= 1 &&
                            <>
                            <SimpleMessage ppic={{
                                uri: last3[0].picture,
                                loadImage: last3[0].picture,
                                key: "chatPreviewPPic" + last3[0].id,
                            }} username="Alexander" message={last3[0].content} />
                                <View style={{height: 4} } />
                            </>
                        }
                        {last3.length >= 2 &&
                            <>
                            <SimpleMessage ppic={{
                                uri: last3[1].picture,
                                loadImage: last3[1].picture,
                                key: "chatPreviewPPic" + last3[1].id,
                            }} username="Alexander" message={last3[1].content} />
                                <View style={{ height: 4 }} />
                            </>
                        }
                        {last3.length >= 3 &&
                            <>
                            <SimpleMessage ppic={{
                                uri: last3[2].picture,
                                loadImage: last3[2].picture,
                                key: "chatPreviewPPic" + last3[2].id,
                            }} username="Alexander" message={last3[2].content} />
                                <View style={{ height: 4 }} />
                            </>
                        }
                    </View>
                    {last3.length > 0 &&
                        <LinearGradient
                            // Background Linear Gradient
                            colors={['rgba(18, 18, 18,0.4)', colors.background]}
                            style={{ flex: 1, marginTop: -156 } }
                        />
                    }
                </View>
                <ChatButton
                    title="Open Chat"
                    style={{
                        marginTop: -60,
                        alignSelf: "center",
                    }}
                    onPress={()=>navigate()}
                    
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