import React from 'react';
import { View, StyleSheet, FlatList, ImageBackground, TouchableOpacity } from 'react-native';
import { CommonActions } from '@react-navigation/native';

import { dark_colors, css } from '../config';
import BeamTitle from './BeamTitle';
import IconTitle from './IconTitle';
import PCircleAndTitle from './PCircleAndTitle';
import ChatButton from './ChatButton';
import { LinearGradient } from 'expo-linear-gradient';
import SimpleMessage from './SimpleMessage';
import ImageLoader from './ImageLoader'

//DESCRIPTION: A generalized chat box which will be embedded
//             inside of a flatlist on the ChatsPage
//UTILIZED:    Utilized on the ChatsPage


function Chat({
    background,
    members,
    latest,
    last3,
    user,
    disabled = false,
    glow = false,
    id,
    userChatMembersID,
    numMembers,
    distance,
    title,
    created,
    navigation,
    onPress,
    ...props
}) {
    const navigate = () => {
        if (disabled) return;
        onPress(); 
        navigation.dispatch(
            CommonActions.navigate({
                name: "ChatPage",
                key: id,
                params: {
                    name: title,
                    created: created,
                    id: id,
                    userChatMembersID,
                    user,
                }
            })
        );
    }
    const onClickMember = (memberID) => {
        navigation.dispatch(CommonActions.navigate({
            name: "OProfilePage",
            key: memberID,
            params: {
                opposingUser: { id: memberID },
            }
        }))
    }

    const onEndReached = React.useCallback(() => {
        
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
                borderColor: dark_colors.pBeam
            })
        } else {
            return ({})
        }
    }

    const keyExtractor = React.useCallback((item) => item.user.id, [])
    const renderItem = React.useCallback(({ item }) => (
        <TouchableOpacity style={styles.ppContain} onPress={()=>onClickMember(item.user.id)}>
            <PCircleAndTitle username={item.user.username} ppic={item.user.picture} />
        </TouchableOpacity>
    ), [])
    return (
        <View style={{
            ...styles.container,
            height: getHeight(),
            ...glowStyle()
        }}>
            {(!background.isColor) &&
                <ImageLoader
                    source={background.uri.full}
                    defaultSource={background.uri.loadFull}
                    disabled={disabled}
                    cacheKey={background.uri.fullKey}
                    isBackground={true}
                    imageStyle={styles.image}
                    style={styles.imageBackground}
                    resizeMode="cover"
                >
                    <BeamTitle style={styles.title}>{title}</BeamTitle>
                </ImageLoader>
            }
            {(background.isColor) &&
                <View style={[styles.imageBackground, {backgroundColor: background.color}]}>
                    <BeamTitle style={styles.title}>{title}</BeamTitle>
                </View>
            }
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
                            <SimpleMessage ppic={last3[0].picture} username="Alexander" message={last3[0].content} />
                                <View style={{height: 4} } />
                            </>
                        }
                        {last3.length >= 2 &&
                            <>
                            <SimpleMessage ppic={last3[1].picture} username="Alexander" message={last3[1].content} />
                                <View style={{ height: 4 }} />
                            </>
                        }
                        {last3.length >= 3 &&
                            <>
                            <SimpleMessage ppic={last3[2].picture} username="Alexander" message={last3[2].content} />
                                <View style={{ height: 4 }} />
                            </>
                        }
                    </View>
                    {last3.length > 0 &&
                        <LinearGradient
                            // Background Linear Gradient
                            colors={[dark_colors.transContainer+"0.4)", dark_colors.background]}
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
        backgroundColor: dark_colors.passiveImg,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 2,
        shadowOpacity: 0.3,
        marginHorizontal: 3,
        marginVertical: 8,
    },
    sub1: {
        flex: 1,
        backgroundColor: dark_colors.container,
        borderBottomEndRadius: 18,
        borderBottomStartRadius: 18,
        borderTopColor: dark_colors.pBeam,
        borderTopWidth: 2,
        
    },
    imageBackground: {
        height: 90,
        alignItems: "center",
        justifyContent: "center",
        borderTopEndRadius: 18,
        overflow: 'hidden',
        borderTopStartRadius: 18,
    },
    image: {
        height: 90,
        opacity: 0.7,
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
        textShadowColor: "black",
        textShadowRadius: 1,
        shadowRadius: 2,
        color: dark_colors.pBeamBright,
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
        backgroundColor: dark_colors.background,
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