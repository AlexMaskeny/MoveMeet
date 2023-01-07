import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { CommonActions } from '@react-navigation/native';

import { colors, css } from '../config';
import SubTitle from './SubTitle';
import ProfileCircle from './ProfileCircle';
import IconButton from './IconButton';

export default function PrivateChat({
    profilePicture,
    last1,
    latest,
    title,
    user,
    openSettings,
    id,
    glow = false,
    userChatMembersID,
    created,
    onPress,
    navigation,

}) {
    const navigate = () => {
        onPress();
        user.profilePicture.loadFull = "LOADFULLprofilePicture" + user.id + ".jpg";
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
    return (<>
        <View style={[styles.container, glow ? styles.beam : {}]}>
            <TouchableOpacity style={styles.subContainer} onPress={navigate}>
                <ProfileCircle username={title} ppic={{
                    uri: profilePicture,
                    loadImage: profilePicture
                }} />
                <View style={styles.messageContainer}>
                    <View style={styles.topLine}>
                        <SubTitle style={styles.title} size={16}>{title}</SubTitle>
                        <View style={{width: 6}} />
                        <SubTitle style={styles.timeClock} size={12}>{latest}</SubTitle>
                    </View>
                    <SubTitle numberOfLines={1} style={styles.message} size={14}>
                        {last1.length > 0 ? (last1[0].type == "Text" ? last1[0].content.substring(0, 32) + (last1[0].content.length > 32 ? "..." : "") : "Sent an image") : "Start chatting with " + title}
                    </SubTitle>
                </View>
            </TouchableOpacity>
            <View style={styles.settings}>
                <IconButton icon="dots-vertical" brand="MaterialCommunityIcons" size={20} onPress={openSettings} />
            </View>
        </View>
    </>)
}

const styles = StyleSheet.create({
    container: {
        height: 70,
        padding: 10,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-start",
        backgroundColor: colors.container,
        marginHorizontal: 10,
        marginVertical: 6,
        borderRadius: 100,
        ...css.beamShadow,
        shadowColor: "rgba(0,0,0,0.5)"
    },
    subContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-start",
    },
    messageContainer: {
        margin: 10,
        padding: 1,
    },
    title: {
        fontWeight: "500",
    },
    message: {
        color: colors.text2
    },
    timeClock: {
        color: colors.text4,
    },
    topLine: {
        flexDirection: 'row',
        alignItems: "center",
    },
    beam: {
        shadowColor: colors.pBeam,
        borderColor: colors.pBeam,
        borderWidth: 2
    },
    settings: {
        flex: 1,
        alignItems: "flex-end",
        paddingRight: 10,
    }

});