import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { Storage } from 'aws-amplify';
import { CommonActions } from '@react-navigation/native';

import Screen from './Screen';
import SimpleButton from './SimpleButton';
import Loading from './Loading';
import ProfileCircle from './ProfileCircle';
import { colors, css } from '../config';
import BeamTitle from './BeamTitle';
import IconButton from './IconButton';
import SubTitle from './SubTitle';

export default function SettingsChat({ item, onClose, visible, navigate, currentUser, navigation }) {
    const [ready, setReady] = useState(false);
    const [profilePicture, setProfilePicture] = useState({
        uri: item.profilePicture,
        loadImage: item.profilePicture,
    });
    useEffect(() => {
        if (visible) {
            const initialFunction = async () => {
                const full = await Storage.get(item.opposingMember.user.profilePicture.full);
                setProfilePicture({
                    uri: full,
                    loadImage: item.profilePicture,
                })
                setReady(true);
            }
            initialFunction();
        }
    }, [visible]);
    const removeChat = async () => {

    }
    const block = async () => {

    }
    const close = () => {
        setReady(false);
        onClose();
    }
    const message = () => {
        navigate();
        currentUser.profilePicture.loadFull = "LOADFULLprofilePicture" + currentUser.id + ".jpg";
        navigation.dispatch(
            CommonActions.navigate({
                name: "ChatPage",
                key: item.id,
                params: {
                    name: item.opposingMember.user.username,
                    created: item.createdAt,
                    id: item.id,
                    userChatMembersID: item.userChatMembersID,
                    user: currentUser,
                }
            })
        );
        close();
    }
    return (
        <Modal visible={visible} animationType="slide">
            <View style={styles.page}>
                {ready && <>                
                    <View style={styles.header}>
                        <IconButton color={colors.pBeamBright} icon="md-chatbubble-ellipses" brand="Ionicons" size={32} style={{
                            ...css.beamShadow,
                            shadowColor: colors.pBeam,
                        }} onPress={message}/>
                        <IconButton color={colors.text1} icon="ios-close-circle" brand="Ionicons" size={32} onPress={close} />
                    </View>
                    <View style={styles.body}>
                        <View style={styles.container1}>
                            <ProfileCircle ppic={profilePicture} style={styles.profilePicture} innerStyle={styles.innerStyle}/>
                            <View style={styles.container1sub}>
                                <SubTitle style={styles.title} size={22}>{item.opposingMember.user.username}</SubTitle>
                                <SubTitle style={styles.subTitle} color={colors.text2} size={16}>You last spoke {item.latest}</SubTitle>
                                <SubTitle style={styles.subTitle} color={colors.text2} size={16}>You first spoke on {item.createdAt}</SubTitle>
                            </View>
                        </View>
                        {/*<View style={styles.container2}>*/}
                        {/*    <SimpleButton title="Remove Chat" onPress={removeChat} outerStyle={styles.removeChat} />*/}
                        {/*    <SimpleButton title="Block User" onPress={block} outerStyle={styles.block}/>*/}
                        {/*</View>*/}
                    </View>
                </>}

                <Loading enabled={!ready} />
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    page: {
        alignItems: "center",
        flex: 1,
        backgroundColor: colors.background,
    },
    profilePicture: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 3,
    },
    innerStyle: {
        borderRadius: 40
    },
    header: {
        backgroundColor: colors.container,
        width: "100%",
        justifyContent: "space-between",
        flexDirection: "row",
        paddingHorizontal: 14,
        paddingTop: 50,
        paddingBottom: 10

    },
    body: {
        padding: 10,
        flex: 1,
        width: "100%",
    },
    container1: {
        backgroundColor: colors.container,
        borderRadius: 30,
        padding: 10,
        margin: 8,
        marginHorizontal: 4,
        flexDirection: "row",
    },
    container1sub: {
        marginLeft: 14,
        justifyContent: "center",
    },
    container2: {
        backgroundColor: colors.container,
        borderRadius: 30,
        padding: 10,
        margin: 8,
        marginHorizontal: 4,
    },
    title: {
        fontWeight: "500",
    },
    removeChat: {
        backgroundColor: colors.container
    },
    block: {
        backgroundColor: colors.errorTransparent,
        borderColor: colors.error,
        shadowColor: colors.error,
    }
});