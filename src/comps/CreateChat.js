import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Modal, View, TouchableWithoutFeedback, Keyboard, Alert} from 'react-native';
import uuid from "react-native-uuid";
import NetInfo from "@react-native-community/netinfo";
import { Auth } from 'aws-amplify';
import * as Location from 'expo-location';

import { colors, rules, strings } from '../config';
import IconButton from './IconButton';
import SimpleButton from './SimpleButton';
import SimpleInput from './SimpleInput';
import SubTitle from './SubTitle';
import Chat from './Chat';
import * as media from '../functions/media';
import * as logger from '../functions/logger'
import * as locConversion from '../functions/locConversion';
import Beam from './Beam';
import BackgroundEditor from './BackgroundEditor';
import { calls, mmAPI } from '../api/mmAPI';


export default function CreateChat({ visible, onClose, currentUser, navigation }) {
    const cTitleRef = useRef();
    const [loading, setLoading] = useState(false);
    const [loading2, setLoading2] = useState(false);
    const [enabled, setEnabled] = useState(true);
    const [showBack, setShowBack] = useState(false);
    const [cTitle, setcTitle] = useState("");
    const [cBackground, setCBackground] = useState({ isColor: true, uri: { full: " ", loadFull: " ", disabled: true, fullKey: " " }, color: colors.background});
    const [members, setMembers] = useState([]);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const initialFunction = async () => {
            try {
                const result = await mmAPI.query({
                    call: calls.GET_USER,
                    instance: "createChat",
                    input: {
                        id: currentUser.id
                    }
                });
                
                var count = 0;
                for (var i = 0; i < result.chats.items.length; i++) {
                    const chat = result.chats.items[i].chat;
                    if ((chat.creator == currentUser.id) && !chat.private && chat.enabled) {
                        const last3 = await mmAPI.query({
                            call: calls.LIST_MESSAGES_BY_TIME,
                            instance: "createChat",
                            input: {
                                chatMessagesId: chat.id,
                                limit: 3
                            }
                        })
                        try {
                            if ((Date.now() - Date.parse(last3.items[0].createdAt)) / 1000 > 60 * 60 * rules.chatDeletionTime) { //if enabled and greater than rules.chatDeletionTime hours old then remove
                                await mmAPI.mutate({
                                    call: calls.UPDATE_CHAT,
                                    input: {
                                        id: chat.id,
                                        enabled: false
                                    }
                                });
                                continue;
                            }
                        } catch (error) { }
                        try {
                            if (last3.items.length == 0 && (Date.now() - Date.parse(chat.createdAt)) / 1000 > 60 * 60 * rules.chatDeletionTime) {
                                await mmAPI.mutate({
                                    call: calls.UPDATE_CHAT,
                                    input: {
                                        id: chat.id,
                                        enabled: false
                                    }
                                });
                                continue;
                            }
                        } catch (error) { }
                        count++;
                    }
                }
                
                if (count <= rules.maxNumChats) setEnabled(true);
                else setEnabled(false);
            } catch (error) {
                logger.eLog("Possible Unnessary Error: "+error);
            }
        }
        initialFunction();
    }, [visible]);
    
    const id = useRef();

    const close = () => {
        cTitleRef.current.clear();
        setcTitle("");
        setCBackground({ isColor: true, full: " ", loadFull: " ", color: colors.background });
        onClose();
        setReady(false);
    }

    const selectImage = async () => {
        setLoading(true);
        id.current = uuid.v4();
        setMembers([{
            user: {
                id: currentUser.id,
                username: currentUser.username,
                picture: currentUser.profilePicture.uri,
            }
        }]);
        Alert.alert("Use a photo or use a color", "Pick one of the options below to select the background", [
            {
                text: "Open Photos", onPress: async () => {
                    await media.openPhotos((image) => { setCBackground({ uri: { ...image, disabled: true }, isColor: false, color: ""}) });
                    setReady(true);
                }
            },
            {
                text: "Select Color", onPress: () => {
                    setShowBack(true);
                }
            }
        ]);
        Keyboard.dismiss();
        setLoading(false);
    }

    const enableLocation = async () => {
        const result = await Location.getForegroundPermissionsAsync();
        if (result.canAskAgain) {
            const result = await Location.requestForegroundPermissionsAsync();
            if (result.granted) {
                navigation.navigate("LoadingPage");
                onClose();
            }
        } else {
            Alert.alert("Go to your settings", "In order to enable " + strings.APPNAME + " to access your location, you need to enable it in your settings");
        }
    }

    const CreateChat = async () => {
        try {
            if (!enabled) {
                Alert.alert("You can't create a chat", "You have to many active chats right now.");
                throw "Already a chat";
            }
            setLoading2(true);
            const location = await Location.getForegroundPermissionsAsync();
            if (!location.granted) {
                Alert.alert("Location Needed", "You need to let " + strings.APPNAME + " use your location to create chats. You will have to recreate your chat after giving us access.", [
                    { text: "Cancel" },
                    { text: "Give Access", onPress: enableLocation },
                ]);
                throw "Location Needed";
            }

            const netInfo = await NetInfo.fetch();
            if (!netInfo.isConnected) {
                Alert.alert("No Connection", "You must be connected to the internet to do this.");
                throw "No Connection";
            }
            const currentCognitoUser = await Auth.currentAuthenticatedUser();
            const userLocation = await Location.getLastKnownPositionAsync();
            const userLocationConverted = locConversion.toUser(userLocation.coords.latitude, userLocation.coords.longitude);
            if (!cBackground.isColor) {
                await mmAPI.store("FULLCHATBACKGROUND" + id.current + ".jpg", cBackground.uri.full);
                await mmAPI.store("LOADFULLCHATBACKGROUND" + id.current + ".jpg", cBackground.uri.loadFull);
            }
            const result2 = await mmAPI.mutate({
                call: calls.CREATE_CHAT,
                input: {
                    id: id.current,
                    background: {
                        bucket: "proxychatf2d762e9bc784204880374b0ca905be4120629-dev",
                        full: "FULLCHATBACKGROUND" + id.current + ".jpg",
                        loadFull: "LOADFULLCHATBACKGROUND" + id.current + ".jpg",
                        region: "us-east-2",
                        enableColor: cBackground.isColor,
                        color: cBackground.color
                    },
                    name: cTitle,
                    creator: currentUser.id,
                    owner: currentCognitoUser.attributes.sub,
                    private: false,
                    enabled: true,
                    lat: userLocationConverted.lat,
                    long: userLocationConverted.long,
                    latf1: userLocationConverted.latf1,
                    latf2: userLocationConverted.latf2,
                    longf1: userLocationConverted.longf1,
                    longf2: userLocationConverted.longf2,
                }
            })
            const result3 = await mmAPI.mutate({
                call: calls.CREATE_CHAT_MEMBERS,
                instance: "background",
                input: {
                    userID: currentUser.id,
                    chatID: id.current,
                }
            })
            if (result2 && result3) {
                setTimeout(function () {
                    Alert.alert("Success", "Chat Successfully Created.", [
                        { text: "Okay", onPress: () => close() },
                    ])
                    setLoading2(false);
                }, 1000);
            } else {
                throw "API Error"
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
                        text={cTitle.length + "/18"}
                        onChangeText={(text)=>setcTitle(text)}
                    />
                    <SimpleButton outerStyle={styles.button} title="Select Chat Background" onPress={selectImage} loading={loading} disabled={loading} />
                    <View style={styles.desc}>
                        <SubTitle size={16} style={styles.subtitle}>When you create a chat you cannot</SubTitle>
                        <SubTitle size={16} style={styles.subtitle}>delete it, but it will automatically delete</SubTitle>
                        <SubTitle size={16} style={styles.subtitle}>after {rules.chatDeletionTime} hours of inactivity. You can</SubTitle>
                        <SubTitle size={16} style={styles.subtitle}>only create {rules.maxNumChats} chats at once.</SubTitle>
                    </View>
                    <Beam style={{ marginTop: 20, marginBottom: 10 }} />
                        {(cTitle.length > 0 && ready) && <>
                        <View style={{ marginHorizontal: 10 }}>
                            <Chat
                                background={cBackground}
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
            <BackgroundEditor
                visible={showBack}
                onClose={() => setShowBack(false)}
                onSuccess={(color) => { setCBackground({ full: " ", loadFull: " ", isColor: true, color: color }); setReady(true) }}
            />
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