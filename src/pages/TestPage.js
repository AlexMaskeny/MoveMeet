import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { API, Auth, graphqlOperation, Storage } from 'aws-amplify';
import Image from "../comps/ImageLoader";
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import uuid from "react-native-uuid";
import * as Notifications from 'expo-notifications';
import { colors, debug } from '../config';
import { createUser, updateUser, createChat, updateChat, createMessage, getMessage, getChat, listChats, listUsers, createChatMembers, getLatestMessagesByTime, listMessagesByTime } from '../api/calls';
import BeamTitle from '../comps/BeamTitle';
import SimpleButton from '../comps/SimpleButton';
import Screen from '../comps/Screen';
import SimpleInput from '../comps/SimpleInput';
import { pinpoint } from '../graphql/mutations';
import ImageView from 'react-native-image-viewing';
import * as Subscriptions from '../graphql/subscriptions';
import { LongPressGestureHandler, State } from 'react-native-gesture-handler';

function TestScreen({ navigation }) {
    //const [image, setImage] = React.useState("https://www.tamiu.edu/newsinfo/images/student-life/campus-scenery.JPG");
    const [username, setUsername] = React.useState("");
    const [code, setCode] = React.useState("");
    const [chatName, setChatName] = React.useState("");
    const [loc, setLoc] = React.useState("");
    //React.useEffect(() => {
    //    const initialFunction = async () => {
    //        try {

    //        } catch (error) {
    //            if (debug) console.log(error);
    //        }
    //    }
    //    initialFunction();
    //}, []);

    const selectImage = async () => {
        const cameraRollStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (cameraRollStatus.granted) {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: "Images",
                aspect: [4, 3],
                quality: 1,
            })
            return result;
        } else {
            Alert.alert("No Permission");
        }
    }
    const createNewUser = async () => {
        try {
            console.log("Creating new user...");
            const user = await Auth.signUp({
                username: username,
                password: ",.1!qweR",
                attributes: {
                    email: "alex@maskeny.com",
                    phone_number: "+15867702686",
                }
            })
            const pickerResult = await selectImage();
            if (pickerResult.cancelled) {
                console.log("Canceled User Creation");
                return
            }
            const response = await fetch(pickerResult.uri);
            const img = await response.blob();

            const newUser = await API.graphql(graphqlOperation(createUser, {
                input: {
                    username: username,
                    cognitoID: user.userSub,
                }
            }))
            const userID = newUser.data.createUser.id;
            const fullPicture = await Storage.put("FULLprofilePicture" + userID + ".jpg", img);
            const image = await Storage.get("FULLprofilePicture" + userID + ".jpg");
            setTimeout(async function () {
                const loadImage = await Storage.get("LOADFULLprofilePicture" + userID + ".jpg");
                const updatedUser = await API.graphql(graphqlOperation(updateUser, {
                    input: {
                        id: userID,
                        profilePicture: {
                            bucket: "proxychatf2d762e9bc784204880374b0ca905be4120629-dev",
                            region: "us-east-2",
                            full: image,
                            loadFull: loadImage
                        }
                    }
                }))
                console.log("User Generated");
            }, 7);
            //console.log(image);
        } catch (error) {
            console.log(error);
        }
    };

    const confirmUser = async () => {
        try {
            const result = await Auth.confirmSignUp(username, code);
            if (result) {
                console.log('Confirmed');
            }
        } catch (error) {
            console.log(error);
        }
    }
    const createNewChat = async () => {
        try {
            const perm = await Location.requestForegroundPermissionsAsync();
            console.log("Creating new chat...");
            const loc = await Location.getCurrentPositionAsync({ accuracy: 25 });
            const currentLong = loc.coords.longitude;
            const currentLat = loc.coords.latitude;
            const pickerResult = await selectImage();
            if (pickerResult.cancelled) {
                console.log("Canceled Chat Creation");
                return
            }
            const response = await fetch(pickerResult.uri);
            const img = await response.blob();
            const newChat = await API.graphql(graphqlOperation(createChat, {
                input: {
                    name: chatName,
                    lat: currentLat,
                    long: currentLong,
                }
            }))
            const chatID = newChat.data.createChat.id;
            const fullBackground = await Storage.put("FULLchatBackground" + chatID + ".jpg", img);
            const image = await Storage.get("FULLchatBackground" + chatID + ".jpg");
            //const loadImage = await Storage.get("LOADFULLchatBackground" + chatID + ".jpg"); //Program fails if images are too large. >7
            const updatedChat = await API.graphql(graphqlOperation(updateChat, {
                input: {
                    id: chatID,
                    background: {
                        bucket: "proxychatf2d762e9bc784204880374b0ca905be4120629-dev",
                        region: "us-east-2",
                        full: image,
                    }
                }
            }))
            console.log("Chat Generated");
            console.log(updatedChat);
        } catch (error) {
            console.log(error);
        }
    }

    const createRegularMessage = async (userID, chatID, j) => {
        try {
            const content = "" + j + "Alexander is a big fan of Grace Suber.";
            const type = "Regular";
            const index = j;
            //const chatID = "fd30caf6-06c7-43a1-9f2d-408e4f0ac3c8";
            //const userID = "d98f090b-c0fa-4f4d-a3d4-f8a5190a06b5";
            const newMessage = await API.graphql(graphqlOperation(createMessage, {
                input: {
                    userMessagesId: userID,
                    chatMessagesId: chatID,
                    content: content,
                    type: type,
                    index: index,
                }
            }))
            console.log(newMessage);
        } catch (error) {
            console.log(error);
        }
    }

    const createImageMessage = async () => {
        try {
            const content = "Alexander is a big fan of Grace Suber.";
            const type = "Image";
            const index = 0;
            const chatID = "df45ab06-cf1e-4730-bf2f-0b6f2db21844";
            const userID = "d98f090b-c0fa-4f4d-a3d4-f8a5190a06b5";
            const newMessage = await API.graphql(graphqlOperation(createMessage, {
                input: {
                    userMessagesId: userID,
                    chatMessagesId: chatID,
                    image: {
                        bucket: "proxychatf2d762e9bc784204880374b0ca905be4120629-dev",
                        region: "us-east-2",
                        full: "https://proxychatf2d762e9bc784204880374b0ca905be4120629-dev.s3.us-east-2.amazonaws.com/public/FULLprofilePicture7b1c2e2b-aeea-4450-87b0-3de9113b8e4e.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAUE2X27T22UPUSU6N%2F20221018%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Date=20221018T214027Z&X-Amz-Expires=900&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEF4aCXVzLWVhc3QtMiJHMEUCIQCCLf8vu8mp5JsHv9LxMgynoVigchQJO5GxPPgUHTSijQIgOte445Ctia%2FTLuSEVTtPj%2F8MzDDlAuH2NW2VHpuKSnYqxAQINxAAGgwyODUyNjI2NzUxODkiDHwChFsZJp0NtBxd8yqhBCxko16B2svxWJECGsMNiIgxOOxRsW%2Fr6Y1rILCiAeQqVEJOfMihi9mnRUu4QFF5WFKZq4gvMVvbYnhHfmVuUpI7ON0nP77OGUi1CniTplyzdKY%2BisorUOeGDn7efuul2AwAulvimKGFwMDF%2FVAB8ftQYpSKmMQhNi%2BChcB8axZ7Z3VyNj%2Feo1V0mEZrhjy%2BI%2BeK5cxZY7BBxtnRcyFg0Qq4NjmUlwrlWV8Pzt5H6Hm6NxZwcreZC%2Bnlgbkd2c4M5eiaGhrIAvJaLrpFL6eNnAq6FZJcpAjnYrvAcwUTJEMOe8K52ymImmoSENso1TrQ%2BUfNjizOcRwyl5DugzaUKIzfpVL%2B2X3u4WzZXMhq1dLq2Mx6aPwxSjWaE3Yc6OzqKlYh9zNvu7Y1n9A8gtyYOuCDgVjpDoa5ee5DESK6H5WXerOQVLUL0fWz7P0Pwiz24ftoTRBrmuU6w7FAUczL%2BqdzGlzU2v7MqyUP9FHsfo%2F4NVF3OxL48JNwQsIkHX2CMiaclMGZNpWCc1QSSDw0Y9d2vCgmHl6eBS%2FiXyT4gdrNCXGypcrRi%2Bv6Zij2zcezOE5aCbMMjyUsHmbMURgHHe6iZkcxDFuCfsUtH5tk5BpqD8%2BuRJszmPe6i13IZyf36BUzfeL6RZnq1ke0N94c3xiOAboNv6DZ6Kj6805FV5cbtVgG67kZ5d5erNoZ%2FuLsc8y9faSlI%2F7pS60owhq7V8o0MMq6vJoGOoUC%2BGWFMTZvn9Doy0752X4%2F7qu5zKhayO2dJrj82iCYVPQ88BHWfblujwqD4R%2FtFFJTSZ8uEMaylMpxs1cHMz66BD48zHY6dNPsSbjc4bARjzbbCQ%2Fy8u6fqDWfKt%2BqHY%2FGcYgyeapBOwBQFtwopPfWTEUPK%2FjgY6Ik9TZA1GF2KrvGbiaeWxwaxT6GepUipUBx4ZNLWZCuz7pSzKHwT40wR6SuYdKYaSDsJ%2BTACMXq3oNkVJN3tI6fXiTq%2FA0Y5YKBazuddetjuffWYnA9ffvwVLUUnc4iaIerEPRvZQUtA85n1IHwtMyD%2Bzg6qmq08TnCvcUkGt%2F%2Btu92TdijnCdri9mvoIyD&X-Amz-Signature=57b82de792640b7d6170025b4986953b25667613a1b521d8ecb141b6fea3867c&X-Amz-SignedHeaders=host&x-amz-user-agent=aws-sdk-js%2F3.6.1%20os%2Fother%20lang%2Fjs%20md%2Fbrowser%2Funknown_unknown%20api%2Fs3%2F3.6.1%20aws-amplify%2F4.7.5_react-native&x-id=GetObject",
                        loadFull: "https://proxychatf2d762e9bc784204880374b0ca905be4120629-dev.s3.us-east-2.amazonaws.com/public/LOADFULLprofilePicture7b1c2e2b-aeea-4450-87b0-3de9113b8e4e.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAUE2X27T22UPUSU6N%2F20221018%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Date=20221018T214027Z&X-Amz-Expires=900&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEF4aCXVzLWVhc3QtMiJHMEUCIQCCLf8vu8mp5JsHv9LxMgynoVigchQJO5GxPPgUHTSijQIgOte445Ctia%2FTLuSEVTtPj%2F8MzDDlAuH2NW2VHpuKSnYqxAQINxAAGgwyODUyNjI2NzUxODkiDHwChFsZJp0NtBxd8yqhBCxko16B2svxWJECGsMNiIgxOOxRsW%2Fr6Y1rILCiAeQqVEJOfMihi9mnRUu4QFF5WFKZq4gvMVvbYnhHfmVuUpI7ON0nP77OGUi1CniTplyzdKY%2BisorUOeGDn7efuul2AwAulvimKGFwMDF%2FVAB8ftQYpSKmMQhNi%2BChcB8axZ7Z3VyNj%2Feo1V0mEZrhjy%2BI%2BeK5cxZY7BBxtnRcyFg0Qq4NjmUlwrlWV8Pzt5H6Hm6NxZwcreZC%2Bnlgbkd2c4M5eiaGhrIAvJaLrpFL6eNnAq6FZJcpAjnYrvAcwUTJEMOe8K52ymImmoSENso1TrQ%2BUfNjizOcRwyl5DugzaUKIzfpVL%2B2X3u4WzZXMhq1dLq2Mx6aPwxSjWaE3Yc6OzqKlYh9zNvu7Y1n9A8gtyYOuCDgVjpDoa5ee5DESK6H5WXerOQVLUL0fWz7P0Pwiz24ftoTRBrmuU6w7FAUczL%2BqdzGlzU2v7MqyUP9FHsfo%2F4NVF3OxL48JNwQsIkHX2CMiaclMGZNpWCc1QSSDw0Y9d2vCgmHl6eBS%2FiXyT4gdrNCXGypcrRi%2Bv6Zij2zcezOE5aCbMMjyUsHmbMURgHHe6iZkcxDFuCfsUtH5tk5BpqD8%2BuRJszmPe6i13IZyf36BUzfeL6RZnq1ke0N94c3xiOAboNv6DZ6Kj6805FV5cbtVgG67kZ5d5erNoZ%2FuLsc8y9faSlI%2F7pS60owhq7V8o0MMq6vJoGOoUC%2BGWFMTZvn9Doy0752X4%2F7qu5zKhayO2dJrj82iCYVPQ88BHWfblujwqD4R%2FtFFJTSZ8uEMaylMpxs1cHMz66BD48zHY6dNPsSbjc4bARjzbbCQ%2Fy8u6fqDWfKt%2BqHY%2FGcYgyeapBOwBQFtwopPfWTEUPK%2FjgY6Ik9TZA1GF2KrvGbiaeWxwaxT6GepUipUBx4ZNLWZCuz7pSzKHwT40wR6SuYdKYaSDsJ%2BTACMXq3oNkVJN3tI6fXiTq%2FA0Y5YKBazuddetjuffWYnA9ffvwVLUUnc4iaIerEPRvZQUtA85n1IHwtMyD%2Bzg6qmq08TnCvcUkGt%2F%2Btu92TdijnCdri9mvoIyD&X-Amz-Signature=677ab32887a30e2514f265635b10c6b4e13f3d13ce5e1c3e21609754509611a1&X-Amz-SignedHeaders=host&x-amz-user-agent=aws-sdk-js%2F3.6.1%20os%2Fother%20lang%2Fjs%20md%2Fbrowser%2Funknown_unknown%20api%2Fs3%2F3.6.1%20aws-amplify%2F4.7.5_react-native&x-id=GetObject"
                    },
                    type: type,
                    index: index,
                }
            }))
            console.log(newMessage);
        } catch (error) {
            console.log(error);
        }
    }

    const getMsg = async () => {
        try {
            const message = await API.graphql(graphqlOperation(getMessage, {
                id: "fa596b9d-eb81-4e8c-827f-1a61fb2f7b44"
            }))
            console.log(message.data.getMessage.user);
        } catch (error) {
            console.log(error);
        }
    }

    const getCh = async () => {
        try {
            const chat = await API.graphql(graphqlOperation(getChat, {
                id: "e4643d94-2c8d-46ae-a29e-47d594b347bc"
            }))
            console.log(chat.data.getChat.messages.items[0]);
        } catch (error) {
            console.log(error);
        }
    }

    const userIDS = [
        "befbb1d2-cc43-4651-80cf-126591e2e589",
        "d9b6c3eb-470a-4aef-b326-419a267653da",
        "0fdd1b57-5cc2-4bf9-81c6-736e097b5810",
        "c9bab0cc-430d-405e-a9ee-44b0a6364f82",
        "c9c41e76-73b7-43e3-be8f-3ddf24d18ff6",
    ]
    const chatIDS = [
        "fd30caf6-06c7-43a1-9f2d-408e4f0ac3c8",
        "e4643d94-2c8d-46ae-a29e-47d594b347bc",
        "a96b3fe5-d240-436c-afff-57ee982a2dd3",
        "df45ab06-cf1e-4730-bf2f-0b6f2db21844",
        "c56016ef-a56a-46db-852a-743c030bd5f8",
    ]
    const fillData = async () => {
        try {
            for (i = 0; i < 5; i++) {
                for (j = 0; j < 5; j++) {
                    await createRegularMessage(userIDS[j], chatIDS[i], j);
                    console.log("I: " + i + ", J" + j + " completed...");
                }
            }
        } catch (error) {
            console.log(error);
        }
    }
    const updateChats = async () => {
        try {
            const result = await API.graphql(graphqlOperation(listChats));
            const items = result.data.listChats.items;
            for (i = 0; i < items.length; i++) {
                const lat = items.at(i).lat;
                const long = items.at(i).long;
                const nLat = lat * 364011.1;
                const nLong = long * 365221.0 * Math.cos(lat * Math.PI/180.0);
                const latf = round(nLat);
                const longf = round(nLong);
                const updatedChat = await API.graphql(graphqlOperation(updateChat, {
                    input: {
                        id: items.at(i).id,
                        lat: nLat,
                        long: nLong,
                        latf1: latf.f1,
                        longf1: longf.f1,
                        latf2: latf.f2,
                        longf2: longf.f2,
                    }
                }))
                console.log(updatedChat);
            }
        } catch (error) {
            console.log(error);
        }
    }
    const round = (iNumber) => {
        const number = iNumber / 1000.0;
        const multiplicity = number / Math.abs(number);
        const f1 = 1000.0 * multiplicity * Math.floor(Math.abs(number));
        const f2 = 1000.0* multiplicity * Math.ceil(Math.abs(number));
        return {
            f1: f1,
            f2: f2,
        }
    }

    const chats = [
        "fd30caf6-06c7-43a1-9f2d-408e4f0ac3c8",
        "c56016ef-a56a-46db-852a-743c030bd5f8",
        "df45ab06-cf1e-4730-bf2f-0b6f2db21844",
        "c365546f-ab12-485d-b144-960ecedf840f",
        "e4643d94-2c8d-46ae-a29e-47d594b347bc",
        "ad4ecacd-a85f-4774-9d96-b23ec9480e29",
        "a96b3fe5-d240-436c-afff-57ee982a2dd3",
        "ca0177b1-bb0b-42eb-b119-d50fb194d593",
        "0b56e6a2-1251-4c34-9dd0-b8bb862aec6b",
        "cdf3fa65-28a7-43b2-a042-e332fdc60c3e",
        "9bfdfdc1-397e-4551-bf4c-5132bbc3d4f7",
        "9f7915b3-852a-484e-be56-898bb7d47336",
        "1a000e54-4fe6-46f9-8cb1-3fa8a3f36ad7",
        "57a7d895-2993-46a3-a49f-6d56b5a8a8fb",
        "997ac289-10ef-4d3a-8d9a-2b1b7fc41152",

    ]

    const updateChatBackgrounds = async () => {
        try {
            const result = await API.graphql(graphqlOperation(listChats));
            const items = result.data.listChats.items;
            for (i = 0; i < items.length; i++) {
                const updatedChat = await API.graphql(graphqlOperation(updateChat, {
                    input: {
                        id: items.at(i).id,
                        background: {
                            bucket: "proxychatf2d762e9bc784204880374b0ca905be4120629-dev",
                            region: "us-east-2",
                            full: "FULLchatBackground" + items.at(i).id + ".jpg",
                            loadFull: "LOADFULLchatBackground" + items.at(i).id + ".jpg",
                        }
                    }
                }))
            }
        } catch (error){
            console.log(error);
        }
    }

    const updateUserBackgrounds = async () => {
        try {
            const result = await API.graphql(graphqlOperation(listUsers));
            const items = result.data.listUsers.items;
            for (i = 0; i < items.length; i++) {
                const updatedUser = await API.graphql(graphqlOperation(updateUser, {
                    input: {
                        id: items.at(i).id,
                        profilePicture: {
                            bucket: "proxychatf2d762e9bc784204880374b0ca905be4120629-dev",
                            region: "us-east-2",
                            full: "FULLprofilePicture" + items.at(i).id + ".jpg",
                            loadFull: "LOADFULLprofilePicture" + items.at(i).id + ".jpg",
                        }
                    }
                }))
            }
        } catch (error) {
            console.log(error);
        }
    }

    const testObjectUpdate = async () => {
        try {
            const updatedChat = await API.graphql(graphqlOperation(createChatMembers, {
                input: {
                    chatID: "fd30caf6-06c7-43a1-9f2d-408e4f0ac3c8",
                    userID: "befbb1d2-cc43-4651-80cf-126591e2e589",
                }
            }))
            console.log(updatedChat.data.createChatMembers);
        } catch (error) {
            console.log(error);
        }
    }

    const getLoc = async () => {

        const location = await Location.getLastKnownPositionAsync();
        console.log(location);
        setLoc(JSON.stringify(location));
    }

    const getTime = async () => {
        //const messageTime = await API.graphql(graphqlOperation(listMessagesByTime, {
        //    chatMessagesId: "df45ab06-cf1e-4730-bf2f-0b6f2db21844",
        //    limit: 10,
     
        //}))
        const messageTime = await API.graphql(graphqlOperation(getLatestMessagesByTime, {
            chatMessagesId: "df45ab06-cf1e-4730-bf2f-0b6f2db21844",
            limit: 1,
        }))
        //console.log(messageTime.data.listMessagesByTime.items);
        const now = Date.now();
        const msg = Date.parse(messageTime.data.listMessagesByTime.items[0].createdAt);
        const diff = now - msg;
        console.log("=============[ TIME ]============");
        const latest = timeLogic(diff / 1000);
        //console.log("[Now] " + now + ", [Message] " + msg + ", [Diff] " + diff);
        console.log(latest);
    }
    const timeLogic = (diffSeconds) => {
        if (diffSeconds <= 5) {
            return "now"
        } else if (diffSeconds < 60) {
            return "" + Math.floor(diffSeconds) + "s"
        } else if (diffSeconds < (60 * 60)) {
            return "" + Math.floor(diffSeconds / 60) + "m";
        } else if (diffSeconds < (60 * 60 * 24)) {
            return "" + Math.floor(diffSeconds / (60 * 60)) + "h";
        } else if (diffSeconds < (60 * 60 * 24 * 7)) {
            return "" + Math.floor(diffSeconds / (60 * 60 * 24)) + "d";
        } else {
            return "" + Math.floor(diffSeconds / (60 * 60 * 24 * 7)) + "w";
        }
    }

    const sendMessage = async () => {
        try {
            const content = chatName;
            const type = "Regular";
            const chatID = "9bfdfdc1-397e-4551-bf4c-5132bbc3d4f7";
            const userID = "d98f090b-c0fa-4f4d-a3d4-f8a5190a06b5";
            const newMessage = await API.graphql(graphqlOperation(createMessage, {
                input: {
                    userMessagesId: userID,
                    chatMessagesId: chatID,
                    content: content,
                    type: type,
                }
            }))
            console.log(newMessage);
        } catch (error) {
            console.log(error);
        }
    }

    const testNotification = async () => {
        try {
            const response = await API.graphql(graphqlOperation(pinpoint, {
                input: {
                    message: "Hi Its Alexander",
                    token: "ExponentPushToken[B73J63Og8w6coldJVEXwfN]",
                    username: "Alexander",
                    email: "maskeny@umich.edu",
                    id: "befbb1d2-cc43-4651-80cf-126591e2e589",
                }
            }))
            console.log(response);
        } catch (error) {
            console.log(error);
        }
    }

    const getPerms = async () => {
        try {
            const { status } = await Notifications.requestPermissionsAsync();
            if (status != "granted") {
                console.log("No perms");
            }
            const token = await Notifications.getExpoPushTokenAsync();
            console.log(token);
        } catch (error) {
            console.log(error);
        }
    }

    const testUUID = async () => {
        console.log(uuid.v4());
    }

    React.useEffect(() => {
        //const sub = API.graphql(graphqlOperation(Subscriptions.onReceiveMessage, {
        //    chatMessagesId: "9bfdfdc1-397e-4551-bf4c-5132bbc3d4f7"
        //})).subscribe({
        //    next: ({ value }) => console.log(value),
        //    error: (error) => console.warn(error)
        //})
        //return () => {
        //    sub.unsubscribe();
        //}
    }, []);
    const onLongPress = (event) => {
        if (event.nativeEvent.state === State.ACTIVE) {
            console.log("HELD FOR 800 ms");
        }
    }
    const [visible, setVisible] = React.useState(true);
    return (
        <Screen innerStyle={styles.page}>
            {/*<BeamTitle>Alexander</BeamTitle>*/}
            <Image
                source={{
                    uri: 'https://th.bing.com/th/id/R.f6876a4ceeeadaac3322dbd8595122d1?rik=dxcwQ8nRUO9W6A&pid=ImgRaw&r=0',
                    loadImage: "https://th.bing.com/th/id/R.4ef44de48283a70c345215439710e076?rik=DbmjSu8b4rFcmQ&riu=http%3a%2f%2fwww.kneson.com%2fnews%2fIII3%2fKELSEY_AD_example1.jpg&ehk=5jg5ZditRXiSNMQ9tGa0nhrMY8OnQBmFdvwW%2f%2bGfiCU%3d&risl=&pid=ImgRaw&r=0" 
                }}
                style={{ width: 200, height: 200 }}
            />

            <SimpleInput placeholder="username" onChangeText={(text) => { setUsername(text) }} />
            <SimpleButton title="Create user" onPress={() => createNewUser()} />
            <SimpleInput placeholder="code" onChangeText={(text) => { setCode(text) }} />
            <SimpleButton title="Confirm User" onPress={() => confirmUser()} />
            <SimpleButton title="Open" onPress={()=> setVisible(true) } />

            <LongPressGestureHandler
                onHandlerStateChange={onLongPress}
                minDurationMs={800}
            >
                <View style={{height: 200, width: 200,backgroundColor: colors.pBeam} } />
            </LongPressGestureHandler>

            {/*<SimpleInput placeholder="chatName" onChangeText={(text) => { setChatName(text) }} />*/}
            {/*<SimpleButton title="Create Chat" onPress={() => createNewChat()} />*/}

            {/*<SimpleButton title="Create Regular Message" onPress={() => createRegularMessage()} />*/}
            {/*<SimpleButton title="Create Image Message" onPress={() => createImageMessage()} />*/}
            {/*<SimpleButton title="Get Message" onPress={() => getMsg()} />*/}
            {/*<SimpleButton title="Get Chat" onPress={() => getCh()} />*/}
            {/*<SimpleButton title="Fill Data" onPress={() => fillData()} />*/}
            {/*<SimpleButton title="Update Chat" onPress={() => testObjectUpdate()} /> */}
            {/*<SimpleButton title="Send" onPress={() => sendMessage()} /> */}
            {/*<SimpleButton title="Test UUID" onPress={() => testUUID()} />*/}
            {/*<SimpleButton title="Get Time" onPress={() => getTime()} /> */}
        </Screen>
    );
}

const styles = StyleSheet.create({
    page: {
        justifyContent: "center"
    }
})

export default TestScreen;