//region 3rd Party Libraries
import React, {  useRef, useState } from 'react';
import { Auth } from 'aws-amplify';
import {StyleSheet, View, TouchableOpacity, Keyboard, Alert, Platform} from 'react-native';
import BeamTitle from '../comps/BeamTitle';
import NetInfo from "@react-native-community/netinfo";
//endregion
//region 1st Party Libraries
import Screen from '../comps/Screen';
import SimpleButton from '../comps/SimpleButton';
import SimpleInput from '../comps/SimpleInput';
import SubTitle from '../comps/SubTitle';
import * as logger from '../functions/logger';
//endregion

export default function ForgotPasswordPage1({ navigation }) {
    const usernameRef = useRef();                  //"ref={usernameRef}" prop for the username input

    const [username, setUsername] = useState("");  //Current value of username input
    const [loading, setLoading] = useState(false); //Should we display loading?

    //region [FUNC ASYNC] "onNext = async ()" = Send out verification code to reset user password
    const onNext = async () => {
        try {
            //region Make sure the user is connected
            const netInfo = await NetInfo.fetch();
            if (!netInfo.isConnected) {
                Alert.alert("No Connection", "You must be connected to the internet to do this.");
                setLoading(false);
                return;
            }
            //endregion

            setLoading(true);
            await Auth.forgotPassword(username);
            navigation.navigate("ForgotPasswordPage2", { username: username });
        } catch (error) {
            logger.warn(error);
            if (error.code === "LimitExceededException")
                Alert.alert("Slow down", "You have tried resetting your password to many times");
            else
                Alert.alert("Invalid username", "The username you are trying to reset the password of doesn't exist");
        } finally {
            setLoading(false);
        }
    }
    //endregion

    return (
        <Screen>
            <TouchableOpacity activeOpacity={1} onPress={() => Keyboard.dismiss()}>
                <View style={styles.page}>
                    <BeamTitle>Resetting your password</BeamTitle>
                    <SubTitle size={14}>In order to reset your password,</SubTitle>
                    <SubTitle size={14}>we need your username.</SubTitle>
                    <View style={{ height: 20 }} />
                    <SimpleInput
                        reference={usernameRef}
                        value={username}
                        placeholder="Username"
                        keyboardType="default"
                        autocorrect={false}
                        textContentType="username"
                        icon="account"
                        maxLength={20}
                        autoCapitalize="none"
                        onChangeText={(text) => setUsername(text)}
                    />
                    <View style={{ height: 10 }} />
                    <SimpleButton
                        title="Next"
                        outerStyle={{ flexDirection: "row" }}
                        onPress={onNext}
                        disabled={username.length < 1}
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
});