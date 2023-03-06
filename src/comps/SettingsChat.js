//region 3rd Party Imports
import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, View, TouchableOpacity, Alert } from 'react-native';
import { CommonActions } from '@react-navigation/native';
//endregion
//region 1st Party Imports
import SimpleButton from './SimpleButton';
import Loading from './Loading';
import ProfileCircle from './ProfileCircle';
import IconButton from './IconButton';
import SubTitle from './SubTitle';
import { dark_colors, css } from '../config';
import { calls, mmAPI } from '../api/mmAPI';
import * as logger from '../functions/logger';
//endregion

export default function SettingsChat({ item, onClose, visible, navigate, currentUser, navigation }) {
    /* =============[ VARS ]============ */
    const [ready, setReady] = useState(false);
    const [profilePicture, setProfilePicture] = useState({});

    /* =============[ HOOKS ]============ */
    //region [HOOK] "useEffect, [visible]" = Gets the opposing user's profile picture when the currentUser opens the modal
    useEffect(() => {
        if (visible) {
            (async function() {
                await setProfilePicture(item.profilePicture.uri);
                setReady(true);
            })();
        }
    }, [visible]);
    //endregion

    /* =============[ FUNCS ]============ */
    //region [FUNC ASYNC] "clearChat = async ()" = Removes the opposing user from the current user's PrivateChatsPage (And closes the modal)
    const clearChat = async () => {
        if (item.friend.status === "0") await updateStatus("1");
        else if (item.friend.status === "2") await updateStatus("3");
        close();
    }
    //endregion
    //region [FUNC ASYNC] "updateStatus = async (statusCode)" = Updates the status of currentUser's friendship with opposingUser (from currentUser's perspective)
    const updateStatus = async (statusCode) => {
        try {
            //region Get the currentUser's friends
            let currentUserFriends = await mmAPI.query({
                call: calls.GET_USER,
                instance: "friends",
                input: {
                    id: currentUser.id
                }
            });
            //endregion

            if (currentUserFriends?.friends) {
                //region Update the friendship between opposing user & current user to statusCode (from current user's perspective);
                const friendIndex = currentUserFriends.friends.findIndex((el) => el.friendID === item.friend.friendID);
                currentUserFriends.friends[friendIndex].status = statusCode;
                await mmAPI.mutate({
                    call: calls.UPDATE_USER,
                    input: {
                        id: currentUser.id,
                        friends: currentUserFriends.friends
                    }
                });
                //endregion
                //region Make the currentUser read the latest message in the chat with opposingUser
                const userMessagesResult = await mmAPI.query({
                    call: calls.LIST_MESSAGES_BY_TIME,
                    instance: "settingsChat",
                    input: {
                        chatMessagesId: currentUserFriends.friends[friendIndex].chatID,
                        limit: 1
                    }
                });
                let newRead = userMessagesResult.items[0].read;
                if (!newRead.includes(currentUser.id)) {
                    newRead.push(currentUser.id);
                    await mmAPI.mutate({
                        call: calls.UPDATE_MESSAGE,
                        input: {
                            id: userMessagesResult.items[0].id,
                            read: newRead
                        }
                    });
                }
                //endregion
            }
        } catch (error) {
            logger.warn(error);
        }
    }
    //endregion
    //region [FUNCTION]   "block = ()" = currentUser blocks the opposingUser
    const block = () => {
        Alert.alert("Are you sure?", "Blocking this user will block them from private messaging you.", [
            {text: "Cancel"},
            {
                text: "Confirm", onPress: () => {
                    (async function() {
                        try {
                            //Change the currentUser's friendship with opposing user to status 666 (AKA blocked)
                            await updateStatus("666");

                            //region delete the currentUser's chat membership to the chat with opposingUser
                            const result = await mmAPI.query({
                                call: calls.GET_CHAT_MEMBERS_BY_IDS,
                                instance: "loadingPage",
                                input: {
                                    userID: currentUser.id
                                }
                            });
                            const memberIndex = result.items.findIndex((el) => el.chatID === item.friend.chatID);
                            await mmAPI.mutate({
                                call: calls.DELETE_CHAT_MEMBERS,
                                instance: "background",
                                input: {
                                    id: result.items[memberIndex].id
                                }
                            });
                            //endregion

                            close();
                        } catch (error) {
                            logger.warn(error);
                        }

                    })();
                }
            }
        ])
    }
    //endregion
    //region [FUNCTION]   "viewProfile = ()" = Navigate to the OProfilePage of the opposingUser
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
    //endregion
    //region [FUNCTION]   "message = ()" = Message the opposingUser
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
    //endregion
    //region [FUNCTION]   "close = ()" = Close the modal
    const close = () => {
        setReady(false);
        onClose();
    }
    //endregion

    return (
        <Modal visible={visible} animationType="slide">
            <View style={styles.page}>
                {ready && <>                
                    <View style={styles.header}>
                        <IconButton color={dark_colors.pBeamBright} icon="md-chatbubble-ellipses" brand="Ionicons" size={32} style={{
                            ...css.beamShadow,
                            shadowColor: dark_colors.pBeam,
                        }} onPress={message} />
                        <SubTitle color={dark_colors.text2} style={styles.titlePrimary} size={20}>{item.opposingMember.user.username}</SubTitle>
                        <IconButton color={dark_colors.text1} icon="ios-close-circle" brand="Ionicons" size={32} onPress={close} />
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
                                <SubTitle style={styles.subTitle} color={dark_colors.text2} size={16}>You last spoke {item.latest}</SubTitle>
                                <SubTitle style={styles.subTitle} color={dark_colors.text2} size={16}>You first spoke on {(new Date(Date.parse(item.createdAt))).toLocaleDateString()}</SubTitle>
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
    //region page
    page: {
        alignItems: "center",
        flex: 1,
        backgroundColor: dark_colors.background,
    },
    //endregion
    //region profilePicture
    profilePicture: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 3,
    },
    //endregion
    //region innerStyle
    innerStyle: {
        borderRadius: 40
    },
    //endregion
    //region header
    header: {
        backgroundColor: dark_colors.container,
        width: "100%",
        justifyContent: "space-between",
        flexDirection: "row",
        paddingHorizontal: 14,
        paddingTop: 50,
        paddingBottom: 10,
        alignItems: "center"
    },
    //endregion
    //region body
    body: {
        padding: 10,
        flex: 1,
        width: "100%",
    },
    //endregion
    //region container1
    container1: {
        backgroundColor: dark_colors.container,
        borderRadius: 30,
        padding: 10,
        margin: 8,
        marginHorizontal: 4,
        flexDirection: "row",
    },
    //endregion
    //region container1sub
    container1sub: {
        marginLeft: 14,
        justifyContent: "center",
    },
    //endregion
    //region container2
    container2: {
        backgroundColor: dark_colors.container,
        borderRadius: 30,
        padding: 10,
        margin: 8,
        marginHorizontal: 4,
    },
    //endregion
    //region title
    title: {
        fontWeight: "500",
    },
    //endregion
    //region titlePrimary
    titlePrimary: {
        fontWeight: "500",
        colors: dark_colors.pBeamBright
    },
    //endregion
    //region clearChat
    clearChat: {
        backgroundColor: dark_colors.container
    },
    //endregion
    //region block
    block: {
        backgroundColor: dark_colors.errorTransparent,
        borderColor: dark_colors.error,
        shadowColor: dark_colors.error,
    },
    //endregion
    //region username
    username: {
        flexDirection: "row",
        alignItems: "center"
    },
    //endregion
    //region subTitlePrimary
    subTitlePrimary: {
        color: dark_colors.pBeamBright
    },
    //endregion
});