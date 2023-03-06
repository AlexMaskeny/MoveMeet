//region 3rd Party Imports
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Modal, View, TouchableWithoutFeedback, Keyboard, Alert} from 'react-native';
import uuid from "react-native-uuid";
import NetInfo from "@react-native-community/netinfo";
import { Auth } from 'aws-amplify';
import * as Location from 'expo-location';
//endregion
//region 1st Party Imports
import { dark_colors, rules, strings } from '../config';
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
//endregion

export default function CreateChat({ visible, onClose, currentUser, navigation }) {
    /* =============[ VARS ]============ */
    //region useRef variables
    const cTitleRef = useRef(); //used on the title input for the chat of form "ref={cTitleRef}"
    const id = useRef();        //the ID of the new chat
    //endregion
    //region useState variables
    const [loading, setLoading] = useState(false);   //While waiting for the background selected to load
    const [loading2, setLoading2] = useState(false); //While waiting to create the chat
    const [enabled, setEnabled] = useState(true);    //Can the user submit?
    const [showBack, setShowBack] = useState(false); //Should show the background color select?
    const [cTitle, setCTitle] = useState("");        //The title of the chat
    const [members, setMembers] = useState([]);      //The list of members on the chat (only the currentUser
    const [ready, setReady] = useState(false);       //Should we show the chat preview?
    const [background, setBackground] = useState({   //The chat's background
        isColor: true,
        uri: {
            full: " ",
            loadFull: " ",
            disabled: true,
            fullKey: " "
        },
        color: dark_colors.background
    });
    //endregion

    /* =============[ HOOKS ]============ */
    //region [HOOK] "useEffect, [visible]" = Verifies that the user can still make more chats on open
    useEffect(() => {
        (async function() {
            try {
                //region Get the chats the user is a member of
                const result = await mmAPI.query({
                    call: calls.GET_USER,
                    instance: "createChat",
                    input: {
                        id: currentUser.id
                    }
                });
                //endregion

                let count = 0;
                //region Count how many chats the user created & is still part of
                for (let i = 0; i < result.chats.items.length; i++) {
                    const chat = result.chats.items[i].chat;
                    if ((chat.creator === currentUser.id) && !chat.private && chat.enabled) {
                        const last3 = await mmAPI.query({
                            call: calls.LIST_MESSAGES_BY_TIME,
                            instance: "createChat",
                            input: {
                                chatMessagesId: chat.id,
                                limit: 3
                            }
                        })
                        //region to be fair to the user, verify none of their chats are expired when seeing if they have to many active chats. (if this chat is expired then go to next chat)
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
                            if (last3.items.length === 0 && (Date.now() - Date.parse(chat.createdAt)) / 1000 > 60 * 60 * rules.chatDeletionTime) {
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
                        //endregion
                        count++;
                    }
                }
                //endregion

                //If the count is less than the rule then allow them to create new chats
                if (count <= rules.maxNumChats) setEnabled(true);
                else setEnabled(false);
            } catch (error) {
                logger.eLog("Possible Unnessary Error: "+error);
            }
        })();
    }, [visible]);
    //endregion

    /* =============[ FUNCS ]============ */
    //region [FUNC ASYNC] "selectImage = async ()" = Prompts user to select the chat background and *locally* adds them as a member
    const selectImage = async () => {
        setLoading(true);

        //create the chatID
        id.current = uuid.v4();

        //add the currentUser as a chat member *locally*
        setMembers([{
            user: {
                id: currentUser.id,
                username: currentUser.username,
                picture: currentUser.profilePicture.uri,
            }
        }]);

        //prompt user to select a background
        Alert.alert("Use a photo or use a color", "Pick one of the options below to select the background", [
            {
                text: "Open Photos", onPress: async () => {
                    await media.openPhotos((image) => {
                        setBackground({
                            uri: {
                                ...image,
                                disabled: true
                            },
                            isColor: false,
                            color: ""
                        });
                    });
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
    //endregion
    //region [FUNC ASYNC] "enableLocation = async ()" = Called when the user wants to enable their location
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
    //endregion
    //region [FUNC ASYNC] "createChat = async ()" = Creates the chat based on the inputs provided (or fails and alerts user)
    const createChat = async () => {
        try {
            setLoading2(true);
            //region Verify that the user CAN create the chat
            //region Verify the user doesn't have to many chats
            if (!enabled) {
                Alert.alert("You can't create a chat", "You have to many active chats in this area right now.");
                throw "Already a chat";
            }
            //endregion
            //region Verify the user have locations enabled
            const location = await Location.getForegroundPermissionsAsync();
            if (!location.granted) {
                Alert.alert("Location Needed", "You need to let " + strings.APPNAME + " use your location to create chats. You will have to recreate your chat after giving us access.", [
                    { text: "Cancel" },
                    { text: "Give Access", onPress: enableLocation },
                ]);
                throw "Location Needed";
            }
            //endregion
            //region Verify the user is connected to the internet
            const netInfo = await NetInfo.fetch();
            if (!netInfo.isConnected) {
                Alert.alert("No Connection", "You must be connected to the internet to do this.");
                throw "No Connection";
            }
            //endregion
            //endregion

            //Get the current cognito user (in order to assign the owner of the chat)
            const currentCognitoUser = await Auth.currentAuthenticatedUser();

            //Get the user's location in ft
            const userLocation = await Location.getLastKnownPositionAsync();
            const userLocationConverted = locConversion.toUser(userLocation.coords.latitude, userLocation.coords.longitude);

            //region [IF] the background is an image [THEN] upload the image to s3
            if (!background.isColor) {
                await mmAPI.store("FULLCHATBACKGROUND" + id.current + ".jpg", background.uri.full);
                await mmAPI.store("LOADFULLCHATBACKGROUND" + id.current + ".jpg", background.uri.loadFull);
            }
            //endregion
            //region Create the chat in the database
            const result2 = await mmAPI.mutate({
                call: calls.CREATE_CHAT,
                input: {
                    id: id.current,
                    background: {
                        bucket: "proxychatf2d762e9bc784204880374b0ca905be4120629-dev",
                        full: "FULLCHATBACKGROUND" + id.current + ".jpg",
                        loadFull: "LOADFULLCHATBACKGROUND" + id.current + ".jpg",
                        region: "us-east-2",
                        enableColor: background.isColor,
                        color: background.color
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
            //endregion
            //region Add the currentUser as a member to this newly created chat
            const result3 = await mmAPI.mutate({
                call: calls.CREATE_CHAT_MEMBERS,
                instance: "background",
                input: {
                    userID: currentUser.id,
                    chatID: id.current,
                }
            })
            //endregion
            //region Alert the user they successfully created the chat & exit
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
            //endregion

        } catch (error) {
            logger.warn(error);
            setLoading2(false);
        }
    }
    //endregion
    //region [FUNCTION]   "close = ()" = Exits this modal & returns to default state.
    const close = () => {
        cTitleRef.current.clear();
        setCTitle("");
        setBackground({
            isColor: true,
            full: " ",
            loadFull: " ",
            color: dark_colors.background
        });
        onClose();
        setReady(false);
    }
    //endregion

    return (
        <Modal visible={visible} animationType="slide">
            <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
                <View style={styles.page}>
                    <View style={styles.header}>
                        <IconButton color={dark_colors.container} icon="ios-close-circle" brand="Ionicons" size={32} />
                        <SubTitle color={dark_colors.pBeamBright} style={styles.title} size={18}>Create Chat</SubTitle>
                        <IconButton color={dark_colors.text1} icon="ios-close-circle" brand="Ionicons" size={32} onPress={close} />
                    </View>
                    <SimpleInput
                        reference={cTitleRef}
                        placeholder="Chat Title"
                        icon="rename-box"
                        maxLength={18}
                        text={cTitle.length + "/18"}
                        onChangeText={(text)=>setCTitle(text)}
                    />
                    <SimpleButton outerStyle={styles.button} title="Select Chat Background" onPress={selectImage} loading={loading} disabled={loading} />
                    <View style={styles.desc}>
                        <SubTitle size={16} style={styles.subtitle}>When you create a chat you cannot</SubTitle>
                        <SubTitle size={16} style={styles.subtitle}>delete it, but it will automatically delete</SubTitle>
                        <SubTitle size={16} style={styles.subtitle}>after {rules.chatDeletionTime} hours of inactivity. You can</SubTitle>
                        <SubTitle size={16} style={styles.subtitle}>only create {rules.maxNumChats} chats in the same area at once.</SubTitle>
                    </View>
                    <Beam style={{ marginTop: 20, marginBottom: 10 }} />
                        {(cTitle.length > 0 && ready) && <>
                        <View style={{ marginHorizontal: 10 }}>
                            <Chat
                                background={background}
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
                        <SimpleButton title="Create Chat" onPress={createChat} loading={loading2} disabled={loading2} />
                         </>}
                </View>
            </TouchableWithoutFeedback>
            <BackgroundEditor
                visible={showBack}
                onClose={() => setShowBack(false)}
                onSuccess={(color) => { setBackground({ full: " ", loadFull: " ", isColor: true, color: color }); setReady(true) }}
            />
        </Modal>
    )
}

const styles = StyleSheet.create({
    //region page
    page: {
        flex: 1,
        backgroundColor: dark_colors.background
    },
    //endregion
    //region header
    header: {
        backgroundColor: dark_colors.container,
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
    //region button
    button: {
        padding: 12,
        shadowRadius: 0,
        borderColor: dark_colors.text4
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
    }
    //endregion
});