import React from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Keyboard, Image, Alert, TouchableOpacity, TouchableWithoutFeedback, Platform } from 'react-native';
import { colors } from '../config';
import { Auth } from 'aws-amplify';
import * as Clipboard from 'expo-clipboard';

import Screen from '../comps/Screen';
import SimpleInput from '../comps/SimpleInput';
import SimpleButton from '../comps/SimpleButton';
import Beam from '../comps/Beam';
import SubTitle from '../comps/SubTitle';
import * as logger from '../functions/logger';
import * as perms from '../functions/perms';
import BeamTitle from '../comps/BeamTitle';


//current potential problems:
//1. When clicking off of password text input, something occurs that clears
//the password resulting in text input cleared upon typing.


export default function LoginPage({navigation}) {
    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [passwordVisible, setPasswordVisible] = React.useState(false);
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

    const forgotPassword = async () => {
        navigation.navigate("ForgotPasswordPage1");
    }

    const onSubmit = async () => {
        setSubmitButtonLoad(true);
        var user = username;
        var pass = password;
        clear(); 
        try {
            const response = await Auth.signIn(user, pass);
            if (response) {
                logger.log("Login Successful")
                await perms.getLocation();
                await perms.getNotifications();
                navigation.navigate("LoadingPage") //Actually navigate to loadingpage
            }
        } catch (error) {
            logger.log(error);
            if (error.code == "UserNotConfirmedException") navigation.navigate("SignupPage3");
            else if (error.code == "NotAuthorizedException" || error.code == "UserNotFoundException") {
                Alert.alert("Incorrect Username or Password", "The username or password you entered was incorrect.", [
                    { text: "Try Again" },
                ])
            } else {
                await Clipboard.setStringAsync(error.code + ": " + error.message);
                Alert.alert("Some error occured...", "The error is in your copy/past clipboard.", [
                    { text: "Okay" },
                ])
            }
        }
        setSubmitButtonLoad(false);
    }
    return (
        <Screen>
            <TouchableOpacity activeOpacity={1} onPress={()=>Keyboard.dismiss() }><>
                <KeyboardAvoidingView
                    style={styles.page}
                    behavior={Platform.OS == "android" ? "height" : "padding"}
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
                        textContentType="username"
                        maxLength={20}
                        onChangeText={(text) => {
                            setUsername(text);
                        }}
                    />
                    <SimpleInput
                        reference={passwordRef}
                        placeholder="Password"
                        maxLength={20}
                        textContentType="password"
                        autoCapitalize="none"
                        icon="lock"
                        showRightButton={true}
                        rightButtonProps={{
                            icon: passwordVisible ? "eye-off" : "eye",
                            size: 24,
                            onPress: () => setPasswordVisible(!passwordVisible)
                        }}
                        autocorrect={false}
                        secureTextEntry={!passwordVisible}
                        text={password.length + "/" + "8"}
                        onChangeText={(text) => {
                            setPassword(text);
                        }}
                    />
                    <View height={6} />
                    <SimpleButton
                        title="Login"
                        onPress={onSubmit}
                        disabled={password.length < 8 || username.length < 1}
                        loading={submitButtonLoad}
                    />
                    <View style={styles.footer}>
                        <TouchableOpacity onPress={forgotPassword}>
                            <BeamTitle size={18}>Forgot Password?</BeamTitle>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </></TouchableOpacity>
            <View style={styles.beamContainer}>
                <Beam style={styles.beam} />
                <TouchableOpacity onPress={() => navigation.navigate("AuthPage")}>
                    <SubTitle size={16} style={{ fontWeight: "400" }} color={colors.text2}>Or Create Account</SubTitle>
                </TouchableOpacity>
                <Beam style={styles.beam} />
            </View>
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
        justifyContent: "center",
    },
    logo: {
        height: 80,
        width: "100%"
    },
    beamContainer: {
        width: "100%",
        marginTop: -30,
        paddingHorizontal: 10,
        flexDirection: 'row',
        justifyContent: "space-between",
        alignItems: "center",
    },
    beam: {
        width: "26%",
        borderRadius: 10
    },
    footer: {
        height: 70,
        alignItems: "flex-end",
        padding: 14,
        paddingRight: 20
    }
})