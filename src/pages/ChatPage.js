import React from 'react';
import { StyleSheet, Image, ActivityIndicator, Alert, FlatList, View, KeyboardAvoidingView, Keyboard } from 'react-native';
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
    updateTyping,
    createMessage,
    onReceiveMessage,
    updateMessage as UpdateMessage,
    onUserTyping,
    getMemberStatuses
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
import ProfileCircle from '../comps/SpinningProfileCircle';
import { LongPressGestureHandler, State } from 'react-native-gesture-handler';
import { useFocusEffect } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';

//DESCRIPTION: A primary page of the SecondaryNav
//             is the hub for all localized chats


function ChatPage({ route, navigation }) {
    const headerHeight = useHeaderHeight();

    const members = React.useRef([]);
    const [Members, setMembers] = React.useState([]);

    const msgRef = React.useRef();
    const [msg, setMsg] = React.useState("");
    const [msgIsImage, setMsgIsImage] = React.useState(false);
    const [selectedImage, setSelectedImage] = React.useState("");
    const [showPreviewImage, setShowPreviewImage] = React.useState(false);
    const [previewImage, setPreviewImage] = React.useState("");

    const typingRef = React.useRef();

    const chatsRef = React.useRef();
    const dataRef = React.useRef([]);
    const [data, setData] = React.useState([]);
    const userMap = React.useRef(new Map());

    const nextToken = React.useRef("i2");
    const lastToken = React.useRef("i1");
    const userPresent = React.useRef(true);
    const [connected, setConnected] = React.useState(true);

    const [buttonsMinimized, minimizeButtons] = React.useState(false);

    const [reload, setReload] = React.useState(false);

    var runthrough = 0;
    React.useEffect(() => {
        var priorState = ConnectionState.Disconnected;
        const connectionSub = NetInfo.addEventListener(state => {
            if (runthrough > 0) {
                setConnected(state.isConnected && state.isInternetReachable);
            }
            //Could make this problematic if need be
        });
        var sub = API.graphql(graphqlOperation(onReceiveMessage, {
            chatMessagesId: route.params.id
        })).subscribe({
            next: ({ value }) => { if (route.params.user.id != value.data.onReceiveMessage.user.id) appendMessages(value.data.onReceiveMessage); readMessage(value.data.onReceiveMessage) },
            error: (error) => {setReload(!reload)}
        })
        var typingSub = API.graphql(graphqlOperation(onUserTyping, {
            chatID: route.params.id,
        })).subscribe({
            next: ({ value }) => { handleTyping(value) },
            error: (error) => {setReload(!reload)}
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
                    next: ({ value }) => { appendMessages(value.data.onReceiveMessage); readMessage(value.data.onReceiveMessage) },
                    error: (error) => { setReload(!reload) }
                });
                typingSub.unsubscribe();
                typingSub = API.graphql(graphqlOperation(onUserTyping, {
                    chatID: route.params.id,
                })).subscribe({
                    next: ({ value }) => { handleTyping(value) },
                    error: (error) => { setReload(!reload) }
                });
                getMessages(true);
            }
            priorState = payload.message;
        })

        const timeClock = setInterval(() => updateTime(), 10000) 
        runthrough++;
        return () => {
            hub();
            clearInterval(timeClock);
            sub.unsubscribe();
            typingSub.unsubscribe();
            connectionSub();
        }
    }, [reload]);

    const readMessage = async (msg) => {
        var newRead = msg.read;
        newRead.push(route.params.user.id);
        await API.graphql(graphqlOperation(UpdateMessage, {
            input: {
                id: msg.id,
                read: newRead
            }
        }))
    }

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
            } catch (error) {
                if (debug) console.warn(error);
            }
        }
        initialFunction();
    }, []);

    useFocusEffect(React.useCallback(() => {
        userPresent.current = true
        return () => {
            userPresent.current = false
            setTimeout(function () {
                stopTyping();
            }, 1000);
        }
    },[]))


    const appendMessages = async (newMessage, reverse = false) => {
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
            minimizeButtons(false);
            stopTyping();
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
            }

        } catch (error) {
            if (debug) console.log(error);
        }
    }

    const sendImage = async () => {
        try {
            minimizeButtons(false);
            stopTyping();
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

                    const userStatuses = await API.graphql(graphqlOperation(getMemberStatuses, {
                        ChatID: route.params.id
                    }));
                    for (var i = 0; i < userStatuses.data.getChat.members.items.length; i++) {
                        if (userStatuses.data.getChat.members.items[i].user.id != route.params.user.id) {
                            const loc = members.current.findIndex((el) => el.user.id == userStatuses.data.getChat.members.items[i].user.id);
                            if (loc != -1) {
                                members.current[loc].status = userStatuses.data.getChat.members.items[i].status;
                            } else {
                                const picture = await Storage.get(userStatuses.data.getChat.members.items[i].user.profilePicture.loadFull);
                                userStatuses.data.getChat.members.items[i].user.picture = picture;
                                members.current.push(userStatuses.data.getChat.members.items[i]);
                            }
                        }
                    }
                    setMembers(members.current);

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
    const getCameraPerms = async () => {
        try {
            await ImagePicker.requestCameraPermissionsAsync();
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

    }


    const takeImage = async () => {
        try {
            const perms = await ImagePicker.getCameraPermissionsAsync();
            if (!perms.granted) {
                Alert.alert("No Permsision", "We don't have access to your Camera.", [
                    {
                        text: "Give Access",
                        onPress: () => getCameraPerms(),
                    },
                    {
                        text: "Cancel",
                    }
                ]);
                return;
            } else if (perms.granted) {
                const result = await ImagePicker.launchCameraAsync();
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
    }

    const removeImage = () => {
        setMsgIsImage(false);
        setSelectedImage("");

    }

    const longPressText = async (event, item) => {
        if (event.nativeEvent.state === State.ACTIVE) {
            await Clipboard.setStringAsync(item.content);
        }
    }

    const stopTyping = async () => {
        try {
            await API.graphql(graphqlOperation(updateTyping, {
                input: {
                    id: route.params.userChatMembersID,
                    status: 0
                }
            }));
        } catch (error) {

        }
    }
    const UpdateTyping = async (text) => {
        try {
            if (text.length >= 1 && userPresent.current) {
                await API.graphql(graphqlOperation(updateTyping, {
                    input: {
                        id: route.params.userChatMembersID,
                        status: 4
                    }
                }));

            } else {
                stopTyping();
            }
        } catch (error) {

        }
    }
    const handleTyping = async (data) => {
        try {
            if (data.data.onUserTyping.user.id != route.params.user.id) {
                const loc = members.current.findIndex((el) => el.user.id == data.data.onUserTyping.user.id);
                if (loc != -1) {
                    members.current[loc].status = data.data.onUserTyping.status;
                } else {
                    const picture = await Storage.get(data.data.onUserTyping.user.profilePicture.loadFull);
                    data.data.onUserTyping.user.picture = picture;
                    members.current.push(data.data.onUserTyping);
                }
                setMembers(members.current);
                setReload(!reload)
            } 
        } catch (error) {
            if (debug) console.log(error);
        }
    }

    React.useEffect(() => {
        typingRef.current?.reset()
    })

    const renderItem = React.useCallback(({ item, index }) => {
        if (item.type == "Image") {
            return (
                    <View style={{ margin: 6, marginBottom: 10 }}>
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
                    onHandlerStateChange={(event)=>longPressText(event,item)}
                    minDurationMs={800}
                > 
                <View style={{ margin: 6, marginBottom: 10 }}>
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
    const openCamera = React.useCallback(() => takeImage(), []);
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

    const headerComponent = () => (
        <View style={styles.typeContainer}>
            <FlatList
                data={Members}

                showsHorizontalScrollIndicator={false}
                keyExtractor={keyExtractor}
                horizontal={true}
                renderItem={renderTypeItem}
            />
        </View>    
    )


    const renderTypeItem = ({item }) => {
        if (item.status == 4) {
            return (
                <View style={styles.ppContain}>
                    <ProfileCircle
                        Ref={typingRef}
                        ppic={{
                            uri: item.user.picture,
                            loadImage: item.user.picture,
                        }} />
                </View>
            )
        }
    };

    return (
        <Screen innerStyle={styles.page}>


            <KeyboardAvoidingView style={{ flex: 1, justifyContent: "flex-end" }} behavior="padding" keyboardVerticalOffset={headerHeight + 4}>
                <View style={styles.chats}>
                    <FlatList
                        data={data}
                        ref={chatsRef}
                        ListFooterComponent={footerComponent}
                        ListHeaderComponent={headerComponent}
                        inverted={true}
                        extraData={data}
                        keyExtractor={keyExtractor}
                        onEndReached={onEndReached}
                        renderItem={renderItem}
                        keyboardShouldPersistTaps="always"
                    />

                </View>

                <DarkBeam style={styles.darkBeam} />
                    <View style={[styles.textBox, { alignItems: msgIsImage ? "flex-start" : "flex-end" }]}>
                        {!(buttonsMinimized || msgIsImage) &&
                            <>
                                <IconButton
                                    icon="camera"
                                    brand="Ionicons"
                                    color={colors.text3}
                                    style={{ marginBottom: 6 }}
                                    size={34}
                                    onPress={openCamera}
                                    />
                                <View style={{ width: 10 }} />
                                <IconButton
                                    icon="duplicate"
                                    brand="Ionicons"
                                    color={colors.text3}
                                    size={34}
                                    style={{ marginBottom: 6, }}
                                    onPress={openPhotos}
                                />
                                <View style={{ width: 10 }} />
                                <IconButton
                                    icon="md-chevron-down-circle"
                                    brand="Ionicons"
                                    color={colors.text3}
                                    style={{ marginBottom: 6 }}
                                    size={34}
                                    onPress={()=>Keyboard.dismiss()}
                                />
                            </>
                        }
                        {buttonsMinimized &&
                            <IconButton
                                icon="md-chevron-forward-circle"
                                brand="Ionicons"
                                color={colors.text3}
                                style={{ marginBottom: 6 }}
                                size={34}
                                onPress={() => minimizeButtons(false)}
                            />
                        }
                        {!msgIsImage &&
                            <SimpleInput
                                reference={msgRef}
                                placeholder="Say something"
                                onFocus={() => {
                                    chatsRef.current.scrollToOffset({ offset: 0 });
                                }}
                                onPressIn={() => {
                                    chatsRef.current.scrollToOffset({ offset: 0 });
                                } }
                                cStyle={{ overflow: "hidden", flex: 1, }}
                                tStyle={styles.message}
                                multiline={true}
                                maxLength={300}
                                keyboardAppearance="dark"
                                onChangeText={(text) => {
                                    setMsg(text);
                                    UpdateTyping(text);
                                    if (text.length >= 15 && text.length % 5 == 0) {
                                        if (!buttonsMinimized) {
                                            minimizeButtons(true);
                                        }
                                    } else if (text.length <= 14) {
                                        if (buttonsMinimized) {
                                            minimizeButtons(false);
                                        }
                                    }
                                }}
                            />
                        }
                        {msgIsImage &&
                            <>                            
                            <ImageInput pic={selectedImage} onDisable={() =>  removeImage() } />
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
    ppContain: {
        justifyContent: "center",
        paddingVertical: 4,
        marginBottom: 0
    },
    typeContainer: {
        marginBottom: -6,
        marginLeft: 4,
        height: 60
    }


})

export default ChatPage;