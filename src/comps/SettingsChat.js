import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, View, TouchableOpacity, Alert } from 'react-native';
import { Storage } from 'aws-amplify';
import { CommonActions } from '@react-navigation/native';

import SimpleButton from './SimpleButton';
import Loading from './Loading';
import ProfileCircle from './ProfileCircle';
import { colors, css } from '../config';
import IconButton from './IconButton';
import SubTitle from './SubTitle';
import * as logger from '../functions/logger';
import { calls, mmAPI } from '../api/mmAPI';

export default function SettingsChat({ item, onClose, visible, navigate, currentUser, navigation }) {
    const [ready, setReady] = useState(false);
    const [profilePicture, setProfilePicture] = useState({});
    useEffect(() => {
        if (visible) {
            const initialFunction = async () => {
                await setProfilePicture(item.profilePicture.uri);
                setReady(true);
            }
            initialFunction();

        }
    }, [visible]);
    const clearChat = async () => {
        if (item.friend.status == "0") await updateStatus("1");
        if (item.friend.status == "2") await updateStatus("3");
        close();
    }
    const block = () => {
        Alert.alert("Are you sure?", "Blocking this user will block them from private messaging you.", [
            {text: "Cancel"},
            {
                text: "Confirm", onPress: () => {
                    const Close = async () => {
                        try {
                            await updateStatus("666");
                            const result = await mmAPI.query({
                                call: calls.GET_CHAT_MEMBERS_BY_IDS,
                                instance: "loadingPage",
                                input: {
                                    userID: currentUser.id
                                }
                            })

                            const memberIndex = result.items.findIndex((el) => el.chatID == item.friend.chatID);

                            await mmAPI.mutate({
                                call: calls.DELETE_CHAT_MEMBERS,
                                instance: "background",
                                input: {
                                    id: result.items[memberIndex].id
                                }
                            });
                            close();
                        } catch (error) {
                            logger.warn(error);
                        }
                    }
                    Close();
                }
            }
        ])

    }
    const updateStatus = async (statusCode) => {
        try {
            const userFriendsResponse = await mmAPI.query({
                call: calls.GET_USER,
                instance: "friends",
                input: {
                    id: currentUser.id
                }
            })
            if (userFriendsResponse) {
                var userFriends = userFriendsResponse.friends;
                const friendIndex = userFriends.findIndex((el) => el.friendID == item.friend.friendID);
                userFriends[friendIndex].status = statusCode;
                await mmAPI.mutate({
                    call: calls.UPDATE_USER,
                    input: {
                        id: currentUser.id,
                        friends: userFriends
                    }
                });
                const userMessagesResult = await mmAPI.query({
                    call: calls.LIST_MESSAGES_BY_TIME,
                    instance: "settingsChat",
                    input: {
                        chatMessagesId: userFriends[friendIndex].chatID,
                        limit: 1
                    }
                });

                var newRead = userMessagesResult.items[0].read;
                if (!newRead.includes(currentUser.id)) {
                    newRead.push(currentUser.id);
                    await mmAPI.mutate({
                        calls: calls.UPDATE_MESSAGE,
                        input: {
                            id: userMessagesResult.items[0].id,
                            read: newRead
                        }
                    })
                }
            }
        } catch (error) {
            logger.warn(error);
        }
    }
    const viewProfile = () => {
        navigation.dispatch(CommonActions.navigate({
            name: "OProfilePage",
            key: item.friend.friendID,
            params: {
                opposingUser: { id: item.friend.friendID }
            }
        }))
        close();
    }
    const close = () => {
        setReady(false);
        onClose();
    }
    const message = () => {
        navigate();
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
                    private: true,
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
                        }} onPress={message} />
                        <SubTitle color={colors.text2} style={styles.titlePrimary} size={20}>{item.opposingMember.user.username}</SubTitle>
                        <IconButton color={colors.text1} icon="ios-close-circle" brand="Ionicons" size={32} onPress={close} />
                    </View>
                    <View style={styles.body}>
                        <View style={styles.container1}>
                            <ProfileCircle ppic={profilePicture} style={styles.profilePicture} innerStyle={styles.innerStyle}/>
                            <View style={styles.container1sub}>
                                <View style={styles.username}>
                                    <SubTitle style={styles.title} size={22}>{item.opposingMember.user.username}</SubTitle>
                                    <TouchableOpacity style={{ marginLeft: 10 }} onPress={viewProfile }>
                                        <SubTitle style={styles.subTitlePrimary} size={16}>View</SubTitle>
                                    </TouchableOpacity>
                                </View>
                                <SubTitle style={styles.subTitle} color={colors.text2} size={16}>You last spoke {item.latest}</SubTitle>
                                <SubTitle style={styles.subTitle} color={colors.text2} size={16}>You first spoke on {(new Date(Date.parse(item.createdAt))).toLocaleDateString()}</SubTitle>
                            </View>
                        </View>
                        <View style={styles.container2}>
                            <SimpleButton title="Clear Chat" onPress={clearChat} outerStyle={styles.clearChat} />
                            <SimpleButton title="Block User" onPress={block} outerStyle={styles.block}/>
                        </View>
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
        paddingBottom: 10,
        alignItems: "center"

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
    titlePrimary: {
        fontWeight: "500",
        colors: colors.pBeamBright
    },
    clearChat: {
        backgroundColor: colors.container
    },
    block: {
        backgroundColor: colors.errorTransparent,
        borderColor: colors.error,
        shadowColor: colors.error,
    },
    username: {
        flexDirection: "row",
        alignItems: "center"
    },
    subTitlePrimary: {
        color: colors.pBeamBright
    }
});