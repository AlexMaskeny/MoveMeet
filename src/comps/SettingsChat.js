import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, View, TouchableOpacity, Alert } from 'react-native';
import { API, graphqlOperation, Storage } from 'aws-amplify';
import { CommonActions } from '@react-navigation/native';

import SimpleButton from './SimpleButton';
import Loading from './Loading';
import ProfileCircle from './ProfileCircle';
import { colors, css } from '../config';
import IconButton from './IconButton';
import SubTitle from './SubTitle';
import * as logger from '../functions/logger';
import { deleteChatMembers,  getChatMembersByIds, getUserFriends, listMessagesByTime, updateMessage, updateUser } from '../api/calls';

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
                            const result = await API.graphql(graphqlOperation(getChatMembersByIds, {
                                userID: currentUser.id
                            }));
                            const memberIndex = result.data.getChatMembersByIds.items.findIndex((el) => el.chatID == item.friend.chatID);
                            await API.graphql(graphqlOperation(deleteChatMembers, {
                                input: {
                                    id: result.data.getChatMembersByIds.items[memberIndex].id
                                }
                            }))
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
            const userFriendsResponse = await API.graphql(graphqlOperation(getUserFriends, {
                UserID: currentUser.id,
            }));
            if (userFriendsResponse) {
                var userFriends = userFriendsResponse.data.getUser.friends;
                const friendIndex = userFriends.findIndex((el) => el.friendID == item.friend.friendID);
                userFriends[friendIndex].status = statusCode;
                await API.graphql(graphqlOperation(updateUser, {
                    input: {
                        id: currentUser.id,
                        friends: userFriends
                    }
                }));

                const userMessagesResult = await API.graphql(graphqlOperation(listMessagesByTime, {
                    chatMessagesId: userFriends[friendIndex].chatID,
                    limit: 1
                }));
                var newRead = userMessagesResult.data.listMessagesByTime.items[0].read;
                if (!newRead.includes(currentUser.id)) {
                    newRead.push(currentUser.id);
                    await API.graphql(graphqlOperation(updateMessage, {
                        input: {
                            id: userMessagesResult.data.listMessagesByTime.items[0].id,
                            read: newRead
                        }
                    }))
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