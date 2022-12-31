import { API, graphqlOperation } from "aws-amplify"
import * as calls from '../api/calls';
import * as logger from '../functions/logger';

export const onMemberStatusChange = ({ userID, subVariable, onReception }) => {
    if (subVariable) {
        subVariable.unsubscribe();
        subVariable = null;
    }
    subVariable = API.graphql(graphqlOperation(calls.onMemberStatusChange, {
        userID: userID
    })).subscribe({
        next: ({ value }) => {
            logger.eLog("[SUBMANAGER]: onMemberStatusChange notification received.");
            onReception(value);
        },
        error: (error) => {
            if (subVariable) {
                subVariable.unsubscribe();
            }
            logger.warn(error);
            logger.eWarn("[SUBMANAGER]: Error detected receiving onMemberStatusChange notification. Reconnecting...");
            //onMemberStatusChange({ userID, subVariable, onReception });
        }
    })
}

export const userChats = ({ chatData, subVariable, onReception }) => {
    const unsubscribe = () => {
        if (subVariable.length > 0) {
            for (var i = 0; i < subVariable.length; i++) {
                subVariable[i].unsubscribe();
            }
            subVariable = [];
        }
    }
    unsubscribe();
    for (var i = 0; i < chatData.length; i++) {
        subVariable.push(API.graphql(graphqlOperation(calls.onReceiveMessage, {
            chatMessagesId: chatData[i].id,
        })).subscribe({
            next: ({ value } ) => {
                logger.eLog("[SUBMANAGER]: userChats notification received.");
                onReception(value);
            },
            error: (error) => {
                unsubscribe();
                logger.warn(error);
                logger.eWarn("[SUBMANAGER]: Error detected receiving userChats notification. Rerunning ALL chat subs");
                //userChats({ chatData, subVariable, onReception });
            }
        }));
    }
}