import React from 'react';
import { StyleSheet, View } from 'react-native';
import { API, Auth, graphqlOperation, Storage } from 'aws-amplify';
import Image from "../comps/ImageLoader";
import * as ImagePicker from 'expo-image-picker';


import { colors, debug } from '../config';
import { createUser, updateUser } from '../api/calls';
import BeamTitle from '../comps/BeamTitle';
import SimpleButton from '../comps/SimpleButton';
import Screen from '../comps/Screen';
import SimpleInput from '../comps/SimpleInput';

function TestScreen({ navigation }) {
    //const [image, setImage] = React.useState("https://www.tamiu.edu/newsinfo/images/student-life/campus-scenery.JPG");
    const [username, setUsername] = React.useState("");
    const [code, setCode] = React.useState("");
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
                    email: "alex@maskeny.com"
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
            }, 7);
            console.log(image);
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

    return (
        <Screen innerStyle={styles.page}>
            {/*<BeamTitle>Alexander</BeamTitle>*/}
            {/*<Image*/}
            {/*    source={{*/}
            {/*        uri: image,*/}
            {/*        loadImage: "https://th.bing.com/th/id/R.4ef44de48283a70c345215439710e076?rik=DbmjSu8b4rFcmQ&riu=http%3a%2f%2fwww.kneson.com%2fnews%2fIII3%2fKELSEY_AD_example1.jpg&ehk=5jg5ZditRXiSNMQ9tGa0nhrMY8OnQBmFdvwW%2f%2bGfiCU%3d&risl=&pid=ImgRaw&r=0" */}
            {/*    }}*/}
            {/*    style={{ width: 200, height: 200 }} />*/}
            <SimpleInput placeholder="username" onChangeText={(text) => { setUsername(text) }} />
            <SimpleButton title="Create user" onPress={() => createNewUser()} />
            <SimpleInput placeholder="code" onChangeText={(text) => { setCode(text) }} />
            <SimpleButton title="Confirm User" onPress={() => confirmUser()} />
        </Screen>
    );
}

const styles = StyleSheet.create({
    page: {
        justifyContent: "center"
    }
})

export default TestScreen;