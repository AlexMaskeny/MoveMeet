import React from 'react';
import { StyleSheet, Image, ActivityIndicator, FlatList, View, KeyboardAvoidingView } from 'react-native';
import IconButton from '../comps/IconButton';

import {colors,css,debug } from '../config'
import Screen from '../comps/Screen';
import SimpleButton from '../comps/SimpleButton';
import SimpleInput from '../comps/SimpleInput';
import DarkBeam from '../comps/DarkBeam';
import SimpleMessage from '../comps/SimpleMessage';

//DESCRIPTION: A primary page of the SecondaryNav
//             is the hub for all localized chats

//REMOVE ON PRODUCTON [START]
//!!!!!!
//!!!!!!
//!!!!!!
const chats = [
    {
        id: "1",
        username: "Alexander",
        message: "Hey this is alex, what's up?"
    },
    {
        id: "2",
        username: "Alexander",
        message: "Hey this is alex, what's up?"
    },
    {
        id: "3",
        username: "Alexander",
        message: "Hey this is alex, what's up?"
    },
    {
        id: "4",
        username: "Alexander",
        message: "Hey this is alex, what's up?"
    },
    {
        id: "5",
        username: "Alexander",
        message: "Hey this is alex, what's up?"
    },
    {
        id: "6",
        username: "Alexander",
        message: "Hey this is alex, what's up?"
    },
    {
        id: "7",
        username: "Alexander",
        message: "Hey this is alex, what's up?"
    },
    {
        id: "8",
        username: "Alexander",
        message: "Hey this is alex, what's up?"
    },
    {
        id: "9",
        username: "Alexander",
        message: "Hey this is alex, what's up?"
    },
    {
        id: "10",
        username: "Alexander",
        message: "Hey this is alex, what's up?"
    },
    {
        id: "11",
        username: "Alexander",
        message: "Hey this is alex, what's up?"
    },
    {
        id: "12",
        username: "Alexander",
        message: "Hey this is alex, what's up?"
    },
    {
        id: "13",
        username: "Alexander",
        message: "Hey this is alex, what's up?"
    },
]
//!!!!!!
//!!!!!!
//!!!!!!
//REMOVE ON PRODUCTON [END]

function ChatPage({ route }) {
    const [msg, setMsg] = React.useState("");
    const msgRef = React.useRef();
    return (
        <Screen innerStyle={styles.page}>
            <KeyboardAvoidingView style={{ flex: 1, justifyContent: "flex-end" }} behavior="padding">
                <View style={styles.chats}>
                    <FlatList
                        data={chats}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <View style={{margin: 6} }>
                                <SimpleMessage
                                    ppic={{ uri: 'https://alexmaskeny.com/wp-content/uploads/2020/11/dragonbackground.jpg' }}
                                    username={item.username}
                                    message={item.message}
                                />
                             </View>
                        )}
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
                        autoFocus={false}
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
    textBox: {
        flexDirection: "row",
        marginHorizontal: 10,
        alignItems: "flex-end"
    },

})

export default ChatPage;