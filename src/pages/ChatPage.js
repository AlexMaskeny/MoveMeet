import React from 'react';
import { StyleSheet, Image, ActivityIndicator, Alert, FlatList, View, KeyboardAvoidingView, RefreshControl } from 'react-native';
import { API, Auth, graphqlOperation, Storage } from 'aws-amplify';
import { listMessagesByTime, getUser, getMessage, createMessage } from '../api/calls';
import { useHeaderHeight } from '@react-navigation/elements';
import * as ImagePicker from 'expo-image-picker';

import IconButton from '../comps/IconButton';
import {colors,css,debug, timeLogicNoAgo } from '../config'
import Screen from '../comps/Screen';
import SimpleButton from '../comps/SimpleButton';
import SimpleInput from '../comps/SimpleInput';
import DarkBeam from '../comps/DarkBeam';
import Beam from '../comps/Beam';
import ComplexMessage from '../comps/ComplexMessage';
import BeamTitle from '../comps/BeamTitle';
import SubTitle from '../comps/SubTitle';

//DESCRIPTION: A primary page of the SecondaryNav
//             is the hub for all localized chats


function ChatPage({ route, navigation }) {
    const [msg, setMsg] = React.useState("");
    const msgRef = React.useRef();
    const chatsRef = React.useRef();
    const headerHeight = useHeaderHeight();
    const [data, setData] = React.useState([]);
    const [ready, setReady] = React.useState(false);
    const [refresh, setRefresh] = React.useState(false);
    const nextToken = React.useRef();
    const lastToken = React.useRef();

    //React.useEffect(() => {
    //    const unsubscribe = navigation.addListener('transitionEnd', () => {
    //        msgRef.current.focus();
    //    })
    //    return unsubscribe;
    //}, [navigation])
    const getMessages = async () => {
        try {
            const now = Date.now();
            var token;
            if ((nextToken.current != lastToken.current) || !ready) {
                token = nextToken.current
                const messages = await API.graphql(graphqlOperation(listMessagesByTime, {
                    chatMessagesId: route.params.id,
                    nextToken: token ? token : null,
                    limit: 12
                }));
                var newData = data;
                for (i = 0; i < messages.data.listMessagesByTime.items.length; i++) {
                    const user = await API.graphql(graphqlOperation(getUser, {
                        id: messages.data.listMessagesByTime.items[i].userMessagesId
                    }));
                    var picture;
                    if (user.data.getUser.profilePicture.loadFull) {
                        picture = await Storage.get(user.data.getUser.profilePicture.loadFull);
                    }
                    const date = timeLogicNoAgo((now - Date.parse(messages.data.listMessagesByTime.items[i].createdAt)) / 1000);
                    newData.push({
                        ...messages.data.listMessagesByTime.items[i],
                        username: user.data.getUser.username,
                        picture: picture,
                        date: date
                    });
                }
                lastToken.current = nextToken.current;
                nextToken.current = messages.data.listMessagesByTime.nextToken;  
                setData(newData);
            }
        } catch (error) {
            if (debug) console.log(error);
        }
    }

    React.useEffect(() => {
        const initialFunction = async () => {
            try {
                //setReady(false);
                //await getMessages();
                setReady(true);
            } catch (error) {
                if (debug) console.log(error);
            }
        }
        initialFunction();
    }, [])

    const selectImage = async () => {
        const cameraRollStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (cameraRollStatus.granted) {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: "Images",
                aspect: [4, 3],
                quality: 1,
            })
            await uploadImage(result);
        } else {
            Alert.alert("No Permsision");
        }
    }
    const uploadImage = async (pickerResult) => {
        try {
            if (pickerResult.cancelled) {
                return
            } else {
                const response = await fetch(pickerResult.uri);
                const img = await response.blob();
                
                const result = await Storage.put("Alexander.jpg", img);
                if (debug) console.log(result);
            }
        } catch (error) {
            if (debug) console.log(error);
        }
    }
    const makeMessage = (message) => {
        var tempData = data;
        const length = tempData.unshift({
            ...message,
            sentByUser: true,
            delivered: false,
            read: false,
        });
        setData(tempData.concat());

        return length;
    }

    const updateMessage = (index, newMessage) => {
        var tempData = Array.from(data);
        tempData[index] = newMessage;
        setData(tempData.concat());
    }

    const sendMessage = async () => {
        try {
            const type = "Regular";
            const tempID = "" + route.params.id + route.params.user.id + Date.now().toString();
            const content = msg;
            msgRef.current.clear();
            const message = {
                id: tempID,
                content: ""+content,
                username: route.params.user.username,
                picture: route.params.user.profilePicture.loadFull,
                date: "..."
            }
            if (debug) console.log("SENDING...");
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
                    index: index,
                }
            }))
            if (newMessage) {
                const index = data.length - messageLength;
                updateMessage(index,{
                    ...message,
                    id: newMessage.data.createMessage.id,
                    sentByUser: true,
                    date: "now",
                    delivered: true,
                    read: false,
                })
                if (debug) console.log("SENT!");
                //if (debug) console.log(data);
            }
            //if (debug) console.log(data);
        } catch (error) {
            if (debug) console.log(error);
        }
    }

    const renderItem = React.useCallback(({ item, index }) => {
        if (ready) {
            return (
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
            )
        }
    }, [data]);
    const keyExtractor = React.useCallback((item) => item.id, []);
    const onEndReached = React.useCallback(() => console.log("END!"), []);
    const openCamera = React.useCallback(() => console.log("Open Camera"), []);
    const openPhotos = React.useCallback(() => console.log("Open Photos"), []);
    const footerComponent = React.useCallback(() => {
        if (data.length > 0) {
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
            <KeyboardAvoidingView style={{ flex: 1, justifyContent: "flex-end" }} behavior="padding" keyboardVerticalOffset={headerHeight+4}>
                <View style={styles.chats}>
                    <FlatList
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
                <View style={styles.textBox}>
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
                            //console.log(msg);
                        }}
                    />
                    <IconButton
                        icon="arrow-forward-circle"
                        brand="Ionicons"
                        color={colors.pBeam}
                        disabled={msg.length == 0 ? true : false}
                        size={34}
                        style={styles.sendButton}
                        onPress={() => sendMessage()}
                    />
                </View>
            </KeyboardAvoidingView>


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
    }

})

export default ChatPage;