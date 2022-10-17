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
            uri: 'https://cbeyondata.com/wp-content/uploads/2020/10/iStock-1237546531-1920x1280.jpg',
            loadImage: 'https://th.bing.com/th/id/R.4ef44de48283a70c345215439710e076?rik=DbmjSu8b4rFcmQ&riu=http%3a%2f%2fwww.kneson.com%2fnews%2fIII3%2fKELSEY_AD_example1.jpg&ehk=5jg5ZditRXiSNMQ9tGa0nhrMY8OnQBmFdvwW%2f%2bGfiCU%3d&risl=&pid=ImgRaw&r=0',
            key: "Chats1"
        },
        username: "Alexander",
        message: "Hey this is alex, what's up?"
    },
    {
        id: "2",
        ppic: {
            uri: 'https://imgsv.imaging.nikon.com/lineup/dslr/df/img/sample/img_01_l.jpg',
            loadImage: 'https://th.bing.com/th/id/R.4ef44de48283a70c345215439710e076?rik=DbmjSu8b4rFcmQ&riu=http%3a%2f%2fwww.kneson.com%2fnews%2fIII3%2fKELSEY_AD_example1.jpg&ehk=5jg5ZditRXiSNMQ9tGa0nhrMY8OnQBmFdvwW%2f%2bGfiCU%3d&risl=&pid=ImgRaw&r=0',
            key: "Chats2"
        },
        username: "Alexander",
        message: "Hey this is alex, what's up?"
    },
    {
        id: "3",
        ppic: {
            uri: 'https://www.tei.org/sites/default/files/styles/1920w_x_860h/public/NebraskaImage_small.jpg?itok=dxdvUhed',
            loadImage: 'https://th.bing.com/th/id/R.4ef44de48283a70c345215439710e076?rik=DbmjSu8b4rFcmQ&riu=http%3a%2f%2fwww.kneson.com%2fnews%2fIII3%2fKELSEY_AD_example1.jpg&ehk=5jg5ZditRXiSNMQ9tGa0nhrMY8OnQBmFdvwW%2f%2bGfiCU%3d&risl=&pid=ImgRaw&r=0',
            key: "Chats3"
        },
        username: "Alexander",
        message: "Hey this is alex, what's up?"
    },
    {
        id: "4",
        ppic: {
            uri: 'https://cdn57.picsart.com/179951678001202.jpg',
            loadImage: 'https://th.bing.com/th/id/R.4ef44de48283a70c345215439710e076?rik=DbmjSu8b4rFcmQ&riu=http%3a%2f%2fwww.kneson.com%2fnews%2fIII3%2fKELSEY_AD_example1.jpg&ehk=5jg5ZditRXiSNMQ9tGa0nhrMY8OnQBmFdvwW%2f%2bGfiCU%3d&risl=&pid=ImgRaw&r=0',
            key: "Chats4"
        },
        username: "Alexander",
        message: "Hey this is alex, what's up?"
    },
    {
        id: "5",
        ppic: {
            uri: 'https://cbeyondata.com/wp-content/uploads/2020/10/iStock-1237546531-1920x1280.jpg',
            loadImage: 'https://th.bing.com/th/id/R.4ef44de48283a70c345215439710e076?rik=DbmjSu8b4rFcmQ&riu=http%3a%2f%2fwww.kneson.com%2fnews%2fIII3%2fKELSEY_AD_example1.jpg&ehk=5jg5ZditRXiSNMQ9tGa0nhrMY8OnQBmFdvwW%2f%2bGfiCU%3d&risl=&pid=ImgRaw&r=0',
            key: "Chats1"
        },
        username: "Alexander",
        message: "Hey this is alex, what's up?"
    },
    {
        id: "6",
        ppic: {
            uri: 'https://imgsv.imaging.nikon.com/lineup/dslr/df/img/sample/img_01_l.jpg',
            loadImage: 'https://th.bing.com/th/id/R.4ef44de48283a70c345215439710e076?rik=DbmjSu8b4rFcmQ&riu=http%3a%2f%2fwww.kneson.com%2fnews%2fIII3%2fKELSEY_AD_example1.jpg&ehk=5jg5ZditRXiSNMQ9tGa0nhrMY8OnQBmFdvwW%2f%2bGfiCU%3d&risl=&pid=ImgRaw&r=0',
            key: "Chats2"
        },
        username: "Alexander",
        message: "Hey this is alex, what's up?"
    },
    {
        id: "7",
        ppic: {
            uri: 'https://www.tei.org/sites/default/files/styles/1920w_x_860h/public/NebraskaImage_small.jpg?itok=dxdvUhed',
            loadImage: 'https://th.bing.com/th/id/R.4ef44de48283a70c345215439710e076?rik=DbmjSu8b4rFcmQ&riu=http%3a%2f%2fwww.kneson.com%2fnews%2fIII3%2fKELSEY_AD_example1.jpg&ehk=5jg5ZditRXiSNMQ9tGa0nhrMY8OnQBmFdvwW%2f%2bGfiCU%3d&risl=&pid=ImgRaw&r=0',
            key: "Chats3"
        },
        username: "Alexander",
        message: "Hey this is alex, what's up?"
    },
    {
        id: "8",
        isLast: true,
        ppic: {
            uri: 'https://cdn57.picsart.com/179951678001202.jpg',
            loadImage: 'https://th.bing.com/th/id/R.4ef44de48283a70c345215439710e076?rik=DbmjSu8b4rFcmQ&riu=http%3a%2f%2fwww.kneson.com%2fnews%2fIII3%2fKELSEY_AD_example1.jpg&ehk=5jg5ZditRXiSNMQ9tGa0nhrMY8OnQBmFdvwW%2f%2bGfiCU%3d&risl=&pid=ImgRaw&r=0',
            key: "Chats4"
        },
        username: "Alexander",
        message: "Hey this is alex, what's up?"
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