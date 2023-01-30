import React, {  useRef, useState } from 'react';
import { Auth } from 'aws-amplify';
import { StyleSheet, View, TouchableOpacity, Keyboard, Alert } from 'react-native';
import BeamTitle from '../comps/BeamTitle';

import Screen from '../comps/Screen';
import SimpleButton from '../comps/SimpleButton';
import SimpleInput from '../comps/SimpleInput';
import SubTitle from '../comps/SubTitle';
import * as logger from '../functions/logger';

export default function ForgotPasswordPage1({ navigation, route }) {
    const [username, setUsername] = useState("");
    const [loading, setLoading] = useState(false);

    const usernameRef = useRef();

    const onNext = async () => {
        try {
            setLoading(true);
            await Auth.forgotPassword(username);
            navigation.navigate("ForgotPasswordPage2", { username: username });
        } catch (error) {
            logger.warn(error);
            if (error.code == "LimitExceededException") {
                Alert.alert("Slow down", "You have tried resetting your password to many times");
            }

        } finally {
            setLoading(false);

        }
    }

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

})