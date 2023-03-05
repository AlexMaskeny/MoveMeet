//region 3rd Party Imports
import React, { useCallback, useRef, useState, useEffect } from 'react';
import { StyleSheet, ActivityIndicator, FlatList, View, KeyboardAvoidingView, Keyboard, Platform, Alert } from 'react-native'
import { useHeaderHeight } from '@react-navigation/elements';
import { useNetInfo } from '@react-native-community/netinfo';
import uuid from "react-native-uuid";
import { Storage } from 'aws-amplify';
import { useFocusEffect } from '@react-navigation/native';
import ImageView from 'react-native-image-viewing';
import * as Notifications from 'expo-notifications';
//endregion
//region 1st Party Imports
import Screen from '../comps/Screen';
import IconButton from '../comps/IconButton';
import SimpleInput from '../comps/SimpleInput';
import ComplexMessage from '../comps/ComplexMessage';
import BeamTitle from '../comps/BeamTitle';
import SubTitle from '../comps/SubTitle';
import ImageInput from '../comps/ImageInput';
import ImageMessage from '../comps/ImageMessage';
import ProfileCircle from '../comps/SpinningProfileCircle';
import { colors } from '../config'
import { calls, mmAPI } from '../api/mmAPI';
import * as logger from '../functions/logger';
import * as media from '../functions/media';
import * as timeLogic from '../functions/timeLogic';
//endregion

