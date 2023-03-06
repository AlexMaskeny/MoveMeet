//region 3rd Party Imports
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Auth } from 'aws-amplify';
import React, { useRef, useState } from 'react';
import {StyleSheet, View, TouchableOpacity, Keyboard, Alert, Platform} from 'react-native';
import NetInfo from "@react-native-community/netinfo";
//endregion
//region 1st Party Imports
import Beam from '../comps/Beam';
import BeamTitle from '../comps/BeamTitle';
import Screen from '../comps/Screen';
import SimpleButton from '../comps/SimpleButton';
import SimpleInput from '../comps/SimpleInput';
import SubTitle from '../comps/SubTitle';
import { dark_colors, storage } from '../config';
import { calls, mmAPI } from '../api/mmAPI';
import * as logger from '../functions/logger';
//endregion

export default function SignupPage3({ navigation }) {
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [allowResend, setAllowResend] = useState(true);

    const codeRef = useRef();

    //region [FUNC ASYNC] "onNext = async ()" = Confirms the user and navigates to the next page
    const onNext = async () => {
        try {
            setLoading(true);

            //region Ensure the user is connected
            const netInfo = await NetInfo.fetch();
            if (!netInfo.isConnected) {
                Alert.alert("No Connection", "You must be connected to the internet to login.");
                setLoading(false);
                return;
            }
            //endregion
            //region Get the unconfirmed user and confirm them
            const unconfirmedUser = await AsyncStorage.getItem(storage.UNCONFIRMEDUSER);
            const user = JSON.parse(unconfirmedUser);
            await Auth.confirmSignUp(user.username, code);
            await AsyncStorage.removeItem(storage.UNCONFIRMED);
            await AsyncStorage.removeItem(storage.UNCONFIRMEDUSER);
            //endregion
            //region Sign the newly confirmed user in and create default dynamodb attributes
            await Auth.signIn(user.username, user.password);
            const currentUser = await Auth.currentAuthenticatedUser();
            const result = await mmAPI.mutate({
                call: calls.CREATE_USER,
                input: {
                    allowNotifications: false,
                    bio: " ",
                    cognitoID: currentUser.attributes.sub,
                    friends: [],
                    name: user.name.length > 0 ? user.name : user.username,
                    username: user.username,
                    loggedOut: false,
                    profilePicture: {
                        full: " ",
                        loadFull: " ",
                        bucket: " ",
                        region: " ",
                    },
                    background: {
                        full: " ",
                        loadFull: " ",
                        bucket: " ",
                        region: " ",
                        enableColor: false,
                        color: " "
                    },
                    broadcasts: []
                }
            });
            //endregion

            //Navigate to the next signup page
            navigation.navigate("SignupPage4", { cognitoUser: user, userID: result.id });
        } catch (error) {
            if (error.code === "CodeMismatchException")
                Alert.alert("Wrong Code", "You entered the wrong code.", [{ text: "Try Again" }])
            else
                Alert.alert("Error", "Some error occurred", [{ text: "Try Again", onPress: () => logger.warn(error) }])
        } finally {
            setLoading(false);
        }
    }
    //endregion
    //region [FUNC ASYNC] "resend = async ()" = Resends the confirmation code to the user (only every 10 seconds or alert user they're requesting to fast)
    const resend = async () => {
        try {
            const unconfirmedUser = await AsyncStorage.getItem(storage.UNCONFIRMEDUSER);
            const user = JSON.parse(unconfirmedUser);
            if (allowResend) {
                setAllowResend(false);
                await Auth.resendSignUp(user.username);
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
                    <BeamTitle>Verify your account</BeamTitle>
                    <SubTitle size={14}>You should have received a one time</SubTitle>
                    <SubTitle size={14}>code via text message. Didn't receive it?</SubTitle>
                    <TouchableOpacity style={{ marginTop: 4 }} onPress={()=>resend()}>
                        <BeamTitle size={16} style={{fontWeight: "500"} }>Send Code Again</BeamTitle>
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
                    <View style={{ height: 10 }} />
                    <SimpleButton
                        title="Confirm"
                        outerStyle={{ flexDirection: "row" }}
                        onPress={onNext}
                        disabled={code.length < 6 || loading}
                        loading={loading}
                    />
                </View>
            </TouchableOpacity>
            <View style={styles.beamContainer}>
                <Beam style={styles.beam} />
                <TouchableOpacity onPress={() => navigation.navigate("LoginPage")}>
                    <SubTitle size={16} style={{ fontWeight: "400" }} color={dark_colors.text2}>Login / Signup Again</SubTitle>
                </TouchableOpacity>
                <Beam style={styles.beam} />
            </View>
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
        marginTop: -30,
        paddingHorizontal: 10,
        flexDirection: 'row',
        justifyContent: "space-between",
        alignItems: "center",
    },
    //endregion
    //region beam
    beam: {
        width: "25%",
        borderRadius: 10
    },
    //endregion
});