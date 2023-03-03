//region 3rd Party Imports
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Modal, View, Alert, TouchableOpacity, Switch, FlatList} from 'react-native';
import { Auth } from 'aws-amplify';
import * as Notifications from 'expo-notifications';
import NetInfo from "@react-native-community/netinfo";
//endregion
//region 1st Party Imports
import IconButton from './IconButton';
import SimpleButton from './SimpleButton';
import SubTitle from './SubTitle';
import DarkBeam from './DarkBeam';
import { calls, mmAPI } from '../api/mmAPI';
import { colors } from '../config';
import * as logger from '../functions/logger'
//endregion

export default function Settings({ visible, onClose, navigation }) {
    const currentUser = useRef();

    const [loading2, setLoading2] = useState(false);
    const [allowNotifications, setAllowNotifications] = useState(false);
    const [blocked, setBlocked] = useState([]);

    //region [FUNC ASYNC] "getBlockedUsers = async ()" = Gets the users blocked by currentUser
    const getBlockedUsers = async () => {
        try {
            let blockedUsers = [];
            for (let i = 0; i < currentUser.current.friends.length; i++) {
                if (currentUser.current.friends[i].status === "666") {
                    const blockedUser = await mmAPI.query({
                        call: calls.GET_USER,
                        instance: "username",
                        input: {
                            id: currentUser.current.friends[i].friendID
                        }
                    })
                    blockedUsers.push({
                        id: currentUser.current.friends[i].friendID,
                        username: blockedUser.username
                    })
                }
            }
            setBlocked(blockedUsers);
        } catch (error) {
            logger.warn(error);
        }
    }
    //endregion

    //region [HOOK] "useEffect, [visible]" Get the initial state of the currentUser's settings & sets the currentUser.
    useEffect(() => {
        (async function() {
            try {
                //region Get the current user
                const cognitoUser = await Auth.currentAuthenticatedUser();
                currentUser.current = await mmAPI.query({
                    call: calls.GET_USER_BY_COGNITO,
                    instance: "friendsIDnot",
                    input: {
                        id: cognitoUser.attributes.sub
                    }
                });
                //endregion

                //Update the state with currentUser data
                setAllowNotifications(currentUser.current.allowNotifications);
                await getBlockedUsers();
            } catch (error) {
                logger.warn(error);
            }
        })();
    }, [visible]);
    //endregion

    //region [FUNCTION]   "close = ()" = closes the modal
    const close = () => {
        onClose();
    }
    //endregion

    //region [FUNC ASYNC] "logout = async ()" = Logs the user out & sends to loadingPage
    const logout = async () => {
        const netInfo = await NetInfo.fetch();
        if (!netInfo.isConnected || !netInfo.isInternetReachable) {
            Alert.alert("No Connection", "You must be connected to the internet to do this.");
            return;
        }
        close();
        navigation.navigate("LoadingPage", { signOut: true });
    }
    //endregion

    //region [FUNCTION]   "removeBlocked = (item)" = Make the blockedUser not blocked anymore
    const removeBlocked = (blockedUser) => {
        Alert.alert("Are you sure?", "Are you sure you want to unblock " + blockedUser.username + "?", [
            { text: "Cancel" },
            { text: "Confirm", onPress: () => {
                (async function(){
                    try {
                        const friendIndex = currentUser.current.friends.findIndex((el) => el.friendID === blockedUser.id);
                        currentUser.current.friends[friendIndex].status = "0";
                        await mmAPI.mutate({
                            call: calls.UPDATE_USER,
                            input: {
                                id: currentUser.current.id,
                                friends: currentUser.current.friends
                            }
                        });
                        await mmAPI.mutate({
                            call: calls.CREATE_CHAT_MEMBERS,
                            input: {
                                chatID: currentUser.current.friends[friendIndex].chatID,
                                userID: currentUser.current.id
                            }
                        });
                        await getBlockedUsers();
                    } catch (error) {
                        logger.warn(error);
                    }

                })();
            }}
        ])
    }
    //endregion

    //region [FUNC ASYNC] "save = async ()" = Saves the updates to the settings (Only notifications currently)
    const save = async () => {
        try {
            if (allowNotifications !== currentUser.current.allowNotifications) {
                if (allowNotifications) {
                    const result1 = await Notifications.getPermissionsAsync();
                    if (!result1.granted) {
                        const result2 = await Notifications.requestPermissionsAsync();
                        if (!result2.granted) throw "Didn't enable Notifications";
                    }
                    const expoToken = await Notifications.getExpoPushTokenAsync();
                    await mmAPI.mutate({
                        call: calls.UPDATE_USER,
                        input: {
                            id: currentUser.current.id,
                            allowNotifications: true,
                            expoToken: expoToken.data,
                        }
                    });
                    close();
                    navigation.navigate("LoadingPage");
                } else {
                    await mmAPI.mutate({
                        call: calls.UPDATE_USER,
                        input: {
                            id: currentUser.current.id,
                            allowNotifications: false,
                        }
                    });
                }
                currentUser.current.allowNotifications = !currentUser.current.allowNotifications;

            }
        } catch (error) {
            logger.warn(error);
            setLoading2(false);
        } finally {
            close();
        }
    }
    //endregion

    return (
        <Modal visible={visible} animationType="slide">
            <View style={styles.page}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={close}>
                        <SubTitle color={colors.text1} style={styles.title} size={16}>Cancel</SubTitle>
                    </TouchableOpacity>
                    <SubTitle color={colors.pBeamBright} style={styles.title} size={18}>Settings </SubTitle>
                    <TouchableOpacity onPress={save}>
                        <SubTitle color={colors.text1} style={styles.title} size={16}>Done</SubTitle>
                    </TouchableOpacity>
                </View>
                <View style={styles.setting}>
                    <SubTitle color={colors.text1} style={styles.title} size={18}>Allow Notifications</SubTitle>
                    <Switch
                        trackColor={{
                            true: colors.pBeamBright,
                            false: colors.container
                        }}
                        value={allowNotifications}
                        onValueChange={()=>setAllowNotifications(!allowNotifications)}
                    />
                </View>
                <DarkBeam style={{ backgroundColor: colors.container, height: 1, marginVertical: 7 }} />
                {blocked.length > 0 && <>
                    <View style={styles.blockedUsers}>
                        <SubTitle color={colors.text1} style={styles.title2} size={18}>Blocked</SubTitle>
                        <View style={{ height: 10 }} />
                        <FlatList
                            data={blocked}
                            keyExtractor={item => item.id}
                            ItemSeparatorComponent={<View style={{height: 10}} /> }
                            renderItem={({ item }) => (
                                <View style={styles.blocked}>
                                    <IconButton icon="remove-circle" brand="Ionicons" size={28} color={colors.pBeam} onPress={()=>removeBlocked(item) } />
                                    <View style={{width: 10}} />
                                    <SubTitle color={colors.text1} size={18}>{item.username}</SubTitle>
                                </View>
                            ) }
                        />
                    </View>
                    <DarkBeam style={{ backgroundColor: colors.container, height: 1, marginVertical: 7 }} />                
                </>}
                <SimpleButton title="Logout" onPress={() => logout()} />
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    //region page
    page: {
        flex: 1,
        backgroundColor: colors.background
    },
    //endregion
    //region header
    header: {
        backgroundColor: colors.container,
        width: "100%",
        justifyContent: "space-between",
        alignItems: "center",
        flexDirection: "row",
        paddingHorizontal: 14,
        paddingTop: 50,
        paddingBottom: 10,
        marginBottom: 10,
    },
    //endregion
    //region title
    title: {
        fontWeight: "bold",
        alignSelf: "center",
    },
    //endregion
    //region title2
    title2: {
        fontWeight: "bold",
    },
    //endregion
    //region desc
    desc: {
        marginTop: 6,
        alignItems: "center",
        justifyContent: "center"
    },
    //endregion
    //region subtitle
    subtitle: {
        fontWeight: "400"
    },
    //endregion
    //region setting
    setting: {
        flexDirection: "row",
        justifyContent: "space-between",
        margin: 14,
        alignItems: "center"
    },
    //endregion
    //region blocked
    blocked: {
        alignSelf: "flex-start",
        alignItems: "center",
        flexDirection: "row",
    },
    //endregion
    //region blockedUsers
    blockedUsers: {
        alignItems: "flex-start",
        justifyContent: "flex-start",
        margin: 12
    },
    //endregion
});