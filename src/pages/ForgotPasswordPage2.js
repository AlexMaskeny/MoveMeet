//region 3rd Party Imports
import { Auth } from 'aws-amplify';
import React, {  useRef, useState } from 'react';
import {StyleSheet, View, TouchableOpacity, Keyboard, Alert, Platform} from 'react-native';
import BeamTitle from '../comps/BeamTitle';
//endregion
//region 1st Party Imports
import Screen from '../comps/Screen';
import SimpleButton from '../comps/SimpleButton';
import SimpleInput from '../comps/SimpleInput';
import SubTitle from '../comps/SubTitle';
import * as logger from '../functions/logger';
import * as perms from '../functions/perms';
//endregion

export default function ForgotPasswordPage2({ navigation, route }) {
    const [code, setCode] = useState("");
    const [pass, setPass] = useState("");
    const [confirmPass, setConfirmPass] = useState("");
    const [passVisible, setPassVisible] = useState(false);
    const [confirmPassVisible, setConfirmPassVisible] = useState(false);
    const [allowResend, setAllowResend] = useState(true);
    const [loading, setLoading] = useState(false);

    const codeRef = useRef();

    //region [FUNC ASYNC] "onChange = ()" = [IF] user put in the right code [THEN] update their pass [AND] login [ELSE] alert them
    const onChange = async () => {
        try {
            setLoading(true);
            await Auth.forgotPasswordSubmit(route.params.username, code, pass);
            Alert.alert("Success", "You successfully changed your password!", [{ text: "Okay" }]);
            //region Sign the user in
            await Auth.signIn(route.params.username, pass);
            await perms.getLocation();
            await perms.getNotifications();
            await perms.signIn();
            navigation.navigate("LoadingPage");
            //endregion
        } catch (error) {
            logger.warn(error);
            Alert.alert("Incorrect Code", "The code you entered was either not correct or expired.", [{ text: "Try Again" }]);
        } finally {
            setLoading(false);
        }
    }
    //endregion
    //region [FUNC ASYNC] "resend = ()" = resend code (if used faster than every 10s then alert user to slow down)
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
    //endregion

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
                        text={pass.length + "/" + "8"}
                        showRightButton={true}
                        rightButtonProps={{
                            icon: passVisible ? "eye-off" : "eye",
                            size: 24,
                            onPress: () => setPassVisible(!passVisible)
                        }}
                        maxLength={20}
                        secureTextEntry={!passVisible}
                        onChangeText={(text) => {
                            setPass(text);
                        }}
                    />
                    {pass.length >= 8 &&
                        <SimpleInput
                            placeholder="Confirm Password"
                            autocorrect={false}
                            icon="lock"
                            showRightButton={true}
                            rightButtonProps={{
                                icon: confirmPassVisible ? "eye-off" : "eye",
                                size: 24,
                                onPress: () => setConfirmPassVisible(!confirmPassVisible)
                            }}
                            autoCapitalize="none"
                            text={confirmPass.length + "/" + "8"}
                            maxLength={20}
                            secureTextEntry={!confirmPassVisible}
                            onChangeText={(text) => {
                                setConfirmPass(text);
                            }}
                        />
                    }
                    <View style={{ height: 10 }} />
                    <SimpleButton
                        title="Change Password"
                        outerStyle={{ flexDirection: "row" }}
                        onPress={onChange}
                        disabled={code.length < 6 || pass.length < 8 || pass!=confirmPass}
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
    //region logo
    logo: {
        height: 80,
        width: "100%"
    },
    //endregion
    //region page
    page: {
        paddingTop: Platform.OS === "android" ? 50 : 20,
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "flex-start"
    },
    //endregion
    //region beamContainer
    beamContainer: {
        width: "100%",
        marginTop: -20,
        paddingHorizontal: 10,
        flexDirection: 'row',
        justifyContent: "space-between",
        alignItems: "center",
    },
    //endregion
    //region beam
    beam: {
        width: "33%",
        borderRadius: 10
    },
    //endregion
});