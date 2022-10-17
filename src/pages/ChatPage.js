import React from 'react';
import { StyleSheet, Image, ActivityIndicator, Alert, FlatList, View, KeyboardAvoidingView } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import * as ImagePicker from 'expo-image-picker';
import { Storage } from 'aws-amplify'

import IconButton from '../comps/IconButton';
import {colors,css,debug } from '../config'
import Screen from '../comps/Screen';
import SimpleButton from '../comps/SimpleButton';
import SimpleInput from '../comps/SimpleInput';
import DarkBeam from '../comps/DarkBeam';
import Beam from '../comps/Beam';
import ComplexMessage from '../comps/ComplexMessage';
import BeamTitle from '../comps/BeamTitle';
import SubTitle from '../comps/SubTitle';

//DESCRIPTION: A primary page of the SecondaryNav
//             is the hub for all localized chats

//REMOVE ON PRODUCTON [START]
//!!!!!!
//!!!!!!
//!!!!!!
const chats = [
    {
        id: "1", 
        isFirst: true,
        ppic: {
            uri: 'https://alexmaskeny.com/wp-content/uploads/2020/11/dragonbackground.jpg',
            loadImage: 'https://alexmaskeny.com/wp-content/uploads/2022/10/dragonbackground-e1665935077983.jpg',
            key: "Chats1"
        },
        username: "Alexander",
        message: "Hey this is alex, what's up?"
    },
    {
        id: "2",
        ppic: {
            uri: 'https://alexmaskeny.com/wp-content/uploads/2020/11/dragonbackground.jpg',
            loadImage: 'https://alexmaskeny.com/wp-content/uploads/2022/10/dragonbackground-e1665935077983.jpg',
            key: "Chats2"
        },
        username: "Alexander",
        message: "Hey this is alex, what's up?"
    },
    {
        id: "3",
        ppic: {
            uri: 'https://alexmaskeny.com/wp-content/uploads/2020/11/dragonbackground.jpg',
            loadImage: 'https://alexmaskeny.com/wp-content/uploads/2022/10/dragonbackground-e1665935077983.jpg',
            key: "Chats3"
        },
        username: "Alexander",
        message: "Hey this is alex, what's up?"
    },
    {
        id: "4",
        ppic: {
            uri: 'https://alexmaskeny.com/wp-content/uploads/2020/11/dragonbackground.jpg',
            loadImage: 'https://alexmaskeny.com/wp-content/uploads/2022/10/dragonbackground-e1665935077983.jpg',
            key: "Chats4"
        },
        username: "Alexander",
        message: "Hey this is alex, what's up?"
    },
    {
        id: "5",
        ppic: {
            uri: 'https://alexmaskeny.com/wp-content/uploads/2020/11/dragonbackground.jpg',
            loadImage: 'https://alexmaskeny.com/wp-content/uploads/2022/10/dragonbackground-e1665935077983.jpg',
            key: "Chats5"
        },
        username: "Alexander",
        message: "Hey this is alex, what's up?"
    },
    {
        id: "6",
        ppic: {
            uri: 'https://alexmaskeny.com/wp-content/uploads/2020/11/dragonbackground.jpg',
            loadImage: 'https://alexmaskeny.com/wp-content/uploads/2022/10/dragonbackground-e1665935077983.jpg',
            key: "Chats6"
        },
        username: "Alexander",
        message: "Hey this is alex, what's up?"
    },
    {
        id: "7",
        ppic: {
            uri: 'https://alexmaskeny.com/wp-content/uploads/2020/11/dragonbackground.jpg',
            loadImage: 'https://alexmaskeny.com/wp-content/uploads/2022/10/dragonbackground-e1665935077983.jpg',
            key: "Chats7"
        },
        username: "Alexander",
        message: "Hey this is alex, what's up?"
    },
    {
        id: "8",
        ppic: {
            uri: 'https://alexmaskeny.com/wp-content/uploads/2020/11/dragonbackground.jpg',
            loadImage: 'https://alexmaskeny.com/wp-content/uploads/2022/10/dragonbackground-e1665935077983.jpg',
            key: "Chats8"
        },
        username: "Alexander",
        message: "Hey this is alex, what's up?"
    },
    {
        id: "9",
        ppic: {
            uri: 'https://alexmaskeny.com/wp-content/uploads/2020/11/dragonbackground.jpg',
            loadImage: 'https://alexmaskeny.com/wp-content/uploads/2022/10/dragonbackground-e1665935077983.jpg',
            key: "Chats9"
        },
        username: "Alexander",
        message: "Hey this is alex, what's up?"
    },
    {
        id: "10",
        ppic: {
            uri: 'https://alexmaskeny.com/wp-content/uploads/2020/11/dragonbackground.jpg',
            loadImage: 'https://alexmaskeny.com/wp-content/uploads/2022/10/dragonbackground-e1665935077983.jpg',
            key: "Chats10"
        },
        username: "Alexander",
        message: "Hey this is alex, what's up?"
    },
    {
        id: "11",
        ppic: {
            uri: 'https://alexmaskeny.com/wp-content/uploads/2020/11/dragonbackground.jpg',
            loadImage: 'https://alexmaskeny.com/wp-content/uploads/2022/10/dragonbackground-e1665935077983.jpg',
            key: "Chats11"
        },
        username: "Alexander",
        message: "Hey this is alex, what's up?"
    },
    {
        id: "12",
        ppic: {
            uri: 'https://alexmaskeny.com/wp-content/uploads/2020/11/dragonbackground.jpg',
            loadImage: 'https://alexmaskeny.com/wp-content/uploads/2022/10/dragonbackground-e1665935077983.jpg',
            key: "Chats12"
        },
        username: "Alexander",
        message: "Hey this is alex, what's up?"
    },
    {
        id: "13",
        ppic: {
            uri: 'https://alexmaskeny.com/wp-content/uploads/2020/11/dragonbackground.jpg',
            loadImage: 'https://alexmaskeny.com/wp-content/uploads/2022/10/dragonbackground-e1665935077983.jpg',
            key: "Chats13"
        },
        username: "Alexander",
        message: "Hey this is alex, what's upssssssssssssssssssssssssssssssssssssssssssss?\nHey this is alex, what's up?\nHey this is alex, what's up?"
    },
    {
        id: "14",
        isLast: true,
        ppic: {
            uri: 'https://alexmaskeny.com/wp-content/uploads/2020/11/dragonbackground.jpg',
            loadImage: 'https://alexmaskeny.com/wp-content/uploads/2022/10/dragonbackground-e1665935077983.jpg',
            key: "Chats14"
        },
        username: "Gracee",
        message: "Hey this is Graceeeee, what's upssssssssssssssssssssssssssssssssssssssssssss?\nHey this is graceeee, what's up?\nHey this is grace, what's up?"
    },
]
//!!!!!!
//!!!!!!
//!!!!!!
//REMOVE ON PRODUCTON [END]