export default function ChatPage({ route, navigation }) {
    /* =============[ VARS ]============ */
    //region useRef variables
    const textInputRef = useRef();               //"ref={textInputRef}" used on the typing input
    const lastToken = useRef("i1");              //The token used to get the current displayed messages
    const chatListRef = useRef();                //"ref={chatListRef}" used on the FlatList of messages
    const timeClockSub = useRef();               //Subscription for the timeClock. (timeClockSub.current = setInterval(...))
    const messageReceptionSub = useRef();        //Subscription for receiving messages for this chat.
    const memberStatusTracker = useRef(new Map); //Map of userIDs mapped to setTimeout return values. Displays a typing bubble until the timeout (4s) is finished.
    const nonUserMemberSub = useRef();           //Subscription listening to if other chat members are typing
    const userMemberSub = useRef();              //Subscription making sure the current user is still a member of the chat
    const subSafeSub = useRef();                 //Subscription to the SubSafety mechanism
    //endregion
    //region useState variables
    const [nextToken, setNextToken] = useState("i2");                 //The nextToken to be used on the next call to getMoreMessages()
    const [noLongerMember, setNoLongerMember] = useState(false);      //Is the user no longer a member of this chat? If true then don't allow sending messages
    const [textInput, setTextInput] = useState("");                   //The current value of the text input
    const [data, setData] = useState([]);                             //The list of messages in the chat
    const [showPreviewImage, setShowPreviewImage] = useState(false);  //Should we display an image preview for the previewImage state variable's URI?
    const [previewImage, setPreviewImage] = useState("");             //The URI of the image we are previewing
    const [selectedImage, setSelectedImage] = useState(" ");           //The image selected when creating an image message. Displays in image input
    const [selectedSmallImage, setSelectedSmallImage] = useState(" "); //The loadFull version of the image selected when creating an image message
    const [msgIsImage, setMsgIsImage] = useState(false);              //Should the input be an image input using the selectedImage?
    const [rerender, setRerender] = useState(false);                  //A placeholder state variable. Only utilized to run useFocusEffect again by setRerender(!rerender)
    const [members, setMembers] = useState([]);                       //The list of members that are currently typing in format {id: *user_id*, picture: *downloaded user profile picture*}
    const [buttonsMinimized, setButtonsMinimized] = useState(false);  //Should we minimize the buttons?
    //endregion
    const headerHeight = useHeaderHeight();
    const netInfo = useNetInfo();

    /* =============[ HOOKS ]============ */
    //region [HOOK] "useEffect, [navigation, route]" = Header Initialization For Screen Specific Icons
    useEffect(() => {
        navigation.setOptions({
            title: route.params.name,
            headerLeft: () => (
                <IconButton
                    icon="ios-chevron-back-outline"
                    color={colors.pBeamBright}
                    brand="Ionicons"
                    size={36}
                    onPress={() => {
                        //After we navigate we will go back verify that jump is false to avoid weird back button functionality
                        const initialJumpVal = route.params.jump;

                        if (initialJumpVal) {
                            let params = route.params;
                            params.jump = false;
                            navigation.setParams(params);
                            if (!route.params.private) navigation.navigate("TChatNav", {screen: "ChatsPage"});
                            else navigation.navigate("PChatNav", {screen: "PrivateChatsPage"});

                        } else navigation.goBack();
                    }}
                />
            )
        })
    }, [navigation, route])
    //endregion
    //region [HOOK] "useFocusEffect, [rerender]" = Get data on open page & on rerender
    useFocusEffect(useCallback(() => {
        //Disable receiving notifications for this chat while in it
        Notifications.setNotificationHandler({
            handleNotification: async (notification) => ({
                shouldShowAlert: notification.request.content.data.chatID !== route.params.id,
                shouldPlaySound: false,
                shouldSetBadge: false,
            }),
        });

        //region Remove the old SubSafe
        try {
            subSafeSub.current();
            logger.eLog("[SUBMANAGER] ChatPage subSafe subscription closed");
        } catch (error) { logger.eLog("The sub safe has yet to be enabled.") }
        //endregion
        //region Enable the time clock
        if (timeClockSub.current) clearInterval(timeClockSub.current);
        timeClockSub.current = setInterval(updateTime, 10000);
        logger.eLog("[SUBMANAGER] ChatPage timeClock subscription open.");
        //endregion
        //region Subscribe to messages
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
        //endregion
        //region Subscribe to typing updates
        logger.eLog("[SUBMANAGER] ChatPage nonUserMember subscription open.");
        if (nonUserMemberSub.current) nonUserMemberSub.current.unsubscribe();
        if (memberStatusTracker.current.size > 0) memberStatusTracker.current.clear();
        nonUserMemberSub.current = mmAPI.subscribe({
            call: calls.ON_USER_TYPING,
            instance: "full",
            input: { chatID: route.params.id },
            sendData: true,
            onReceive: async (data) => {
                //[IF] the user typing isn't from a blocked user [AND] isn't the current user [THEN] display the typing alert
                if (data.user.id !== route.params.user.id && data.status === 4) {
                    //Find the member who is typing
                    let member = data;
                    await getProfilePicture(member);

                    setMembers((existingData) => {
                        const existingMember = existingData.findIndex((el) => el.id === data.user.id);
                        //region [IF] the member isn't yet typing [THEN] display them
                        if (existingMember === -1) {
                            existingData = [...existingData, { id: member.user.id, picture: member.picture }];
                            memberStatusTracker.current.set(member.user.id, setTimeout(() => {
                                setMembers(existingMembers => {
                                    memberStatusTracker.current.delete(member.user.id);
                                    console.log(existingMembers._j);
                                    return existingMembers.filter(Member => Member.id !== member.user.id);
                                })
                            }, 4000));
                            return [...existingData];
                        }
                        //endregion
                        //region [ELSE] the typing member is displayed [SO] make it display for 4 more seconds
                        else {
                            clearTimeout(memberStatusTracker.current.get(member.user.id))
                            memberStatusTracker.current.set(member.user.id, setTimeout(() => {
                                setMembers(existingMembers => {
                                    memberStatusTracker.current.delete(member.user.id);
                                    return existingMembers.filter(Member => Member.id !== member.user.id)
                                })
                            }, 4000));
                            return existingData;
                        }
                        //endregion
                    });
                }
            },
            onError: (error) => {
                if (nonUserMemberSub.current) nonUserMemberSub.current.unsubscribe();
                logger.warn(error);
                logger.eLog("[SUBMANAGER]: Error detected receiving a chat member update in a ChatPage. Reconnecting...");
            }
        })
        //endregion
        //region Subscribe to current user membership updates (remove user on membership expiration)
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
        //endregion

        //Enable the SubSafe for the chat's message subscriptions
        subSafeSub.current = mmAPI.subSafe(() => setRerender(!rerender));

        //Get the initial messages for the chat
        getMoreMessages({ initial: true });

        return () => {
            //region When the screen leaves focus, unsubscribe from everything
            //region Remove the SubSafe
            try {
                subSafeSub.current();
                logger.eLog("[SUBMANAGER] ChatPage subSafe subscription closed");
            } catch (error) { }
            //endregion
            //region Set State Variables to Initial Values
            try {
                clearInputs();
                setNoLongerMember(false);
                setNextToken("i2");
                lastToken.current = "i1"
            } catch { }
            //endregion
            //region Disable the time clock
            try {
                clearInterval(timeClockSub.current);
                logger.eLog("[SUBMANAGER] ChatPage timeClock subscription closed.");
            } catch (error) { }
            //endregion
            //region Unsubscribe from messages
            try {
                messageReceptionSub.current.unsubscribe();
                logger.eLog("[SUBMANAGER] ChatPage messageReception subscription closed.");
            } catch (error) { }
            //endregion
            //region Unsubscribe from typing updates
            try {
                nonUserMemberSub.current.unsubscribe();
                logger.eLog("[SUBMANAGER] ChatPage nonUserMember subscription closed.");
            } catch (error) { }
            //endregion
            //region Unsubscribe from current user membership updates (that remove user from chat on membership expiration)
            try {
                userMemberSub.current.unsubscribe();
                logger.eLog("[SUBMANAGER] ChatPage userMember subscription closed.")
            } catch (error) { }
            //endregion
            //region Remove any typing bubbles still present
            try {
                memberStatusTracker.current.forEach((value) => {
                    clearTimeout(value);
                    logger.eLog("[SUBMANAGER] A member that was typing was cleared from the array.");
                })
            } catch (error) { }
            //endregion
            //region Reset notification handling to default
            try {
                Notifications.setNotificationHandler({
                    handleNotification: async (notification) => ({
                        shouldShowAlert: true,
                        shouldPlaySound: false,
                        shouldSetBadge: false,
                    }),
                });
            } catch (error) { }
            //endregion
            //endregion
        }
    }, [rerender]));
    //endregion

    /* =============[ FUNCS ]============ */
    //region [FUNC ASYNC] "readMessage = async (message)" = [IF] the user hasn't already read the provided message [THEN] read it
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
    //endregion
    //region [FUNC ASYNC] "getMoreMessages = async ({initial = false})" = Get more message data. Uses pagination via "tokenExists"
    const getMoreMessages = async ({ initial = false }) => {
        //region Verify that we CAN get more data
        //[IF] the user isn't connected then do nothing. Allow initial pass through always.
        if (!netInfo.isConnected && !initial) return;
        //[IF] there is no more data to get [AND] it isn't the first data acquisition [THEN] do nothing.
        if (!tokenExists({initial})) return;
        //endregion

        //region [IF] it's the first time (AKA not a nexttoken load) [THEN] make sure the data is empty first & nextTokens are back to initial values
        if (initial) {
            setNextToken("i2");
            lastToken.current = "i1";
        }
        //endregion
        const token = initial ? null : nextToken;

        try {
            //region Get the messages from the database (possibly offset by the nextToken)

            const messagesResponse = await mmAPI.query({
                call: calls.LIST_MESSAGES_BY_TIME,
                instance: "full",
                input: {
                    chatMessagesId: route.params.id,
                    nextToken: token,
                    limit: 18
                }
            });
            //Update the next token
            lastToken.current = nextToken;
            setNextToken(messagesResponse.nextToken);

            //endregion
            //[IF] there is at least one message [THEN] display them [ELSE] do nothing.
            if (messagesResponse.items.length > 0) {
                //Create a mutable messages array
                let messages = [...messagesResponse.items];

                //Read the latest message. No need to read previous ones.
                if (initial) readMessage(messages[0]);

                //Iterate through each message, parse its data, and download its image.
                for (let i = 0; i < messages.length; i++) {
                    messages[i].createdAt = Date.parse(messages[i].createdAt);
                    messages[i].date = timeLogic.noAgo((Date.now() - messages[i].createdAt) / 1000);
                    await getProfilePicture(messages[i]);
                    //[IF] the message is an image [THEN] get the image [ELSE] do nothing.
                    if (messages[i].type === "Image") await getMessageImage(messages[i]);
                }
                setData((existingData) => {
                    if (initial) existingData = [];
                    //Iterate through each message and decide whether to merge them or not.
                    //Once decided, update the data state variable with them
                    for (let i = 0; i < messages.length; i++) {
                        //[IF] there is at least one message [THEN] decide whether to merge it
                        if (existingData.length > 0) {
                            let nextMessage = existingData[existingData.length - 1]; //The message before this message (messages[i])

                            //[REGION_DESC] [IF]   the message before the message we are adding was created by the same user as the message we are adding
                            //              [AND]  the message we are adding and the last message are both of type text
                            //              [AND]  the last message was created within 2 hours of the message we are adding
                            //              [THEN] merge the messages
                            //              [ELSE] add the message we are adding separately
                            //region [REGION_DEF]
                            if (nextMessage.user.id === messages[i].user.id &&
                                nextMessage.type === "Text" &&
                                messages[i].type === "Text" &&
                                nextMessage.createdAt - messages[i].createdAt < 1000 * 60 * 60 * 2
                            ) {
                                existingData[existingData.length - 1].createdAt = messages[i].createdAt;
                                existingData[existingData.length - 1].content = messages[i].content + "\n" + nextMessage.content;
                                existingData[existingData.length - 1].date = messages[i].date;
                            } else existingData.push(messages[i]);
                            //endregion
                        }
                        //[ELSE] just add the message
                        else existingData.push(messages[i]);
                    }
                    return [...existingData];
                })
            }
        } catch (error) {
            logger.warn("Error getting initial or more messages");
            logger.warn(error);
        }
    }
    //endregion
    //region [FUNC ASYNC] "send = async ()" = Sends a message. Decides whether it's sending an image or text.
    const send = async () => {
        //Don't let the user send messages if they're disconnected
        if (!netInfo.isConnected) {
            Alert.alert("Connection Problem", "It looks like you aren't connected to the internet. You must be to send messages.");
            return;
        }

        //Clear the typing / image inputs
        clearInputs();

        //region Build the message to send based on current state of inputs
        let message = {
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
        //endregion
        //region Remember the length of the data when we began sending the message
        let lengthAtCreation = data.length + 1;

        //[IF]   the data has at least one message
        //[AND]  the previous message was sent by the current user
        //[AND]  the previous message was of type text
        //[AND]  the previous message was created within the last 2 hours
        //[THEN] then we will be merging the messages
        //[SO]   Don't worry about
        if (data.length > 0 &&
            data[0].user.id === message.user.id &&
            data[0].type === "Text" &&
            message.createdAt - data[0].createdAt < 1000 * 60 * 60 * 2
        ) lengthAtCreation = data.length;
        //endregion

        //Add the message locally
        await addMessage(message);

        //region Build the image section for image messages
        let image = {};
        if (msgIsImage) {
            image = {
                image: {
                    bucket: "proxychatf2d762e9bc784204880374b0ca905be4120629-dev",
                    region: "us-east-2",
                    full: "FULLMESSAGE" + message.id + ".jpg",
                    loadFull: "LOADFULLMESSAGE" + message.id + ".jpg",
            }}
        }
        //endregion

        try {
            //region Upload the message. [IF] message is of type image [THEN] also upload image to s3.
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
            });
            if (message.type === "Image") {
                await mmAPI.store("FULLMESSAGE" + message.id + ".jpg", selectedImage);
                await mmAPI.store("LOADFULLMESSAGE" + message.id + ".jpg", selectedSmallImage);
            }
            //endregion
            //region Update the message locally to be considered delivered.
            if (result) {
                setData(existingData => {
                    existingData[existingData.length - lengthAtCreation].undelivered = false;
                    existingData[existingData.length - lengthAtCreation].date = timeLogic.noAgo((Date.now() - Date.parse(result.createdAt)) / 1000);
                    existingData[existingData.length - lengthAtCreation].createdAt = Date.parse(result.createdAt);
                    return [...existingData];
                });
            }
            //endregion
        } catch (error) {
            logger.warn("An error occurred when sending a " + message.type + " message...");
            logger.warn(error);
        }
    }
    //endregion
    //region [FUNC ASYNC] "getProfilePicture = async (message)" = Downloads the loadFull profile picture of the user who sent the message provided
    const getProfilePicture = async (message) => {
        let ppLoadFull = await Storage.get(message.user.profilePicture.loadFull);
        message.picture = {
            full: ppLoadFull,
            loadFull: ppLoadFull,
            fullKey: message.user.profilePicture.loadFull
        }
    }
    //endregion
    //region [FUNC ASYNC] "getMessageImage = async (message)" = Downloads the image message from the message provided
    const getMessageImage = async (message) => {
        message.image.fullKey = message.image.full;
        message.image.loadFull = await Storage.get(message.image.loadFull);
        message.image.full = await Storage.get(message.image.full);
    }
    //endregion
    //region [FUNC ASYNC] "addMessage = async (data)" = Adds the provided message to the chat locally
    const addMessage = async (data) => {
        try {
            let message = data;

            //Get the profile picture of the user who sent the message
            await getProfilePicture(message);

            //region Set the message's date
            //[IF] the message isn't delivered make the date ...
            if (message.undelivered)
                message.date = "...";
            //[ELSE] make the data the noAgo parsed interval since the message was created
            else message.date = timeLogic.noAgo((Date.now() - message.createdAt)/1000);
            //endregion
            //region [IF] the message is of type image [THEN] download the image and push it
            if (message.type === "Image") {
                //Download the message's image
                await getMessageImage(message);
                setData(existingData => {
                    existingData.unshift(message);
                    return [...existingData];
                });
            }
                //endregion
            //region [ELSE] the message is of type text [SO] decide whether to merge it or push it [THEN] do the decided action.
            else {
                setData(existingData => {
                    //[IF] there is already a message displayed [THEN] decided whether to merge it or not
                    if (existingData.length > 0) {
                        //[REGION_DESC] [IF]   the message before the message we are adding was created by the same user as the message we are adding
                        //              [AND]  the last message is of type text
                        //              [AND]  the last message was created within 2 hours of the message we are adding
                        //              [THEN] merge the messages
                        //              [ELSE] skip this if statement and add the message separately
                        //region [REGION_DESC]
                        if (existingData[0].user.id === message.user.id &&
                            existingData[0].type === "Text" &&
                            message.createdAt - existingData[0].createdAt < 1000 * 60 * 60 * 2
                        ) {
                            existingData[0].content = existingData[0].content + "\n" + message.content;
                            existingData[0].created = message.createdAt;
                            existingData[0].date = message.date;
                            return [...existingData];
                        }
                        //endregion
                    }
                    //[ELSE] add the message separately always
                    existingData.unshift(message);
                    return [...existingData];
                })
            }
            //endregion

        } catch (error) {
            logger.warn("Error when adding " + message.type + " message to chat list");
            logger.warn(error);
        }
    }
    //endregion
    //region [FUNCTION]   "clearInputs = ()" = Resets the state of all inputs to default values
    const clearInputs = () => {
        setTextInput("");
        setSelectedImage("");
        setMsgIsImage(false);
        setButtonsMinimized(false);
        textInputRef?.current?.clear();
    }
    //endregion
    //region [FUNCTION]   "tokenExists = ({initial = false})" = [IF] there is more message data to grab (when scrolling up) [THEN] return true [ELSE] return false
    const tokenExists = ({ initial = false }) => {
        if (initial) return true;
        if (nextToken === null) return false;
        if (nextToken === "i2") return false;
        return lastToken.current !== nextToken;
    }
    //endregion
    //region [FUNCTION]   "onTextInputChange = (text)" = Send the current user's typing status to the database / decided whether to minimize buttons
    const onTextInputChange = (text) => {
        setTextInput(text);
        //[IF] the text has a length > 16 [THEN] minimize the buttons
        if (text.length > 16) setButtonsMinimized(true);
        //[ELSE] un-minimize the buttons
        if (text.length <= 16) setButtonsMinimized(false);
        try {
            //region [IF] there is an update in the text making it > 0 [THEN] send a typing update to the database
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
            //endregion
        } catch (error) {
            logger.warn(error);
        }
    }
    //endregion
    //region [FUNCTION]   "updateTime = ()" = Updates the messages' date in the chat. Triggered by time clock
    const updateTime = () => {
        setData(existingItems => {
            for (let i = 0; i < existingItems.length; i++) {
                existingItems[i].date = timeLogic.noAgo((Date.now() - existingItems[i].createdAt) / 1000);
            }
            return [...existingItems];
        });
        logger.eLog("ChatPage TimeClock activated.");
    }
    //endregion
    //region [FUNCTION]   "openCamera" = () = Opens camera to take image
    const openCamera = () => {
        try {
            media.openCamera((item) => {
                setMsgIsImage(true);
                setSelectedImage(item.full);
                setSelectedSmallImage(item.loadFull);
            });
        } catch (error) {
            logger.log(error);
        }
    }

    //endregion
    //region [FUNCTION]   "openPhotos" = () = Opens the camera roll
    const openPhotos = () => {
        try {
            media.openPhotos((item) => {
                setMsgIsImage(true);
                setSelectedImage(item.full);
                setSelectedSmallImage(item.loadFull);
            });
        } catch (error) {
            logger.log(error);
        }
    }
    //endregion

    /* =============[ LIST ]============ */
    //region [CALL COMP] "ListFooterComponent, [data, nextToken]" = [IF] no messages [AND] token exists [THEN] display activity indicator [ELSE IF] token doesn't exist [THEN] display beggining of chat
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
    //endregion
    //region [CALL COMP] "ListHeaderComponent, [members]" = Displays the members that are currently typing at bottom of screen
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
    //endregion
    //region [CALL COMP] "RenderChat, [data]" = Displays each message in the chat of both types.
    const RenderChat = useCallback(({ item }) => {
        //Display Image Message
        if (item.type === "Image") {
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
        }
        //Display Text Message
        else {
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
    //endregion
    const keyExtractor = useCallback((item) => item.id, []);
    const onEndReached = useCallback(() => getMoreMessages({initial: false}), [nextToken]);

    /* =============[ COMPS ]============ */
    //region [COMPONENT] "RenderButtons" = Used to render the buttons on the typing bar
    const RenderButtons = () => <>
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
            onPress={() => {
                Keyboard.dismiss();
            }}
        />
    </>;
    //endregion
    //region [COMPONENT] "RenderButtonsMinimized" = Renders the reopen button when buttons are minimized
    const RenderButtonsMinimized = () =>
        <IconButton
            icon="md-chevron-forward-circle"
            brand="Ionicons"
            color={colors.text3}
            style={{ marginBottom: 6 }}
            size={34}
            onPress={() => setButtonsMinimized(false)}
        />
    //endregion
    //region [COMPONENT] "ImageViewModal" = Modal to overlay previewing images
    const ImageViewModal = () =>
        <ImageView
            images={[{ uri: previewImage }]}
            imageIndex={0}
            visible={showPreviewImage}
            onRequestClose={() => { setShowPreviewImage(false) }}
        />
    //endregion
    //region [COMPONENT] "SendButton" = Icon Always Displayed for sending
    const SendButton = () =>
        <IconButton
            icon="arrow-forward-circle"
            brand="Ionicons"
            color={(textInput.length >= 1 || msgIsImage) ? colors.pBeam : colors.pBeamDisabled}
            disabled={(!(textInput.length >= 1 || msgIsImage))}
            size={34}
            style={styles.sendButton}
            onPress={send}
        />
    //endregion
    //region [CALL COMP] "RenderTextInput, []" = Renders the typing field input
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
    ),[]);
    //endregion

    return (<>
        <Screen innerStyle={styles.page} colorBack={true}>
            <KeyboardAvoidingView
                style={styles.keyBoardAvoidingView}
                behavior={Platform.OS === "android" ? "height" : "padding"}
                keyboardVerticalOffset={headerHeight + 4}
            >
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

                {/*region Renders the icons & text input */}
                <View style={[styles.textBox, { alignItems: msgIsImage ? "flex-start" : "flex-end" }]}>
                    {!(buttonsMinimized || msgIsImage) && <RenderButtons />}
                    {buttonsMinimized && <RenderButtonsMinimized />}
                    {!msgIsImage && <RenderTextInput />}
                    {msgIsImage &&
                        <ImageInput
                            uri={{full: selectedImage, loadFull: selectedSmallImage}}
                            onDisable={() => {
                                setMsgIsImage(false);
                                setSelectedImage(" ");
                                setSelectedSmallImage(" ");
                            }}
                        />
                    }
                    <SendButton />
                </View>
                {/*endregion*/}

            </KeyboardAvoidingView>
            <ImageViewModal />
        </Screen>

    </>);
}

