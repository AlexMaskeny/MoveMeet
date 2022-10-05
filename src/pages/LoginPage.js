import React from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Keyboard, Image, Alert } from 'react-native';
import { colors, debug } from '../config';
import { Auth } from 'aws-amplify';

import Screen from '../comps/Screen';
import SimpleInput from '../comps/SimpleInput';
import SimpleButton from '../comps/SimpleButton';

//current potential problems:
//1. When clicking off of password text input, something occurs that clears
//the password resulting in text input cleared upon typing.


function LoginPage({navigation}) {
    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");
    const usernameRef = React.useRef();
    const passwordRef = React.useRef();
    const [lButtonLoad, setLButtonLoad] = React.useState(false);

    //REQUIRES: none
    //MODIFIES: none
    //EFFECTS: resets login inputs to values
    //         present during first render
    const clear = () => {
        Keyboard.dismiss(); //Is this line necessary??
        setUsername("");
        setPassword("");
        usernameRef.current.clear()
        passwordRef.current.clear();
    }

    //REQUIRES: internet connection
    //MODIFIES: none
    //EFFECTS: triggers clear function & logs user
    //         in if effective, otherwise sends Alert 
    //         error box to user.
    const LButtonPress = async () => {
        setLButtonLoad(true);
        var user = username;
        var pass = password;
        clear();
        try {
            const response = await Auth.signIn(user, pass);
            if (response) {
                if (debug) console.log("Login Successful");
                navigation.navigate("SecondaryNav")
            }
        } catch (error) {
            if (debug) console.log(error.code);
            if (error.code == "UserNotConfirmedException") {
                //Do a thing
            } else if (error.code == "NotAuthorizedException" || error.code == "UserNotFoundException") {
                Alert.alert("Incorrect Username or Password", "The username or password you entered was incorrect.", [
                    { text: "Try Again" },
                ])
            } else {

                Alert.alert("Error", "And error occured...", [
                    { text: "Try Again" },
                ])
            }
        }
        setLButtonLoad(false);
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
                    onPress={LButtonPress}
                    disabled={password.length < 8 || username.length < 4}
                    loading={lButtonLoad}
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

export default LoginPage;