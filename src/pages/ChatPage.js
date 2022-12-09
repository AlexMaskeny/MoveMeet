import React from 'react';
import { StyleSheet, Image, ActivityIndicator, Alert, FlatList, View, KeyboardAvoidingView } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable'
import NetInfo from "@react-native-community/netinfo";
import { API, Auth, graphqlOperation, Storage, Hub } from 'aws-amplify';
import { CONNECTION_STATE_CHANGE, ConnectionState } from '@aws-amplify/pubsub';
import { CONNECTION_INIT_TIMEOUT } from '@aws-amplify/pubsub/lib-esm/Providers/constants';
import { Background, useHeaderHeight } from '@react-navigation/elements';
import ImageView from 'react-native-image-viewing';
import uuid from "react-native-uuid";
import * as ImagePicker from 'expo-image-picker';

import {
    listMessagesByTime,
    getUser,
    getMessage,
    createMessage,
    onReceiveMessage
} from '../api/calls';
import NoConnectionAlert from '../comps/NoConnectionAlert';
import IconButton from '../comps/IconButton';
import {colors,css,debug, timeLogic, timeLogicNoAgo } from '../config'
import Screen from '../comps/Screen';
import SimpleButton from '../comps/SimpleButton';
import SimpleInput from '../comps/SimpleInput';
import DarkBeam from '../comps/DarkBeam';
import Beam from '../comps/Beam';
import ComplexMessage from '../comps/ComplexMessage';
import BeamTitle from '../comps/BeamTitle';
import SubTitle from '../comps/SubTitle';
import ImageInput from '../comps/ImageInput';
import PreviewImage from '../comps/PreviewImage';
import ImageMessage from '../comps/ImageMessage';
import { LongPressGestureHandler, State } from 'react-native-gesture-handler';
import { KeyboardAwareFlatList } from 'react-native-keyboard-aware-scroll-view';

//DESCRIPTION: A primary page of the SecondaryNav
//             is the hub for all localized chats


