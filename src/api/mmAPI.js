import { ConnectionState, CONNECTION_STATE_CHANGE } from "@aws-amplify/pubsub";
import { API, graphqlOperation, Hub, Storage } from "aws-amplify";
import { rules } from "../config";

import * as logger from '../functions/logger';
import * as mutations from './mutations/index';
import * as queries from './queries/index';
import * as subscriptions from './subscriptions/index';

var priorConnectionState = "begin";
var subSafeCreationDate;
var subUpdateTimeout;
var currentSubSafe;

export const instances = {
    FULL: "full", //Everything used
    EMPTY: "empty", //Only ID
    LEAST: "least" //Minimum type with a non id
}

export const calls = {
    //QUERIES
    GET_CHAT: "getChat", //LoadingPage(loadingPage)
    GET_CHAT_MEMBERS: "getChatMembers",
    GET_CHAT_MEMBERS_BY_IDS: "getChatMembersByIds", //LoadingPage(loadingPage)
    GET_MESSAGE: "getMessage",
    GET_USER: "getUser", //chatsPage(chats)
    GET_USER_BY_COGNITO: "getUserByCognito", //LoadingPage(least), ChatsPage(least)
    GET_USER_BY_USERNAME: "getUserByUsername",
    LIST_BROADCASTS: "listBroadcasts", //LoadingPage(full)
    LIST_CHAT_MEMBERS: "listChatMembers",
    LIST_CHATS_BY_LOCATION: "listChatsByLocation", //LoadingPage(loadingPage)
    LIST_MESSAGES_BY_TIME: "listMessagesByTime", //ChatsPage(chatsPage)
    LIST_USERS_BY_LOCATION: "listUsersByLocation",
    LIST_USERS_BY_USERNAME: "listUsersByUsername",
    //MUTATIONS
    CREATE_BUG: "createBug",
    CREATE_CHAT_MEMBERS: "createChatMembers",
    CREATE_MESSAGE: "createMessage",
    CREATE_POST: "createPost",
    CREATE_REPORT: "createReport",
    CREATE_USER: "createUser",
    CREATE_CHAT: "createChat",
    DELETE_USER: "deleteUser",
    DELETE_CHAT_MEMBERS: "deleteChatMembers", //LoadingPage(empty)
    DELETE_POST: "deletePost",
    UPDATE_CHAT_MEMBERS: "updateChatMembers",
    UPDATE_USER: "updateUser", //LoadingPage(empty)
    UPDATE_CHAT: "updateChat", //ChatsPage(empty)
    UPDATE_MESSAGE: "updateMessage",
    //SUBSCRIPTIONS:
    ON_MEMBER_STATUS_CHANGE: "onMemberStatusChange", //ChatsPage(chatsPage)
    ON_READ_MESSAGE: "onReadMessage",
    ON_RECEIVE_MESSAGE: "onReceiveMessage", //ChatsPage
    ON_USER_REMOVED: "onUserRemoved",
    ON_USER_TYPING: "onUserTyping",
}

//CALL IS IN FORMAT: call: {callString: string,isArray: }
export const mmAPI = {
    query: async ({ call = "", instance = instances.EMPTY, input = {} }) => { //input is of standard query input form 
        try {
            const response = await API.graphql(graphqlOperation(queries[call][instance], input));
            return response.data[call];
        } catch (error) {
            logger.warn(error);
            return false;
        }
    },
    mutate: async ({ call = "", instance = instances.EMPTY, input = {} }) => { //input is of standard mutation form
        try {
            const response = await API.graphql(graphqlOperation(mutations[call][instance], { input: input }));
            return response.data[call];
        } catch (error) {
            logger.warn(error);
            return false;
        }
    },
    subscribe: ({ call = "", instance = instances.FULL, input = {}, sendData = false, onReceive, onError }) => { //input is of standard sub from. onReceive & onError are functions
        return (API.graphql(graphqlOperation(subscriptions[call][instance], input)).subscribe({
            next: ({ value }) => {
                if (sendData) {
                    onReceive(value.data[call])
                } else {
                    onReceive();
                }
            },
            error: (error) => onError(error),
        }));
    },
    store: async (id, uri) => {
        try {
            const response = await fetch(uri);
            if (response) {
                const img = await response.blob();
                if (img) {
                    await Storage.put(id, img);
                    return true;
                } else throw "Failed Store Img Response (response 2)";
            } else throw "Failed Store Response 1";
        } catch (error) {
            logger.warn(error); 
            return false;
        }
    },
    subSafe: (update) => {
        //This is a mechancism used on subscribing pages.
        //It will refresh the page whenever any of the following condtions occur:
        //1. The sub was connecting and is now connected
        //2. The sub was connected without internet and is now connected with internet
        //3. The sub was connected but missed a message due to being out of the app or some other thing and is now back online.
        //
        //If the subSafe detects that there has been a refresh occuring within the configured number (2) seconds of its initialization then it will not refresh.
        subSafeCreationDate = Date.now();
        priorConnectionState = "begin";
        try {
            currentSubSafe();
        } catch (error) { }
        try {
            clearTimeout(subUpdateTimeout);
        } catch (error) { }
        currentSubSafe = Hub.listen('api', (data) => {
            const { payload } = data;
            ConnectionState.ConnectedPendingKeepAlive
            if (payload.event == CONNECTION_STATE_CHANGE) {
                logger.eLog("=========[SUBSAFE]=========");
                logger.eLog("Prev: " + priorConnectionState);
                logger.eLog("Current: " + payload.data.connectionState);
                logger.eLog("Date of subSafe creation: " + subSafeCreationDate);
                logger.eLog("Date of now: " + Date.now());
                logger.eLog("Diff in ms: " + (Date.now() - subSafeCreationDate));
                logger.eLog("===========================");
                const condition1 = (priorConnectionState === ConnectionState.Connecting && payload.data.connectionState === ConnectionState.Connected) //Trigger if a sub was connecting and is now enabled
                const condition2 = (priorConnectionState === ConnectionState.ConnectedPendingNetwork && payload.data.connectionState === ConnectionState.Connected); //Trigger if a sub was enabled, internet went offline but its now back.
                const condition3 = (priorConnectionState === ConnectionState.ConnectedPendingKeepAlive && payload.data.connectionState === ConnectionState.Connected); //Trigger if sub is okay, but it missed some message.
                const requiredCondition1 = Date.now() - subSafeCreationDate > rules.subSafeInitializationDelay;
                if ((condition1 || condition2 || condition3) && requiredCondition1) {
                    logger.warn("[SUBSAFE] Refreshing...");
                    try {
                        clearTimeout(subUpdateTimeout);
                    } catch (error) { }
                    subUpdateTimeout = setTimeout(update, rules.subSafeUpdateTimeout);
                }
                priorConnectionState = payload.data.connectionState
            }
        });
        return () => {
            subSafeCreationDate = Date.now();
            priorConnectionState = "begin";
            try {
                currentSubSafe();
            } catch (error) { }
            try {
                clearTimeout(subUpdateTimeout);
            } catch (error) { }
        }
    },
}