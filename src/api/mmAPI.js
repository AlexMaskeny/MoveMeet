import { API, graphqlOperation } from "aws-amplify";

import * as logger from '../functions/logger';
import * as mutations from './mutations';
import * as queries from './queries';
import * as subscriptions from './subscriptions';

export const instances = {
    FULL: "full",
}

export const calls = {
    //QUERIES
    GET_CHAT: "getChat",
    GET_CHAT_MEMBERS: "getChatMembers",
    GET_CHAT_MEMBERS_BY_IDS: "getChatMembersByIds",
    GET_MESSAGE: "getMessage",
    GET_USER: "getUser",
    GET_USER_BY_COGNITO: "getUserByCognito",
    GET_USER_BY_USERNAME: "getUserByUsername",
    LIST_BROADCASTS: "listBroadcasts",
    LIST_CHAT_MEMBERS: "listChatMembers",
    LIST_CHATS_BY_LOCATION: "listChatsByLocation",
    LIST_MESSAGES_BY_TIME: "listMessagesByTime",
    LIST_USERS_BY_LOCATION: "listUsersByLocation",
    LIST_USERS_BY_USERNAME: "listUsersByUsername",
    //MUTATIONS
    CREATE_BUG: "createBug",
    CREATE_CHAT_MEMBERS: "createChatMembers",
    CREATE_MESSAGE: "createMessage",
    CREATE_POST: "createPost",
    CREATE_REPORT: "createReport",
    CREATE_USER: "createUser",
    DELETE_USER: "deleteUser",
    UPDATE_CHAT_MEMBERS: "updateChatMembers",
    UPDATE_USER: "updateUser",
    //SUBSCRIPTIONS:
    ON_MEMBER_STATUS_CHANGE: "onMemberStatusChange",
    ON_READ_MESSAGE: "onReadMessage",
    ON_RECEIVE_MESSAGE: "onReceiveMessage",
    ON_USER_REMOVED: "onUserRemoved",
    ON_USER_TYPING: "onUserTyping",
}

//CALL IS IN FORMAT: call: {callString: string,isArray: }
export const mmAPI = {
    query: async ({ call = "", instance = instances.FULL, input = {} }) => { //input is of standard query input form 
        try {
            return (await API.graphql(graphqlOperation(queries[call][instance], input))).data[call];
        } catch (error) {
            logger.warn(error);
            return false;
        }
    },
    mutate: async ({ call = "", instance = instances.FULL, input = {} }) => { //input is of standard mutation form
        try {
            return (await API.graphql(graphqlOperation(mutations[call][instance], { input: input }))).data[call];
        } catch (error) {
            logger.warn(error);
            return false;
        }
    },
    subscribe: async({ call = "", instance = instances.FULL, input = {}, onReceive, onError }) => { //input is of standard sub from. onReceive & onError are functions
        return API.graphql(graphqlOperation(mutations[call][instance]))
    },
    store: async (uri, id) => {

    }
}