import React from 'react';
import { StyleSheet, Image, ActivityIndicator, View, Keyboard, KeyboardAvoidingView } from 'react-native';
import { useKeyboard } from '@react-native-community/hooks'

import Screen from '../comps/Screen';
import SimpleButton from '../comps/SimpleButton';
import SimpleInput from '../comps/SimpleInput';

//DESCRIPTION: A primary page of the SecondaryNav
//             is the hub for all localized chats

function ChatPage({ navigation }) {
    const [msg, setMsg] = React.useState("");
    const msgRef = React.useRef();
    const Keyboard = useKeyboard();
    return (
        <Screen innerStyle={styles.page}>

                <SimpleInput
                    reference={msgRef}
                    placeholder="Say something"
                    cStyle={{ overflow: "hidden" }}
                    tStyle={styles.message}
                    autoFocus={true}
                    multiline={true}
                    maxLength={300}
                    keyboardAppearance="dark"
                    onChangeText={(text) => {
                        setMsg(text);
                    } }
            />
            <View style={{ height: Keyboard.keyboardHeight-20 }} />


        </Screen>
    );
}

const styles = StyleSheet.create({
    message: {
        paddingVertical: 10,
        paddingTop: 10,
        maxHeight: 120
    },
    page: {
        justifyContent: "flex-end",

        
    }

})

export default ChatPage;