const styles = StyleSheet.create({
    //region message
    message: {
        paddingVertical: 10,
        paddingTop: 10,
        maxHeight: 120,
    },
    //endregion
    //region chats
    chats: {
        justifyContent: "flex-start",
        flex: 1
    },
    //endregion
    //region page
    page: {
        justifyContent: "flex-end",
        backgroundColor: colors.container
    },
    //endregion
    //region sendButton
    sendButton: {
        marginBottom: 6,
    },
    //endregion
    //region textBox
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
    //endregion
    //region refresh
    refresh: {
        margin: 10
    },
    //endregion
    //region ppContain
    ppContain: {
        justifyContent: "center",
        paddingVertical: 4,
        marginBottom: 0
    },
    //endregion
    //region typeContainer
    typeContainer: {
        marginBottom: -6,
        marginLeft: 4,
        height: 60
    },
    //endregion
    //region beginChat
    beginChat: {
        alignItems: "center",
        justifyContent: "center",
        marginTop: 14,
        marginBottom: 10,
    },
    //endregion
    //region chat
    chat: {
        margin: 6,
        marginBottom: 10
    },
    //endregion
    //region keyBoardAvoidingView
    keyBoardAvoidingView: {
        flex: 1,
        justifyContent: "flex-end"
    }
    //endregion
})