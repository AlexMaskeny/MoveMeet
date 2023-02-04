import { Auth } from 'aws-amplify';
import React, {  useRef, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Keyboard, Alert } from 'react-native';
import BeamTitle from '../comps/BeamTitle';

import Screen from '../comps/Screen';
import SimpleButton from '../comps/SimpleButton';
import SimpleInput from '../comps/SimpleInput';
import SubTitle from '../comps/SubTitle';
import * as logger from '../functions/logger';
import * as perms from '../functions/perms';

export default function ForgotPasswordPage2({ navigation, route }) {
    const [code, setCode] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [allowResend, setAllowResend] = useState(true);

    const codeRef = useRef();

    const onChange = async () => {
        try {
            setLoading(true);
            await Auth.forgotPasswordSubmit(route.params.username, code, password);
            Alert.alert("Success", "You successfully changed your password!", [{ text: "Okay" }]);
            await Auth.signIn(route.params.username, password);
            await perms.getLocation();
            await perms.getNotifications();
            navigation.navigate("LoadingPage");
        } catch (error) {
            logger.warn(error);
            Alert.alert("Incorrect Code", "The code you entered was either not correct or expired.", [{ text: "Try Again" }]);
        } finally {
            setLoading(false);

        }
    }

    const Resend = async () => {
        try {
            if (allowResend) {
                setAllowResend(false);
                await Auth.forgotPassword(route.params.username);
                setTimeout(function () {
                    setAllowResend(true);
                }, 10000);
            } else {
                Alert.alert("Slow down", "You can only send a new code every 10 seconds");
            }
        } catch (error) {
            logger.warn(error);

        }
    }

    return (
        <Screen>
            <TouchableOpacity activeOpacity={1} onPress={() => Keyboard.dismiss()}>
                <View style={styles.page}>
                    <BeamTitle>Resetting your password</BeamTitle>
                    <SubTitle size={14}>You should have received a code</SubTitle>
                    <SubTitle size={14}>via text message. Didn't receive it?</SubTitle>
                    <TouchableOpacity style={{ marginTop: 4 }} onPress={() => Resend()}>
                        <BeamTitle size={16} style={{ fontWeight: "500" }}>Send Code Again</BeamTitle>
                    </TouchableOpacity>
                    <View style={{ height: 20 }} />
                    <SimpleInput
                        reference={codeRef}
                        value={code}
                        placeholder="Code"
                        keyboardType="number-pad"
                        autocorrect={false}
                        textContentType="oneTimeCode"
                        icon="barcode"
                        maxLength={9}
                        autoCapitalize="none"
                        onChangeText={(text) => setCode(text)}
                    />
                    <SimpleInput
                        placeholder="Password"
                        autocorrect={false}
                        icon="lock"
                        autoCapitalize="none"
                        text={password.length + "/" + "8"}
                        showRightButton={true}
                        rightButtonProps={{
                            icon: passwordVisible ? "eye-off" : "eye",
                            size: 24,
                            onPress: () => setPasswordVisible(!passwordVisible)
                        }}
                        maxLength={20}
                        secureTextEntry={!passwordVisible}
                        onChangeText={(text) => {
                            setPassword(text);
                        }}
                    />
                    {password.length >= 8 &&
                        <SimpleInput
                            placeholder="Confirm Password"
                            autocorrect={false}
                            icon="lock"
                            showRightButton={true}
                            rightButtonProps={{
                                icon: confirmPasswordVisible ? "eye-off" : "eye",
                                size: 24,
                                onPress: () => setConfirmPasswordVisible(!confirmPasswordVisible)
                            }}
                            autoCapitalize="none"
                            text={confirmPassword.length + "/" + "8"}
                            maxLength={20}
                            secureTextEntry={!confirmPasswordVisible}
                            onChangeText={(text) => {
                                setConfirmPassword(text);
                            }}
                        />
                    }
                    <View style={{ height: 10 }} />
                    <SimpleButton
                        title="Change Password"
                        outerStyle={{ flexDirection: "row" }}
                        onPress={onChange}
                        disabled={code.length < 6 || password.length < 8 || password!=confirmPassword}
                        loading={loading}
                    />
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <SubTitle size={16} style={{ fontWeight: '500', marginTop: 14 }}>Go Back</SubTitle>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Screen>
    );
}

const styles = StyleSheet.create({
    logo: {
        height: 80,
        width: "100%"
    },
    page: {
        paddingTop: 20,
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "flex-start"
    },
    beamContainer: {
        width: "100%",
        marginTop: -20,
        paddingHorizontal: 10,
        flexDirection: 'row',
        justifyContent: "space-between",
        alignItems: "center",
    },
    beam: {
        width: "33%",
        borderRadius: 10
    },

})