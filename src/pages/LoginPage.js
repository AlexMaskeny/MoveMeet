//region 3rd Party Imports
import React, {useState, useRef} from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Keyboard, Image, Alert, TouchableOpacity, TouchableWithoutFeedback, Platform } from 'react-native';
import { dark_colors } from '../config';
import { Auth } from 'aws-amplify';
import NetInfo from "@react-native-community/netinfo";
//endregion
//region 1st Party Imports
import Screen from '../comps/Screen';
import SimpleInput from '../comps/SimpleInput';
import SimpleButton from '../comps/SimpleButton';
import Beam from '../comps/Beam';
import SubTitle from '../comps/SubTitle';
import * as logger from '../functions/logger';
import * as perms from '../functions/perms';
import BeamTitle from '../comps/BeamTitle';
//endregion

export default function LoginPage({navigation}) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [submitButtonLoad, setSubmitButtonLoad] = useState(false);

    const usernameRef = useRef();
    const passwordRef = useRef();
    //region [FUNCTION]   "clear = ()" = Clears all of the inputs
    const clear = () => {
        Keyboard.dismiss();
        setUsername("");
        setPassword("");
        usernameRef.current.clear()
        passwordRef.current.clear();
    }
    //endregion
    //region [FUNC ASYNC] "forgotPassword = async ()" = Navigates user to forgot password page
    const forgotPassword = async () => {
        navigation.navigate("ForgotPasswordPage1");
    }
    //endregion

    const onSubmit = async () => {
        //Begin loading
        setSubmitButtonLoad(true);

        //Save the current username & password values. Clear the actual inputs.
        let user = username;
        let pass = password;
        clear();

        try {
            //region Ensure the user is connected
            const netInfo = await NetInfo.fetch();
            if (!netInfo.isConnected) {
                Alert.alert("No Connection", "You must be connected to the internet to login.");
                throw "No Connection";
            }
            //endregion

            //Attempt to log the user in
            const response = await Auth.signIn(user, pass);

            //region [IF] the user successfully logged in via cognito [THEN] log the user in locally & update their dynamodb values to a logged in state
            if (response) {
                await perms.signIn();
                logger.log("Login Successful")
                navigation.navigate("LoadingPage") //Actually navigate to loadingpage
            }
            //endregion
        } catch (error) {
            logger.log(error);
            //region [IF] the user is not confirmed [THEN] navigate to the confirmation page
            if (error.code === "UserNotConfirmedException") navigation.navigate("SignupPage3");
            //endregion
            //region [ELSE IF] the username isn't found or the password isn't correct [THEN] alert the user
            else if (error.code === "NotAuthorizedException" || error.code === "UserNotFoundException") {
                Alert.alert("Incorrect Username or Password", "The username or password you entered was incorrect.", [
                    { text: "Try Again" },
                ])
            }
            //endregion
        }
        setSubmitButtonLoad(false);
    }
    return (
        <Screen>
            <TouchableOpacity activeOpacity={1} onPress={()=>Keyboard.dismiss() }><>
                <KeyboardAvoidingView
                    style={styles.page}
                    behavior={Platform.OS === "android" ? "height" : "padding"}
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
                    <SubTitle size={16} style={{ fontWeight: "400" }} color={dark_colors.text2}>Or Create Account</SubTitle>
                </TouchableOpacity>
                <Beam style={styles.beam} />
            </View>
        </Screen>
    );
}

const styles = StyleSheet.create({
    //region text
    text: {
        color: dark_colors.text1
    },
    //endregion
    //region page
    page: {
        width: "100%",
        height: "100%",
        justifyContent: "center",
    },
    //endregion
    //region logo
    logo: {
        height: 60,
        width: "100%"
    },
    //endregion
    //region beamContainer
    beamContainer: {
        width: "100%",
        marginTop: -30,
        paddingHorizontal: 10,
        flexDirection: 'row',
        justifyContent: "space-between",
        alignItems: "center",
    },
    //endregion
    //region beam
    beam: {
        width: "26%",
        borderRadius: 10
    },
    //endregion
    //region footer
    footer: {
        height: 70,
        alignItems: "flex-end",
        padding: 14,
        paddingRight: 20
    }
    //endregion
});