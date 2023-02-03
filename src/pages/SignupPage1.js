import React, { useRef, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Keyboard } from 'react-native';
import Beam from '../comps/Beam';
import BeamTitle from '../comps/BeamTitle';

import Screen from '../comps/Screen';
import SimpleButton from '../comps/SimpleButton';
import SimpleInput from '../comps/SimpleInput';
import SubTitle from '../comps/SubTitle';
import { colors } from '../config';


export default function SignupPage1({ navigation }) {
    const [username, setUsername] = useState("");
    const [name, setName] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("")
    const [password, setPassword] = useState("");
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

    const usernameRef = useRef();
    const confirmPasswordRef = useRef();
    const passwordRef = useRef();
    const nameRef = useRef();

    const onSubmit = () => {
        navigation.navigate("SignupPage2", {
            username: username.toLowerCase(),
            password: password,
            name: name
        });
    }
    return (
        <Screen>
            <TouchableOpacity activeOpacity={1} onPress={() => Keyboard.dismiss()}>
                <View style={styles.page}>
                    <BeamTitle>Create an account</BeamTitle>
                    <SubTitle size={14}>Choose a username and make a password</SubTitle>
                    <View style={{ height: 20 }} />
                    <SimpleInput
                        reference={nameRef}
                        placeholder="Name (optional)"
                        autocorrect={false}
                        icon="account"
                        autoCapitalize="none"
                        maxLength={16}
                        onChangeText={(text) => {
                            setName(text);
                        }}
                    />
                    <SimpleInput
                        reference={usernameRef}
                        placeholder="Username"
                        autocorrect={false}
                        icon="account"
                        autoCapitalize="none"
                        maxLength={18}
                        text={username.length + "/4"}
                        value={username}
                        onChangeText={(text) => {
                            if (
                                /^[a-zA-Z]+$/.test(text[text.length-1]) || text.length == 0 ||
                                 /^[0-9]+$/.test(text[text.length - 1]) || text[text.length - 1] == '_' ||
                                text[text.length - 1] == '.'
                            ) setUsername(text);
                        }}
                    />
                    <SimpleInput
                        reference={passwordRef}
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
                            reference={confirmPasswordRef}
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
                        title="Next"
                        onPress={onSubmit}
                        outerStyle={{ flexDirection: 'row' }}
                        disabled={!(username.length > 3 && password.length >= 8 && confirmPassword == password)}
                    />
                </View>
            </TouchableOpacity>
            <View style={styles.beamContainer}>
                <Beam style={styles.beam} />
                <TouchableOpacity onPress={() => navigation.navigate("LoginPage")}>
                    <SubTitle size={16} style={{ fontWeight: "400" }} color={colors.text2}>Or Login</SubTitle>
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