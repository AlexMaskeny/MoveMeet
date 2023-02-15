import { API, graphqlOperation, Storage } from "aws-amplify";

import * as logger from '../functions/logger';
import * as mutations from './mutations/index';
import * as queries from './queries/index';
import * as subscriptions from './subscriptions/index';

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
        if (sendData) {
            return API.graphql(graphqlOperation(subscriptions[call][instance], input)).subscribe({
                next: (data) => onReceive(data),
                error: (error) => onError(error),
            });
        } else {
            return API.graphql(graphqlOperation(subscriptions[call][instance], input)).subscribe({
                next: () => onReceive(),
                error: (error) => onError(error)
            });
        }
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
    }
}