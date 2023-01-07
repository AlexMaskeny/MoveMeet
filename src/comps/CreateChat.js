import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Modal, View, TouchableWithoutFeedback, Keyboard, Alert} from 'react-native';
import uuid from "react-native-uuid";
import { API, graphqlOperation, Storage } from 'aws-amplify';
import * as Location from 'expo-location';

import { colors } from '../config';
import { createChat, createChatMembers } from '../api/calls';
import IconButton from './IconButton';
import SimpleButton from './SimpleButton';
import SimpleInput from './SimpleInput';
import SubTitle from './SubTitle';
import Chat from './Chat';
import * as media from '../functions/media';
import * as logger from '../functions/logger'
import * as locConversion from '../functions/locConversion';
import Beam from './Beam';
import NoLocationAlert from './NoLocationAlert';


export default function CreateChat({ visible, onClose, currentUser }) {
    const cTitleRef = useRef();
    const [loading, setLoading] = useState("");
    const [loading2, setLoading2] = useState("");

    const [cTitle, setcTitle] = useState("");
    const [cBackground, setCBackground] = useState("");
    const [members, setMembers] = useState([]);

    const id = useRef();

    const close = () => {
        cTitleRef.current.clear();
        setcTitle("");
        setCBackground("");
        onClose();
    }

    const selectImage = async () => {
        setLoading(true);
        id.current = uuid.v4();
        setMembers([{
            user: {
                id: currentUser.id,
                username: currentUser.username,
                picture: currentUser.profilePicture.loadFull,
            }
        }]);
        await media.openPhotos((image) => setCBackground(image));
        Keyboard.dismiss();
        setLoading(false);
    }

    const CreateChat = async () => {
        try {
            //TODO: Verify that the user doesn't already have many chats via owner field. Give user a list of presets backgrounds.
            setLoading2(true);
            const location = await Location.getForegroundPermissionsAsync();
            if (!location.granted) {
                Alert.alert("Location Needed", "You need to let ProxyChat use your location to use this.", [
                    { text: "Okay" }
                ]);
                return;
            }
            const userLocation = await Location.getLastKnownPositionAsync();
            const userLocationConverted = locConversion.toUser(userLocation.coords.latitude, userLocation.coords.longitude);
            const response = await fetch(cBackground);
            if (response) {
                const img = await response.blob();
                if (img) {
                    const result1 = await Storage.put("FULLchatBackground" + id.current + ".jpg", img);
                }
            }
            const result2 = await API.graphql(graphqlOperation(createChat, {
                input: {
                    id: id.current,
                    background: {
                        bucket: "proxychatf2d762e9bc784204880374b0ca905be4120629-dev",
                        full: "FULLchatBackground" + id.current + ".jpg",
                        loadFull: "LOADFULLchatBackground" + id.current + ".jpg",
                        region: "us-east-2",
                    },
                    name: cTitle,
                    private: false,
                    lat: userLocationConverted.lat,
                    long: userLocationConverted.long,
                    latf1: userLocationConverted.latf1,
                    latf2: userLocationConverted.latf2,
                    longf1: userLocationConverted.longf1,
                    longf2: userLocationConverted.longf2,
                    owner: currentUser.id
                }
            }));
            const result3 = await API.graphql(graphqlOperation(createChatMembers, {
                input: {
                    userID: currentUser.id,
                    chatID: id.current,
                }
            }));
            if (result2 && result3) {
                setTimeout(function () {
                    Alert.alert("Success", "Chat Successfully Created.", [
                        { text: "Okay", onPress: ()=>close() },
                    ])
                    setLoading2(false);
                }, 1000);
            } else {
                throw ""
            }
        } catch (error) {
            logger.warn(error);
            setLoading2(false);
        }
    }

    return (
        <Modal visible={visible} animationType="slide">
            <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
                <View style={styles.page}>
                    <View style={styles.header}>
                        <IconButton color={colors.container} icon="ios-close-circle" brand="Ionicons" size={32} />
                        <SubTitle color={colors.pBeamBright} style={styles.title} size={18}>Create Chat</SubTitle>
                        <IconButton color={colors.text1} icon="ios-close-circle" brand="Ionicons" size={32} onPress={close} />
                    </View>
                    <SimpleInput
                        reference={cTitleRef}
                        placeholder="Chat Title"
                        icon="rename-box"
                        maxLength={18}
                        onChangeText={(text)=>setcTitle(text)}
                    />
                    <SimpleButton outerStyle={styles.button} title="Select Chat Image" onPress={selectImage} loading={loading} disabled={loading} />
                    <View style={styles.desc}>
                        <SubTitle size={16} style={styles.subtitle}>When you create a chat you cannot</SubTitle>
                        <SubTitle size={16} style={styles.subtitle}>delete it, but it will automatically</SubTitle>
                        <SubTitle size={16} style={styles.subtitle}>delete after 36 hours. Also, you cannot</SubTitle>
                        <SubTitle size={16} style={styles.subtitle}>create more than 3 public chats at a time.</SubTitle>
                    </View>
                    <Beam style={{ marginTop: 20, marginBottom: 10 }} />

                    {(cBackground.length > 0 && cTitle.length > 0) && <>
                        <View style={{marginHorizontal: 10}}>
                            <Chat
                            background={{uri: cBackground}}
                            members={members}
                            disabled={true}
                            last3={[]}
                            latest="New Chat"
                            id={id.current}
                            userChatMembersID=""
                            numMembers={1}
                            distance="0 Feet"
                            title={cTitle}
                            created={Date.now().toString()}
                            onPress={() => logger.eLog("Generated")}
                            />
                        </View>
                        <SimpleButton title="Create Chat" onPress={CreateChat} loading={loading2} disabled={loading2} />
                    </>}
                </View>
            </TouchableWithoutFeedback>
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
    button: {
        padding: 12,
        shadowRadius: 0,
        borderColor: colors.text4
    },
    desc: {
        marginTop: 6,
        alignItems: "center",
        justifyContent: "center"
    },
    subtitle: {
        fontWeight: "400"
    }
})