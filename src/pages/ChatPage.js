import React, { useCallback, useRef, useState, useEffect } from 'react';
import { StyleSheet, ActivityIndicator, FlatList, View, KeyboardAvoidingView, Keyboard, Platform, Alert } from 'react-native'
import { useHeaderHeight } from '@react-navigation/elements';
import { useNetInfo } from '@react-native-community/netinfo';
import uuid from "react-native-uuid";
import { Storage } from 'aws-amplify';
import { useFocusEffect } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import ImageView from 'react-native-image-viewing';

import Screen from '../comps/Screen';
import IconButton from '../comps/IconButton';
import { colors } from '../config'
import SimpleInput from '../comps/SimpleInput';
import ComplexMessage from '../comps/ComplexMessage';
import BeamTitle from '../comps/BeamTitle';
import SubTitle from '../comps/SubTitle';
import ImageInput from '../comps/ImageInput';
import ImageMessage from '../comps/ImageMessage';
import ProfileCircle from '../comps/SpinningProfileCircle';
import * as logger from '../functions/logger';
import * as media from '../functions/media';
import * as timeLogic from '../functions/timeLogic';
import { calls, mmAPI } from '../api/mmAPI';


//Now we just need to incorperate a nolongermember alert
export default function ChatPage({ route, navigation }) {
    const headerHeight = useHeaderHeight();
    
    const textInputRef = useRef();
    const lastToken = useRef("i1");
    const chatListRef = useRef();

    const timeClockSub = useRef();
    const messageReceptionSub = useRef();
    const nonUserMemberSub = useRef();
    const userMemberSub = useRef();
    const subSafeSub = useRef();
    const memberStatusTracker = useRef(new Map);

    const [nextToken, setNextToken] = useState("i2");
    const [noLongerMember, setNoLongerMember] = useState(false);
    const [textInput, setTextInput] = useState("");
    const [data, setData] = useState([]);
    const [showPreviewImage, setShowPreviewImage] = useState(false);
    const [previewImage, setPreviewImage] = useState("");
    const [selectedImage, setSelectedImage] = useState("");
    const [selectedSmallImage, setSelectedSmallImage] = useState("");
    const [msgIsImage, setMsgIsImage] = useState(false);
    const [rerender, setRerender] = useState(false);
    const [members, setMembers] = useState([]); //use a timeclock to maintain membership
    const [buttonsMinimized, setButtonsMinimized] = useState(false);

    const netInfo = useNetInfo();

    //SIMPLY TO MAKE THE HEADERBUTTON WORK
    useEffect(() => {
        navigation.setOptions({
            title: route.params.name,
            headerLeft: () => (
                <IconButton
                    icon="ios-chevron-back-outline"
                    color={colors.pBeamBright}
                    brand="Ionicons"
                    size={36}
                    onPress={() => navigation.goBack()}
                />
            )
        })
    }, [navigation, route])

    //INITIALIATION & SUBSCRIPTION HANDLING
    useFocusEffect(useCallback(() => {
        Notifications.setNotificationHandler({
            handleNotification: async (notification) => ({
                shouldShowAlert: notification.request.content.data.chatID == route.params.id ? false : true,
                shouldPlaySound: false,
                shouldSetBadge: false,
            }),
        });
        try {
            subSafeSub.current();
            logger.eLog("[SUBMANAGER] ChatPage subSafe subscription closed");
        } catch (error) { logger.eLog("The sub safe has yet to be enabled.") }
        if (timeClockSub.current) clearInterval(timeClockSub.current);
        timeClockSub.current = setInterval(updateTime, 10000);
        logger.eLog("[SUBMANAGER] ChatPage timeClock subscription open.");

        //MESSAGE RECEPTION
        logger.eLog("[SUBMANAGER] ChatPage messageReception subscription open.");
        if (messageReceptionSub.current) messageReceptionSub.current.unsubscribe();
        messageReceptionSub.current = mmAPI.subscribe({
            call: calls.ON_RECEIVE_MESSAGE,
            instance: "chatPage",
            input: {
                chatMessagesId: route.params.id,
            },
            sendData: true,
            onReceive: (data) => {
                if (data.user.id !== route.params.user.id) {
                    clearTimeout(memberStatusTracker.current.get(data.user.id));
                    memberStatusTracker.current.delete(data.user.id);
                    setMembers(existingMembers => {
                        return existingMembers.filter(Member => Member.id !== data.user.id);
                    })

                    let message = data;
                    message.createdAt = Date.parse(message.createdAt);
                    addMessage(message);
                    readMessage(message);
                }
            },
            onError: (error) => {
                if (messageReceptionSub.current) messageReceptionSub.current.unsubscribe();
                logger.warn(error);
                logger.eWarn("[SUBMANAGER]: Error detected receiving a message notification. Reconnecting...");
            }

        });

        //MEMBER MANAGEMENT FOR TYPING
        logger.eLog("[SUBMANAGER] ChatPage nonUserMember subscription open.");
        if (nonUserMemberSub.current) nonUserMemberSub.current.unsubscribe();
        if (memberStatusTracker.current.size > 0) memberStatusTracker.current.clear();
        nonUserMemberSub.current = mmAPI.subscribe({
            call: calls.ON_USER_TYPING,
            instance: "full",
            input: {
                chatID: route.params.id
            },
            sendData: true,
            onReceive: (data) => {
                if (data.user.id != route.params.user.id && data.status == 4) {

                    setMembers(existingData => {
                        const existingMember = existingData.findIndex((el) => el.id == data.user.id);
                        var member = data;
                        getProfilePicture(member);
                        if (existingMember == -1) {
                            existingData = [...existingData, { id: member.user.id, picture: member.picture }];
                            memberStatusTracker.current.set(member.user.id, setTimeout(() => {
                                setMembers(existingMembers => {
                                    memberStatusTracker.current.delete(member.user.id);
                                    return existingMembers.filter(Member => Member.id != member.user.id)
                                })
                            }, 4000));
                            return [...existingData];
                        } else {
                            clearTimeout(memberStatusTracker.current.get(member.user.id))
                            memberStatusTracker.current.set(member.user.id, setTimeout(() => {
                                setMembers(existingMembers => {
                                    memberStatusTracker.current.delete(member.user.id);
                                    return existingMembers.filter(Member => Member.id != member.user.id)
                                })
                            }, 4000));
                            return existingData;
                        }
                        return [];
                    });
                }
            },
            onError: (error) => {
                if (nonUserMemberSub.current) nonUserMemberSub.current.unsubscribe();
                logger.warn(error);
                logger.eLog("[SUBMANAGER]: Error detected receiving a chat member update in a ChatPage. Reconnecting...");
            }
        })

        //MEMBER MANAGEMENT TO DECIDE TO ALLOW USER TO CONTINUE
        logger.eLog("[SUBMANAGER] ChatPage userMember subscription open.");
        if (userMemberSub.current) userMemberSub.current.unsubscribe();
        userMemberSub.current = mmAPI.subscribe({
            call: calls.ON_USER_REMOVED,
            instance: "empty",
            input: {
                chatID: route.params.id,
                userID: route.params.user.id
            },
            onReceive: () => setNoLongerMember(!noLongerMember),
            onError: (error) => {
                if (userMemberSub.current) userMemberSub.current.unsubscribe();
                logger.warn(error);
                logger.eLog("[SUBMANAGER]: Error detected receiving a user status update in a ChatPage.");
           }
        })

        subSafeSub.current = mmAPI.subSafe(() => setRerender(!rerender));
        getMoreMessages({ initial: true });
        return () => {
            try {
                subSafeSub.current();
                logger.eLog("[SUBMANAGER] ChatPage subSafe subscription closed");
            } catch (error) { }
            try {
                clearInputs();
                setNoLongerMember(false);
                setNextToken("i2");
                lastToken.current = "i1"
            } catch { }
            try {
                clearInterval(timeClockSub.current);
                logger.eLog("[SUBMANAGER] ChatPage timeClock subscription closed.");
            } catch (error) { }
            try {
                messageReceptionSub.current.unsubscribe();
                logger.eLog("[SUBMANAGER] ChatPage messageReception subscription closed.");
            } catch (error) { }
            try {
                nonUserMemberSub.current.unsubscribe();
                logger.eLog("[SUBMANAGER] ChatPage nonUserMember subscription closed.");
            } catch (error) { }
            try {
                userMemberSub.current.unsubscribe();
                logger.eLog("[SUBMANAGER] ChatPage userMember subscription closed.")
            } catch (error) { }
            try {
                memberStatusTracker.current.forEach((value) => {
                    clearTimeout(value);
                    logger.eLog("[SUBMANAGER] A member that was typing was cleared from the array.");
                })
            } catch (error) { }
            try {
                Notifications.setNotificationHandler({
                    handleNotification: async (notification) => ({
                        shouldShowAlert: true,
                        shouldPlaySound: false,
                        shouldSetBadge: false,
                    }),
                });
            } catch (error) { }
        }
    }, [rerender, navigation, route]));

    const readMessage = async (message) => {
        if (message.read.includes(route.params.user.id)) return;
        try {
            await mmAPI.mutate({
                call: calls.UPDATE_MESSAGE,
                input: {
                    id: message.id,
                    read: [...message.read, route.params.user.id]
                }
            });
        } catch (error) {
            logger.warn("Error alerting server that user read message");
            logger.warn(error);
        }
    }

    //EXTRA / INITIAL DATA FUNCTIONS
    const tokenExists = ({ initial = false }) => {
        if (initial) return true;
        if (nextToken == null) return false;
        if (nextToken == "i2") return false;
        if (lastToken.current == nextToken) return false;
        return true;
    }
    const getMoreMessages = async ({ initial = false }) => {
        if (!netInfo.isConnected && !initial) return;
        if (!tokenExists({initial})) return;
        const token = initial ? null : nextToken;
        try {
            const messagesResponse = await mmAPI.query({
                call: calls.LIST_MESSAGES_BY_TIME,
                instance: "full",
                input: {
                    chatMessagesId: route.params.id,
                    nextToken: token,
                    limit: 18
                }
            })
            if (messagesResponse.items.length > 0) {
                lastToken.current = nextToken;
                setNextToken(messagesResponse.nextToken);
                var messages = [...messagesResponse.items];
                if (initial) readMessage(messages[0]);
                for (var i = 0; i < messages.length; i++) {
                    messages[i].createdAt = Date.parse(messages[i].createdAt);
                    messages[i].date = timeLogic.noAgo((Date.now() - messages[i].createdAt) / 1000);
                    await getProfilePicture(messages[i]);
                    if (messages[i].type == "Image") {
                        await getMessageImage(messages[i]);
                    }
                }
                setData((existingData) => {
                    if (initial) existingData = [];
                    for (var i = 0; i < messages.length; i++) {
                        if (existingData.length > 0) {
                            var nextMessage = existingData[existingData.length - 1];
                            if (nextMessage.user.id == messages[i].user.id && nextMessage.type == "Text" && messages[i].type == "Text" && nextMessage.createdAt - messages[i].createdAt < 1000 * 60 * 60 * 2) {
                                existingData[existingData.length - 1].createdAt = messages[i].createdAt;
                                existingData[existingData.length - 1].content = messages[i].content + "\n" + nextMessage.content;
                                existingData[existingData.length - 1].date = messages[i].date;
                            } else existingData.push(messages[i]);
                        } else existingData.push(messages[i]);
                    }
                    return [...existingData];
                })
            }
        } catch (error) {
            logger.warn("Error getting initial or more messages");
            logger.warn(error);
        }
    }

    //MUTATION FUNCTIONS
    const send = async () => {
        //RESETTING INPUT
        if (!netInfo.isConnected) {
            Alert.alert("Connection Problem", "It looks like you aren't connected to the internet. You must be to send messages.");
            return;
        }
        clearInputs();

        var message = {
            id: uuid.v4(),
            read: [route.params.user.id],
            createdAt: Date.now(),
            user: route.params.user,
            undelivered: true,
        }
        if (msgIsImage) { //SENDING IMAGE MESSAGE
            message = {
                ...message,
                type: "Image",
                content: "Sent an image",
                image: {
                    full: selectedImage,
                    fullKey: "FULLMESSAGE" + message.id + ".jpg",
                    loadFull: selectedImage,
                    disabled: true
                }
            }
        } else message = { ...message, type: "Text", content: textInput };
        var lengthAtCreation = data.length + 1;
        if (data.length > 0) if (data[0].user.id == message.user.id && data[0].type == "Text" && message.createdAt - data[0].createdAt < 1000 * 60 * 60 * 2) lengthAtCreation = data.length;
        addMessage(message);
        var image = {};
        if (msgIsImage) {
            image = {
                image: {
                    bucket: "proxychatf2d762e9bc784204880374b0ca905be4120629-dev",
                    region: "us-east-2",
                    full: "FULLMESSAGE" + message.id + ".jpg",
                    loadFull: "LOADFULLMESSAGE" + message.id + ".jpg",
            }}
        }
        try {
            const result = await mmAPI.mutate({
                call: calls.CREATE_MESSAGE,
                instance: "full",
                input: {
                    id: message.id,
                    userMessagesId: route.params.user.id,
                    chatMessagesId: route.params.id,
                    content: "" + message.content,
                    type: message.type,
                    read: message.read,
                    ...image
                }
            })
            if (message.type == "Image") {
                mmAPI.store("FULLMESSAGE" + message.id + ".jpg", selectedImage);
                mmAPI.store("LOADFULLMESSAGE" + message.id + ".jpg", selectedSmallImage);
            }
            if (result) {
                setData(existingData => {
                    existingData[existingData.length - lengthAtCreation].undelivered = false;
                    existingData[existingData.length - lengthAtCreation].date = timeLogic.noAgo((Date.now() - Date.parse(result.createdAt)) / 1000);
                    existingData[existingData.length - lengthAtCreation].createdAt = Date.parse(result.createdAt);
                    return [...existingData];
                })
            }
        } catch (error) {
            logger.warn("An error occured when sending a " + message.type + " message...");
            logger.warn(error);
        }
    }

    //GLOBAL HELPERS
    const getProfilePicture = async (message) => {
        var ppLoadFull = await Storage.get(message.user.profilePicture.loadFull);
        message.picture = {
            full: ppLoadFull,
            loadFull: ppLoadFull,
            fullKey: message.user.profilePicture.loadFull
        }
    }
    const getMessageImage = async (message) => {
        message.image.fullKey = message.image.full;
        message.image.loadFull = await Storage.get(message.image.loadFull);
        message.image.full = await Storage.get(message.image.full);
    }

    const clearInputs = () => {
        setTextInput("");
        setSelectedImage("");
        setMsgIsImage(false);
        setButtonsMinimized(false);
        textInputRef?.current?.clear();
    }

    //UPDATING CHATLIST FUNCTIONS
    const addMessage = async (data) => {
        try {
            var message = data;
            await getProfilePicture(message);

            //Resolving the datetime 
            if (message.undelivered) message.date = "..."; else message.date = timeLogic.noAgo((Date.now() - message.createdAt)/1000);

            //Setting the data
            if (message.type == "Image") { //ADD IMAGE MESSAGE
                await getMessageImage(message);
                setData(existingData => {
                    existingData.unshift(message);
                    return [...existingData];
                });
            } else {
                setData(existingData => {
                    if (existingData.length > 0) {
                        if (existingData[0].user.id == message.user.id && existingData[0].type == "Text" && message.createdAt - existingData[0].createdAt < 1000 * 60 * 60 * 2) {
                            existingData[0].content = existingData[0].content + "\n" + message.content;
                            existingData[0].created = message.createdAt;
                            existingData[0].date = message.date;
                            return [...existingData];
                        }
                    }
                    existingData.unshift(message);
                    return [...existingData];
                })
            }
        } catch (error) {
            logger.warn("Error when adding " + message.type + " message to chat list");
            logger.warn(error);
        }
    }

    //UI FUNCTIONS
    const onTextInputChange = (text) => {
        setTextInput(text);
        if (text.length > 16) setButtonsMinimized(true);
        if (text.length <= 16) setButtonsMinimized(false);
        try {
            if (text.length > 0) {
                mmAPI.mutate({
                    call: calls.UPDATE_CHAT_MEMBERS,
                    instance: "updateTyping",
                    input: {
                        id: route.params.userChatMembersID,
                        status: 4
                    }
                });
            }
        } catch (error) {
            logger.warn(error);
        }
    }

    const updateTime = () => {
        setData(existingItems => {
            for (var i = 0; i < existingItems.length; i++) {
                existingItems[i].date = timeLogic.noAgo((Date.now() - existingItems[i].createdAt) / 1000);
            }
            return [...existingItems];
        });
        logger.eLog("ChatPage TimeClock activated.");
    }

    //LIST UI COMPONENTS
    const ListFooterComponent = useCallback(() => {
        if (data.length > 0 && tokenExists({initial: false})) {
            return (
                <View style={styles.refresh}>
                    <ActivityIndicator color={colors.pBeam} size="small" />
                </View>
            );
        } else if (!tokenExists({ initial: false })) {
            return (<>
                <View style={styles.beginChat}>
                    <BeamTitle size={18}>Begining of Chat</BeamTitle>
                    <SubTitle size={14}>Say Something to {route.params.name}</SubTitle>
                    <SubTitle color={colors.text3}>Created on {(new Date(Date.parse(route.params.created))).toLocaleDateString()}</SubTitle>
                </View>
            </>);
        } else {
            return (<></>);
        }
    }, [data, nextToken]);
    const ListHeaderComponent = useCallback(() => {
        const RenderMember = ({ item }) => {
            return (
                <View style={styles.ppContain}>
                    <ProfileCircle
                        ppic={item.picture}
                    />
                </View>
            )
        }
        return (
            <View style={styles.typeContainer}>
                <FlatList
                    data={members}
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={keyExtractor}
                    horizontal={true}
                    renderItem={RenderMember}
                />
            </View>
        )
    }, [members])
    const RenderChat = useCallback(({ item }) => {
        if (item.type == "Image") {
            return (
                <View style={styles.chat}>
                    <ImageMessage
                        ppic={item.picture}
                        onPress={() => {
                            setPreviewImage(item.image.full);
                            setShowPreviewImage(true);
                        }}
                        time={item.date}
                        navigation={navigation}
                        username={item.user.username}
                        userId={route.params.user.id}
                        opposingUserId={item.user.id}
                        source={item.image}
                    />
                </View>
            )
        } else {
            return (
                <View style={styles.chat}>
                    <ComplexMessage
                        ppic={item.picture}
                        userId={route.params.user.id}
                        navigation={navigation}
                        opposingUserId={item.user.id}
                        time={item.date}
                        username={item.user.username}
                        message={item.content}
                    />
                </View>
            )
        }
    }, [data]);
    const keyExtractor = useCallback((item) => item.id, []);
    const onEndReached = useCallback(() => getMoreMessages({initial: false}), [nextToken]);

    //UI COMPONENTS
    const RenderButtons = () => (<>    
        <IconButton icon="camera" brand="Ionicons" color={colors.text3} style={{ marginBottom: 6 }} size={34} onPress={() => media.openCamera((item) => {setSelectedImage(item.full), setMsgIsImage(true), setSelectedSmallImage(item.loadFull)})} />
        <View style={{ width: 10 }} />
        <IconButton icon="duplicate" brand="Ionicons" color={colors.text3} size={34} style={{ marginBottom: 6, }} onPress={() => media.openPhotos((item) => { setSelectedImage(item.full), setMsgIsImage(true), setSelectedSmallImage(item.loadFull) })} />
        <View style={{ width: 10 }} />
        <IconButton icon="md-chevron-down-circle" brand="Ionicons" color={colors.text3} style={{ marginBottom: 6 }} size={34} onPress={() => { Keyboard.dismiss() }} />     
    </>)
    const RenderButtonsMinimized = () => (<IconButton icon="md-chevron-forward-circle" brand="Ionicons" color={colors.text3} style={{ marginBottom: 6 }} size={34} onPress={() => setButtonsMinimized(false)} />)
    const RenderTextInput = useCallback(() => (
        <SimpleInput
            reference={textInputRef}
            placeholder="Say something"
            onFocus={() => { chatListRef.current.scrollToOffset({ offset: 0 }) }}
            onPressIn={() => { chatListRef.current.scrollToOffset({ offset: 0 }) }}
            cStyle={{ overflow: "hidden", flex: 1, borderRadius: 20 }}
            tStyle={styles.message}
            multiline={true}
            maxLength={300}
            keyboardAppearance="dark"
            onChangeText={onTextInputChange}
        />
    ),[])
    return (<>
        <Screen innerStyle={styles.page} colorBack={true}>
            <KeyboardAvoidingView style={{ flex: 1, justifyContent: "flex-end" }} behavior={Platform.OS=="android" ? "height" : "padding"} keyboardVerticalOffset={headerHeight + 4}>
                <View style={styles.chats}>
                    <FlatList
                        data={data}
                        ref={chatListRef}
                        ListFooterComponent={ListFooterComponent}
                        ListHeaderComponent={ListHeaderComponent}
                        showsVerticalScrollIndicator={false}
                        inverted={true}
                        keyExtractor={keyExtractor}
                        onEndReached={onEndReached}
                        renderItem={RenderChat}
                        keyboardShouldPersistTaps="always"
                    />
                </View>

                
                <View style={[styles.textBox, { alignItems: msgIsImage ? "flex-start" : "flex-end" }]}>
                    {!(buttonsMinimized || msgIsImage) && <RenderButtons />}
                    {buttonsMinimized && <RenderButtonsMinimized />}
                    {!msgIsImage && <RenderTextInput />}
                    {msgIsImage && <ImageInput uri={{full: selectedImage, loadFull: selectedSmallImage}} onDisable={() => { setMsgIsImage(false); setSelectedImage("") } } /> }
                    <IconButton
                        icon="arrow-forward-circle"
                        brand="Ionicons"
                        color={(textInput.length >= 1 || msgIsImage) ? colors.pBeam : colors.pBeamDisabled}
                        disabled={(textInput.length >= 1 || msgIsImage) ? false : true}
                        size={34}
                        style={styles.sendButton}
                        onPress={send}
                    />
                </View>
            </KeyboardAvoidingView>
            <ImageView
                images={[{ uri: previewImage }]}
                imageIndex={0}
                visible={showPreviewImage}
                onRequestClose={() => { setShowPreviewImage(false) }}
            />
        </Screen>

    </>);
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
        backgroundColor: colors.container
    },
    sendButton: {
        marginBottom: 6,
    },
    textBox: {
        flexDirection: "row",
        paddingTop: 8,
        paddingBottom: 4,
        borderColor: colors.text4,
        borderTopWidth: 1,
        shadowColor: "black",
        shadowRadius: 2,
        shadowOffset: { height: -2 },
        shadowOpacity: 0.5,
        paddingHorizontal: 10,
        alignItems: "flex-end",
        backgroundColor: colors.background
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
    },
    beginChat: {
        alignItems: "center",
        justifyContent: "center",
        marginTop: 14,
        marginBottom: 10,
    },
    chat: {
        margin: 6,
        marginBottom: 10
    }
})