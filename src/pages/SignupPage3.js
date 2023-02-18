import AsyncStorage from '@react-native-async-storage/async-storage';
import { Auth } from 'aws-amplify';
import React, { useRef, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Keyboard, Alert } from 'react-native';
import NetInfo from "@react-native-community/netinfo";

import Beam from '../comps/Beam';
import BeamTitle from '../comps/BeamTitle';
import Screen from '../comps/Screen';
import SimpleButton from '../comps/SimpleButton';
import SimpleInput from '../comps/SimpleInput';
import SubTitle from '../comps/SubTitle';
import { colors, storage } from '../config';
import * as logger from '../functions/logger';
import { calls, mmAPI } from '../api/mmAPI';

export default function SignupPage3({ navigation }) {
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [allowResend, setAllowResend] = useState(true);

    const codeRef = useRef();

    const onNext = async () => {
        try {
            setLoading(true);
            const netInfo = await NetInfo.fetch();
            if (!netInfo.isConnected) {
                Alert.alert("No Connection", "You must be connected to the internet to login.");
                setLoading(false);
                return;
            }
            const unconfirmedUser = await AsyncStorage.getItem(storage.UNCONFIRMEDUSER);
            const user = JSON.parse(unconfirmedUser);
            await Auth.confirmSignUp(user.username, code);
            await AsyncStorage.removeItem(storage.UNCONFIRMED);
            await AsyncStorage.removeItem(storage.UNCONFIRMEDUSER);
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
            navigation.navigate("SignupPage4", { cognitoUser: user, userID: result.id });
        } catch (error) {
            if (error.code == "CodeMismatchException")
                Alert.alert("Wrong Code", "You entered the wrong code.", [{ text: "Try Again" }])
            else
                Alert.alert("Error", "Some error occured", [{ text: "Try Again", onPress: () => logger.warn(error) }])
        } finally {
            setLoading(false);
        }
    }

    const Resend = async () => {
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

    return (
        <Screen>
            <TouchableOpacity activeOpacity={1} onPress={() => Keyboard.dismiss()}>
                <View style={styles.page}>
                    <BeamTitle>Verify your account</BeamTitle>
                    <SubTitle size={14}>You should have received a one time</SubTitle>
                    <SubTitle size={14}>code via text message. Didn't receive it?</SubTitle>
                    <TouchableOpacity style={{ marginTop: 4 }} onPress={()=>Resend()}>
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
                    <SubTitle size={16} style={{ fontWeight: "400" }} color={colors.text2}>Login / Signup Again</SubTitle>
                </TouchableOpacity>
                <Beam style={styles.beam} />
            </View>
        </Screen>
    );
}

const styles = StyleSheet.create({
    logo: {
        height: 80,
        width: "100%"
    },
    page: {
        paddingTop: Platform.OS == "android" ? 50 : 20,
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "flex-start"
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
        width: "25%",
        borderRadius: 10
    },

})