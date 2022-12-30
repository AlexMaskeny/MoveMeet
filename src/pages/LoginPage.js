import React from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Keyboard, Image, Alert } from 'react-native';
import { colors, debug } from '../config';
import { Auth } from 'aws-amplify';

import Screen from '../comps/Screen';
import SimpleInput from '../comps/SimpleInput';
import SimpleButton from '../comps/SimpleButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';

//current potential problems:
//1. When clicking off of password text input, something occurs that clears
//the password resulting in text input cleared upon typing.


export default function LoginPage({navigation}) {
    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");
    const usernameRef = React.useRef();
    const passwordRef = React.useRef();
    const [submitButtonLoad, setSubmitButtonLoad] = React.useState(false);

    const clear = () => {
        Keyboard.dismiss();
        setUsername("");
        setPassword("");
        usernameRef.current.clear()
        passwordRef.current.clear();
    }

    const onSubmit = async () => {
        setSubmitButtonLoad(true);
        var user = username;
        var pass = password;
        clear(); 
        try {
            const response = await Auth.signIn(user, pass);
            if (response) {
                if (debug) console.log("Login Successful");
                // If user terminates after vertication but before setting things up, thats okay we'll tutorial a blank profile.
                navigation.navigate("LoadingPage") //Actually navigate to loadingpage
            }
        } catch (error) {
            if (debug) console.log(error.code);
            if (error.code == "UserNotConfirmedException") {
                await AsyncStorage.setItem('unconfirmed', JSON.stringify({ val: true })); 
                //SEND TO SIGNUPPAGE with route UserNotConfirmedException
            } else if (error.code == "NotAuthorizedException" || error.code == "UserNotFoundException") {
                Alert.alert("Incorrect Username or Password", "The username or password you entered was incorrect.", [
                    { text: "Try Again" },
                ])
            } else {
                await Clipboard.setStringAsync(error.code + ": " + error.message);
                Alert.alert("Error", "Some error occured...", [
                    { text: "Okay" },
                ])

            }
        }
        setSubmitButtonLoad(false);
    }
    return (
        <Screen>
            <KeyboardAvoidingView
                style={styles.page}
                behavior="padding"
            >
                <Image
                    source={require('../../assets/Logo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
                <View height={6} />
                <SimpleInput
                    reference={usernameRef}
                    placeholder="Username"
                    autocorrect={false}
                    icon="account"
                    autoCapitalize="none"
                    maxLength={20}
                    text={username.length + "/" + "4"}
                    onChangeText={(text) => {
                        setUsername(text);
                    }}
                />
                <SimpleInput
                    reference={passwordRef}
                    placeholder="Password"
                    maxLength={20}
                    autoCapitalize="none"
                    icon="lock"
                    autocorrect={false}
                    secureTextEntry={true}
                    text={password.length + "/" + "8"}
                    onChangeText={(text) => {
                        setPassword(text);
                    }}
                />
                <View height={6} />
                <SimpleButton
                    title="Login"
                    onPress={onSubmit}
                    disabled={password.length < 8 || username.length < 4}
                    loading={submitButtonLoad}
                />
            </KeyboardAvoidingView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    text: {
        color: colors.text1
    },
    page: {
        width: "100%",
        height: "100%",
        justifyContent: "center"
    },
    logo: {
        height: 60,
        width: "100%"
    }
})