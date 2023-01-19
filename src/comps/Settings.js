import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Modal, View, Alert, TouchableOpacity, ActivityIndicator, ImageBackground, Switch} from 'react-native';
import uuid from "react-native-uuid";
import { API, Auth, graphqlOperation } from 'aws-amplify';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';

import { colors, css } from '../config';
import { getDetailedUserByCognito, updateUser } from '../api/calls';
import IconButton from './IconButton';
import SimpleButton from './SimpleButton';
import SubTitle from './SubTitle';
import * as media from '../functions/media';
import * as logger from '../functions/logger'
import * as locConversion from '../functions/locConversion';
import Beam from './Beam';
import DarkBeam from './DarkBeam';


export default function Settings({ visible, onClose, navigation }) {
    const currentUser = useRef();

    const [loading1, setLoading1] = useState(false);
    const [loading2, setLoading2] = useState(false);

    const [allowNotifications, setAllowNotifications] = useState(false);
    const [blocked, setBlocked] = useState([]);

    useEffect(() => {
        const initialFunction = async () => {
            try {
                const cognitoUser = await Auth.currentUserInfo();
                const user = await API.graphql(graphqlOperation(getDetailedUserByCognito, {
                    id: cognitoUser.attributes.sub
                }));
                currentUser.current = user.data.getUserByCognito;
                setAllowNotifications(currentUser.current.allowNotifications);
            } catch (error) {
                logger.warn(error);
            }
        }
        initialFunction();
    }, []);

    const close = () => {
        onClose();
    }

    const logout = async () => {
        try {
            setLoading1(true);
            await Auth.signOut();
            logger.eLog("Signed User Out");
            setLoading1(false);
            close();
            navigation.navigate("LoginPage");
        } catch (error) {
            logger.warn(error);
        }
    }

    const Save = async () => { //The current problem.
        try {
            if (allowNotifications != currentUser.current.allowNotifications) {
                if (allowNotifications) {
                    const result1 = await Notifications.getPermissionsAsync();
                    if (!result1.granted) {
                        const result2 = await Notifications.requestPermissionsAsync();
                        if (!result2.granted) throw "Didn't enable Notifications";
                    }
                    const expoToken = await Notifications.getExpoPushTokenAsync();
                    await API.graphql(graphqlOperation(updateUser, {
                        input: {
                            id: currentUser.current.id,
                            allowNotifications: true,
                            expoToken: expoToken.data,
                        }
                    }));
                    close();
                    navigation.navigate("LoadingPage");
                } else {
                    await API.graphql(graphqlOperation(updateUser, {
                        input: {
                            id: currentUser.current.id,
                            allowNotifications: false,
                        }
                    }));
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

    return (
        <Modal visible={visible} animationType="slide">
            <View style={styles.page}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={close}>
                        <SubTitle color={colors.text1} style={styles.title} size={16}>Cancel</SubTitle>
                    </TouchableOpacity>
                    <SubTitle color={colors.pBeamBright} style={styles.title} size={18}>Settings </SubTitle>
                    <TouchableOpacity onPress={Save}>
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
                <SimpleButton title="Logout" onPress={()=>logout()} />
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    page: {
        flex: 1,
        backgroundColor: colors.background
    },
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
    title: {
        fontWeight: "bold",
        alignSelf: "center",
    },
    desc: {
        marginTop: 6,
        alignItems: "center",
        justifyContent: "center"
    },
    subtitle: {
        fontWeight: "400"
    },
    setting: {
        flexDirection: "row",
        justifyContent: "space-between",
        margin: 14,
        alignItems: "center"
    }
})