function ChatPage({ route, navigation }) {
    const [msg, setMsg] = React.useState("");
    const [msgIsImage, setMsgIsImage] = React.useState(false);
    const [selectedImage, setSelectedImage] = React.useState("");
    const msgRef = React.useRef();
    const chatsRef = React.useRef();
    const headerHeight = useHeaderHeight();
    const [data, setData] = React.useState([]);
    const [refresh, setRefresh] = React.useState(false);
    const nextToken = React.useRef("i2");
    const lastToken = React.useRef("i1");
    const dataRef = React.useRef([]);
    const userMap = React.useRef(new Map());
    const [connected, setConnected] = React.useState(true);
    const [showPreviewImage, setShowPreviewImage] = React.useState(false);
    const [previewImage, setPreviewImage] = React.useState("");
    /* 
    Typing & Presence:
    So upon typing update chatmember by chatmemberid gotten through chat data to status code 2
    Upon not typing yet present set status code to 1
    upon not typing and not present set status code to 0
    upon present set status code to 1

    Every 8 seconds the chatmember is updated with its status data
    Every 12 seconds the consumer checks this data.
    if difference in data >= 15 then ignore and use status code 0 yet don't change.

    Read Receipts: To only exist in user to user conversations

    Other Tasks:
        Disable if location goes bad (use listener) (use modal)
        Typing & Presence
        Ensure that subscriptions aren't being unnessararily cloned. Either remove on back (actually good & efficent idea) or see if they are just temp disabled, etc.
        Ensure that subscriptions are being renewed. 
        Get messages & Images up and running. If send text with image send as 2 messages. Put image "in" text input.
     */
    
    //React.useEffect(() => {
    //    const unsubscribe = navigation.addListener('transitionEnd', () => {
    //        msgRef.current.focus();
    //    })
    //    return unsubscribe;
    //}, [navigation])
    React.useEffect(() => {
        var priorState = ConnectionState.Disconnected;
        const connectionSub = NetInfo.addEventListener(state => {
            setConnected(state.isConnected && state.isInternetReachable);
            //Could make this problematic if need be
        });
        var sub = API.graphql(graphqlOperation(onReceiveMessage, {
            chatMessagesId: route.params.id
        })).subscribe({
            next: ({ value }) => { if (route.params.user.id != value.data.onReceiveMessage.user.id) appendMessages(value.data.onReceiveMessage) },
        })
        const hub = Hub.listen("api", (data) => {
            const { payload } = data;
            if (payload.event == CONNECTION_STATE_CHANGE) {
                if (priorState == ConnectionState.Connecting && payload.message == ConnectionState.Connected) {
                    getMessages(true);
                }
            } else if (payload.event == CONNECTION_INIT_TIMEOUT) {
                sub.unsubscribe();
                if (debug) console.log("Timeout");
                sub = API.graphql(graphqlOperation(onReceiveMessage, {
                    chatMessagesId: route.params.id
                })).subscribe({
                    next: ({ value }) => appendMessages(value.data.onReceiveMessage),
                });
                getMessages(true);
            }
            priorState = payload.message;
        })

        const timeClock = setInterval(() => updateTime(), 10000) 
        return () => {
            hub();
            clearInterval(timeClock);
            sub.unsubscribe();
            connectionSub();
        }
    }, []);

    const updateTime = () => {
        const iterator = dataRef.current.values();
        var i = 0;
        for (const value of iterator) {
            dataRef.current[i].date = timeLogicNoAgo(Date.now() / 1000 - value.exactDate / 1000);
            i++
        }
        setData(dataRef.current.concat());
    }

    React.useEffect(() => {
        const initialFunction = async () => {
            try {
                userMap.current.set(route.params.user.id, route.params.user.profilePicture.loadFull);
                await getMessages(true);
                //setReady(true);
            } catch (error) {
                if (debug) console.warn(error);
            }
        }
        initialFunction();
    }, []);


    const appendMessages = async (newMessage, reverse = false) => {
        //console.log(newMessage)
        const pic = userMap.current.get(newMessage.user.id);
        var content;
        var image;
        var picture;

        if (pic) {
            picture = pic;
        } else {
            picture = await Storage.get(newMessage.user.profilePicture.loadFull);
            userMap.current.set(newMessage.user.id, picture);
        }

        if (newMessage.type == "Regular") {
            content = newMessage.content;
            image = {};
        } else if (newMessage.type == "Image") {
            content = "";
            const full = await Storage.get(newMessage.image.full);
            const loadFull = await Storage.get(newMessage.image.loadFull);
            image = {
                uri: full,
                local: false,
                loadImage: loadFull,
                key: "FULLMESSAGE" + newMessage.id
            };
        }

        const time = timeLogicNoAgo((Date.now()/1000 - Date.parse(newMessage.createdAt)/1000));
        const message = {
            id: newMessage.id,
            content: content,
            image: image,
            type: newMessage.type,
            picture: picture,
            date: time,
            exactDate: Date.parse(newMessage.createdAt),
            username: newMessage.user.username,
            userID: newMessage.user.id,
            sentByUser: false,
            delivered: true,
            read: [route.params.user.id],
        }
        //console.log(data)
        if (reverse) {
            reverseMakeMessage(message);
        } else {
            makeMessage(message);
        }
        //console.log(data)
    }
    const reverseMakeMessage = (message) => {
        if (dataRef.current.length > 0 && message.type == "Regular") {
            if (dataRef.current[dataRef.current.length - 1].userID != message.userID ||
                !dataRef.current[dataRef.current.length - 1].content ||
                dataRef.current[dataRef.current.length - 1].exactDate - message.exactDate > 1000 * 60 * 60 * 2 // only add to end if less than 2 hours apart. 
            ) {
                dataRef.current.push(message);
            } else {

                dataRef.current[dataRef.current.length - 1].content = message.content + "\n" + dataRef.current[dataRef.current.length - 1].content ;
            }
        } else {
            dataRef.current.push(message);
        }
        setData(dataRef.current.concat());
    }

    const makeMessage = (message) => {
        var length = dataRef.current.length;
        if (dataRef.current.length > 0 && message.type == "Regular") {
            if (dataRef.current[0].userID != message.userID ||
                !dataRef.current[0].content ||
                dataRef.current[0].exactDate - message.exactDate > 1000 * 60 * 60 * 2 // only add to end if less than 2 hours apart. 
            ) {
                length = dataRef.current.unshift(message);
            } else {
                dataRef.current[0].content = dataRef.current[0].content + "\n" + message.content;
                dataRef.current[0].date = message.date;
                dataRef.current[0].exactDate = message.exactDate;
            }
        } else {
            length = dataRef.current.unshift(message);
        }
        setData(dataRef.current.concat());
        return length;
    }

    const updateMessage = (index, newMessage) => {
        console.log(index);
        dataRef.current[index] = {
            ...newMessage,
            content: dataRef.current[index].content
        };
        setData(dataRef.current.concat());
    }

    const sendMessage = async () => {
        try {
            
            const type = "Regular";
            const tempID = "" + route.params.id + route.params.user.id + Date.now().toString();
            const content = msg;
            msgRef.current.clear();
            setMsg("");
            const message = {
                id: tempID,
                content: ""+content,
                username: route.params.user.username,
                userID: route.params.user.id,
                picture: route.params.user.profilePicture.loadFull,
                type: type,
                date: "...",
                sentByUser: true,
                delivered: false,
                read: [route.params.user.id]
            }
            //if (debug) console.log("SENDING...");
            const messageLength = makeMessage(message);
            var index = 0;
            if (data.length == 0) {
                index = 100;
            }
            const newMessage = await API.graphql(graphqlOperation(createMessage, {
                input: {
                    userMessagesId: route.params.user.id,
                    chatMessagesId: route.params.id,
                    content: "" + content,
                    type: type,
                    read: [route.params.user.id],
                    index: index,
                }
            }))
            //if disconnected don't update.
            if (newMessage) {
                const index = dataRef.current.length - messageLength;
                const msg = {
                    ...message,
                    id: newMessage.data.createMessage.id,
                    sentByUser: true,
                    exactDate: Date.now(),
                    date: "now",
                    delivered: true,
                    read: [route.params.user.id],
                }
                updateMessage(index,msg)
                //if (debug) console.log("SENT!");
                //if (debug) console.log(data);
            }
            //if (debug) console.log(data);
        } catch (error) {
            if (debug) console.log(error);
        }
    }

    const sendImage = async () => {
        try {
            const type = "Image";
            const ID = uuid.v4();
            const image = selectedImage;
            removeImage();
            const message = {
                id: ID,
                type: type,
                image: {
                    uri: image,
                    local: true,
                    loadImage: image,
                    key: "FULLMESSAGE" + ID
                }, //This should be a image object with full and loadFull. In this case, we haven't made a load full yet.
                username: route.params.user.username,
                userID: route.params.user.id,
                picture: route.params.user.profilePicture.loadFull,
                date: "...",
                sentByUser: true,
                delivered: false,
                read: [route.params.user.id]
            }
            //if (debug) console.log("SENDING...");
            const messageLength = makeMessage(message);
            var index = 0;
            if (data.length == 0) {
                index = 100;
            }
            const response = await fetch(selectedImage);
            if (response) {
                const img = await response.blob();
                if (img) {
                    await Storage.put("FULLMESSAGE"+ID+".jpg", img);
                }
            }

            const newMessage = await API.graphql(graphqlOperation(createMessage, {
                input: {
                    id: ID,
                    userMessagesId: route.params.user.id,
                    chatMessagesId: route.params.id,
                    image: {
                        bucket: "proxychatf2d762e9bc784204880374b0ca905be4120629-dev",
                        region: "us-east-2",
                        full: "FULLMESSAGE" + ID + ".jpg",
                        loadFull: "LOADFULLMESSAGE" + ID + ".jpg"
                    },
                    type: type,
                    read: [route.params.user.id],
                    index: index,
                }
            }))
            if (newMessage) {
                const index = dataRef.current.length - messageLength;
                const msg = {
                    ...message,
                    sentByUser: true,
                    exactDate: Date.now(),
                    date: "now",
                    delivered: true,
                    read: [route.params.user.id],
                }
                updateMessage(index, msg)
            }
        } catch (error) {
            console.warn(error);
        }
    }

    const tokenExists = (token) => {
        if (token != null) {
            if (token != "i1" && token != "i2") {
                return true;
            }
        }
        return false;
    }

    const getMessages = async (New) => {
        try {
            if ((nextToken.current != lastToken.current)) {
                if (New || tokenExists(nextToken.current)) {
                    //setRefresh(true);
                    var token;
                    if (New) {
                        dataRef.current = [];
                        setData([]);
                    }
                    token = nextToken.current
                    const messages = await API.graphql(graphqlOperation(listMessagesByTime, {
                        chatMessagesId: route.params.id,
                        nextToken: tokenExists(token) ? token : null,
                        limit: 18
                    }));
                    if (connected) {
                        for (var i = 0; i < messages.data.listMessagesByTime.items.length; i++) {
                            await appendMessages(messages.data.listMessagesByTime.items[i], true);
                        }
                        //console.log(messages.data.listMessagesByTime.items);
                        lastToken.current = nextToken.current;
                        nextToken.current = messages.data.listMessagesByTime.nextToken;  
                    }
                    //setRefresh(false);
                }
            }
        } catch (error) {
            if (debug) console.log(error);
        }
    }

    const getPickerPerms = async () => {
        try {
            await ImagePicker.requestMediaLibraryPermissionsAsync();
        } catch (error) {
            console.warn(error);
        }
    }

    const selectImage = async () => {
        try {
            const perms = await ImagePicker.getMediaLibraryPermissionsAsync();
            if (!perms.granted) {
                Alert.alert("No Permsision", "We don't have access to your Camera Roll.", [
                    {
                        text: "Give Access",
                        onPress: ()=> getPickerPerms(),
                    },
                    {
                        text: "Cancel",
                    }
                ]);
                return;
            } else if (perms.granted) {
                const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: "Images",
                    aspect: [4, 3],
                    quality: 1,
                });
                if (result) {
                    if (result.cancelled) {
                        return;
                    } else {
                        setSelectedImage(result.uri);
                        setMsgIsImage(true);
                    }
                } else {
                    Alert.alert("Error", "Some kind of error happened. Try again.");
                }
            }

        } catch (error) {
            console.warn(error);
        }
        //const cameraRollStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
        //if (cameraRollStatus.granted) {
        //    const result = await ImagePicker.launchImageLibraryAsync({
        //        mediaTypes: "Images",
        //        aspect: [4, 3],
        //        quality: 1,
        //    })
        //    await uploadImage(result);
        //} else {
        //    Alert.alert("No Permsision");
        //}
    }

    const removeImage = () => {
        setMsgIsImage(false);
        setSelectedImage("");
    }
    const longPressText = (event) => {
        if (event.nativeEvent.state === State.ACTIVE) {
            console.log("LONG PRESS")
        }
    }
    const renderItem = React.useCallback(({ item, index }) => {
        if (item.type == "Image") {
            return (
                    <View style={{ margin: 6, marginBottom: index == 0 ? 34 : 10 }}>
                        <ImageMessage
                            ppic={{
                                uri: item.picture,
                                loadImage: item.picture,
                            }}
                            onPress={() => {
                                setPreviewImage(item.image.uri);
                                setShowPreviewImage(true);
                            }}
                            time={item.date}
                            username={item.username}
                            source={item.image}
                        />
                    </View>
            )
        } else {
            return (
                <LongPressGestureHandler
                    onHandlerStateChange={(event)=>longPressText(event)}
                    minDurationMs={800}
                > 
                <View style={{ margin: 6, marginBottom: index == 0 ? 34 : 10 }}>
                    <ComplexMessage
                        ppic={{
                            uri: item.picture,
                            loadImage: item.picture,
                        }}
                        time={item.date}
                        username={item.username}
                        message={item.content}
                    />
                    </View>
                </LongPressGestureHandler>
            )
        }
        
    }, [data]);
    const keyExtractor = React.useCallback((item) => item.id, []);
    const onEndReached = React.useCallback(() => getMessages(false), []);
    const openCamera = React.useCallback(() => console.log("Open Camera"), []);
    const openPhotos = React.useCallback(() => selectImage(), []);
    const footerComponent = React.useCallback(() => {
        if (data.length > 0 && tokenExists(nextToken.current)) {
            return (
                <View style={styles.refresh}>
                    <ActivityIndicator color={colors.pBeam} size="small" />
                </View>
            )
        } if (data.length > 0 && !tokenExists(nextToken.current)) {
            return (
                <>
                    <View style={{ alignItems: "center", justifyContent: "center", marginTop: 14 }}>
                        <BeamTitle size={18}>Begining of Chat</BeamTitle>
                        <SubTitle size={14}>Say Something in {route.params.name}</SubTitle>
                        <SubTitle color={colors.text3}>Created on {route.params.created}</SubTitle>
                    </View>
                    <DarkBeam
                        style={{
                            backgroundColor: colors.container,
                            height: 1,
                            marginBottom: 4,
                            marginTop: 10,
                        }}
                    />
                </>    
            )
        }

    })
    //const onFocus = React.useCallback(async () => {
    //    if (debug) console.log("Focus")
    //    setTimeout(async function () {
    //        chatsRef.current.scrollToEnd()
    //    }, 40);
    //}, []);
    return (
        <Screen innerStyle={styles.page}>

            <>
            <KeyboardAvoidingView style={{ flex: 1, justifyContent: "flex-end" }} behavior="padding" keyboardVerticalOffset={headerHeight+4}>
                <View style={styles.chats}>
                    <KeyboardAwareFlatList
                        data={data}
                        ref={chatsRef}
                        ListFooterComponent={footerComponent}
                        inverted={true}
                        extraData={data}
                        keyExtractor={keyExtractor}
                        onEndReached={onEndReached}
                        renderItem={renderItem}
                    />

                </View>
                    <DarkBeam style={styles.darkBeam} />
                    <View style={[styles.textBox, { alignItems: msgIsImage ? "flex-start" : "flex-end" }]}>
                    <IconButton
                        icon="camera"
                        brand="Ionicons"
                        color={colors.text3}
                        style={{ marginBottom: 6 }}
                        size={34}
                        onPress={openCamera}
                    />
                    <View style={{width: 10} } />
                    <IconButton
                        icon="add-circle"
                        brand="Ionicons"
                        color={colors.text3}
                        size={34}
                        style={{ marginBottom: 6, }}
                        onPress={openPhotos}
                        />
                        {!msgIsImage &&
                            <SimpleInput
                                reference={msgRef}
                                placeholder="Say something"
                                
                                cStyle={{ overflow: "hidden", flex: 1, }}
                                tStyle={styles.message}
                                multiline={true}
                                maxLength={300}
                                keyboardAppearance="dark"
                                onChangeText={(text) => {
                                    setMsg(text);
                                }}
                            />
                        }
                        {msgIsImage &&
                            <>                            
                            <ImageInput pic={selectedImage} onDisable={() => removeImage()} />
                            </>
                        }
                    <IconButton
                        icon="arrow-forward-circle"
                        brand="Ionicons"
                        color={
                            ((msg.length >= 1 || msgIsImage) && connected) ? colors.pBeam : colors.pBeamDisabled
                        }
                        disabled={((msg.length >= 1 || msgIsImage) ? false : true) || (!connected)}
                        size={34}
                        style={styles.sendButton}
                        onPress={() => {
                            if (msgIsImage) {
                                sendImage();
                            } else {
                                sendMessage()
                            }
                        }}
                    />
                </View>
                </KeyboardAvoidingView>
                {!connected &&

                    <NoConnectionAlert visible={!connected} />
                }
                <ImageView
                    images={[
                        {
                            uri: previewImage
                        }
                    ]}
                    imageIndex={0}
                    visible={showPreviewImage}
                    onRequestClose={()=>setShowPreviewImage(false)}
                />
            </>

        </Screen>
    );
}

const styles = StyleSheet.create({
    message: {
        paddingVertical: 10,
        paddingTop: 10,
        maxHeight: 120,
    },
    chats: {
        justifyContent: "flex-start",
        flex: 1
    },
    page: {
        justifyContent: "flex-end",
    },
    sendButton: {
        ...css.beamShadow,
        shadowColor: colors.pBeamShadow,
        marginBottom: 6,
    },
    textBox: {
        flexDirection: "row",
        marginHorizontal: 10,
        alignItems: "flex-end",
    },
    darkBeam: {
        backgroundColor: colors.container,
        height: 1,
        marginBottom: 4,
        marginTop: 0,
        ...css.beamShadow,
        shadowColor: "black"
    },
    refresh: {
        margin: 10
    },


})

export default ChatPage;