function ChatPage({ route, navigation }) {
    const [msg, setMsg] = React.useState("");
    const msgRef = React.useRef();
    const chatsRef = React.useRef();
    const headerHeight = useHeaderHeight();

    React.useEffect(() => {
        const unsubscribe = navigation.addListener('transitionEnd', () => {
            msgRef.current.focus();
        })
        return unsubscribe;
    }, [navigation])

    const selectImage = async () => {
        const cameraRollStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (cameraRollStatus.granted) {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: "Images",
                aspect: [4, 3],
                quality: 1,
            })
            await uploadImage(result);
        } else {
            Alert.alert("No Permsision");
        }
    }
    const uploadImage = async (pickerResult) => {
        try {
            if (pickerResult.cancelled) {
                return
            } else {
                const response = await fetch(pickerResult.uri);
                const img = await response.blob();
                
                const result = await Storage.put("Alexander.jpg", img);
                if (debug) console.log(result);
            }
        } catch (error) {
            if (debug) console.log(error);
        }
    }
    return (
        <Screen innerStyle={styles.page}>
            <KeyboardAvoidingView style={{ flex: 1, justifyContent: "flex-end" }} behavior="padding" keyboardVerticalOffset={headerHeight+4}>
                <View style={styles.chats}>
                    <FlatList
                        data={chats}
                        ref={chatsRef}
                        keyExtractor={item => item.id}
                        renderItem={({ item, index }) => {
                            if (item.isFirst) {
                                return (
                                    <>
                                        <View style={{ alignItems: "center", justifyContent: "center", marginTop: 10 }}>
                                            <BeamTitle size={18}>Begining of Chat</BeamTitle>
                                            <SubTitle size={14}>Say Something in {route.params.name}</SubTitle>
                                            <SubTitle color={colors.text3}>Created on {route.params.created}</SubTitle>
                                        </View>
                                        <DarkBeam
                                            style={{
                                                backgroundColor: colors.container,
                                                height: 1,
                                                marginBottom: 4,
                                                marginTop: 10,
                                            }}
                                        />
                                        <View style={{ margin: 6 }}>
                                        <ComplexMessage
                                            ppic={item.ppic}
                                            time="1m"
                                            username={item.username}
                                            message={item.message}
                                        />
                                        </View>
                                    </>
                                )
                            }
                            return (
                                <View style={{ margin: 6, marginBottom: item.isLast ? 14 : 6 }}>
                                    <ComplexMessage
                                        ppic={item.ppic}
                                        time="1m"
                                        username={item.username}
                                        message={item.message}
                                    />
                                </View>                         
                            )
                        }}
                    />

                </View>
                {/*<Beam style={{ height: 1, marginBottom: 10 }} />*/}
                <DarkBeam
                    style={{
                        backgroundColor: colors.container,
                        height: 1,
                        marginBottom: 4,
                        marginTop: 0,
                        ...css.beamShadow,
                        shadowColor: "black",
                    }}
                />
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
                        onPress={() => { selectImage() }}
                    />
                    <SimpleInput
                        reference={msgRef}
                        placeholder="Say something"
                        cStyle={{ overflow: "hidden", flex: 1, }}
                        onFocus={async() => {
                            if (debug) console.log("Focus")
                            setTimeout(async function () {
                                chatsRef.current.scrollToEnd()
                            }, 40);
                        }}
                        tStyle={styles.message}
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
        alignItems: "flex-end",
    },

})

export default ChatPage;