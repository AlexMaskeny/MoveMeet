import { useKeyboard } from '@react-native-community/hooks';
import React from 'react';
import { StyleSheet, Image, ActivityIndicator, View, KeyboardAvoidingView } from 'react-native';
import IconButton from '../comps/IconButton';

import {colors,css } from '../config'
import Screen from '../comps/Screen';
import SimpleButton from '../comps/SimpleButton';
import SimpleInput from '../comps/SimpleInput';
import DarkBeam from '../comps/DarkBeam';
import SimpleMessage from '../comps/SimpleMessage';

//DESCRIPTION: A primary page of the SecondaryNav
//             is the hub for all localized chats

function ChatPage({ route }) {
    const [msg, setMsg] = React.useState("");
    const msgRef = React.useRef();
    const Keyboard = useKeyboard();
    //React.useEffect(() => {
    //    console.log(route.params.KeyboardHeight)
    //},[])
    return (
        <Screen innerStyle={styles.page}>
            <View style={styles.chats}>
                <SimpleMessage
                    ppic={{ uri: 'https://alexmaskeny.com/wp-content/uploads/2020/11/dragonbackground.jpg' }}
                    username="Alexander"
                    message="Hey this is alex, what's up?"
                />

            </View>
            <DarkBeam style={{ backgroundColor: colors.container, height: 1, marginBottom: 10}} />
            <View style={styles.textBox}>
                <IconButton
                    icon="camera"
                    brand="Ionicons"
                    color={colors.text3}
                    style={{ marginBottom: 6, }}
                    size={34}
                    onPress={() => { if (debug) console.log("Open Camera") }}
                />
                <View style={{width: 10} } />
                <IconButton
                    icon="add-circle"
                    brand="Ionicons"
                    color={colors.text3}
                    size={34}
                    style={{ marginBottom: 6, } }
                    onPress={() => { if (debug) console.log("Open Camera Roll") }}
                />
                <SimpleInput
                    reference={msgRef}
                    placeholder="Say something"
                    cStyle={{ overflow: "hidden", flex: 1, }}
                    tStyle={styles.message}
                    autoFocus={true}
                    multiline={true}
                    maxLength={300}
                    keyboardAppearance="dark"
                    onChangeText={(text) => {
                        setMsg(text);
                    } }
                />
                <IconButton
                    icon="arrow-forward-circle"
                    brand="Ionicons"
                    color={colors.pBeam}
                    size={34}
                    style={{
                        ...css.beamShadow,
                        shadowColor: colors.pBeamShadow,
                        marginBottom: 6,
                    }}
                    onPress={() => { if (debug) console.log("Send") }}
                />
            </View>
            <View style={{ height: route.params.KeyboardHeight == 0 ? Keyboard.keyboardHeight - 24 : route.params.KeyboardHeight-24 }} />


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
        margin: 6,
    },
    page: {
        justifyContent: "flex-end",

        
    },
    textBox: {
        flexDirection: "row",
        marginHorizontal: 10,
        alignItems: "flex-end"
    },

})

export default ChatPage;