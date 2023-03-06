//region 3rd Party Imports
import React, { useRef, useState } from 'react';
import {StyleSheet, View, TouchableOpacity, Keyboard, Linking, Platform} from 'react-native';
import Beam from '../comps/Beam';
import BeamTitle from '../comps/BeamTitle';
//endregion
//region 1st Party Imports
import Screen from '../comps/Screen';
import SimpleButton from '../comps/SimpleButton';
import SimpleInput from '../comps/SimpleInput';
import SubTitle from '../comps/SubTitle';
import { dark_colors } from '../config';
//endregion

export default function SignupPage1({ navigation }) {
    const [username, setUsername] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("")
    const [password, setPassword] = useState("");
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

    const usernameRef = useRef();
    const confirmPasswordRef = useRef();
    const passwordRef = useRef();

    //region [FUNCTION]   "onSubmit = ()" = Navigates to the next signup page
    const onSubmit = () => {
        navigation.navigate("SignupPage2", {
            username: username.toLowerCase(),
            password: password,
            name: username.toLowerCase()
        });
    }
    //endregion

    return (
        <Screen>
            <TouchableOpacity activeOpacity={1} onPress={() => Keyboard.dismiss()}>
                <View style={styles.page}>
                    <BeamTitle>Create an account</BeamTitle>
                    <SubTitle size={14}>Choose a username and make a password</SubTitle>
                    <SubTitle size={14}>Username must be at least 4 characters</SubTitle>
                    <SubTitle size={14}>Password must be at least 8 characters</SubTitle>
                    <View style={{ height: 20 }} />
                    <SimpleInput
                        reference={usernameRef}
                        placeholder="Username"
                        autocorrect={false}
                        icon="account"
                        autoCapitalize="none"
                        maxLength={18}
                        value={username}
                        onChangeText={(text) => {
                            if (
                                /^[a-zA-Z]+$/.test(text[text.length-1]) || text.length === 0 ||
                                 /^[0-9]+$/.test(text[text.length - 1]) || text[text.length - 1] === '_' ||
                                text[text.length - 1] === '.'
                            ) setUsername(text);
                        }}
                    />
                    <SimpleInput
                        reference={passwordRef}
                        placeholder="Password"
                        autocorrect={false}
                        icon="lock"
                        autoCapitalize="none"
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
                        disabled={!(username.length > 3 && password.length >= 8 && confirmPassword === password)}
                    />
                    <View style={styles.tos}>
                        <SubTitle size={14} style={{ alignContent: "center" }}>By clicking next you agree to our</SubTitle>
                        <View style={{ flexDirection: 'row' }}>
                            <TouchableOpacity onPress={()=>Linking.openURL("https://movemeet.com/terms")}>
                                <SubTitle size={14} style={{ alignContent: "center" }} color={dark_colors.pBeam}>Terms & Conditions</SubTitle>
                            </TouchableOpacity>
                            <SubTitle size={14} style={{ alignContent: "center" }}> and </SubTitle>
                            <TouchableOpacity onPress={() => Linking.openURL("https://movemeet.com/privacy-policy")}>
                                <SubTitle size={14} style={{ alignContent: "center" }} color={dark_colors.pBeam}>Privacy Policy</SubTitle>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
            <View style={styles.beamContainer}>
                <Beam style={styles.beam} />
                <TouchableOpacity onPress={() => navigation.navigate("LoginPage")}>
                    <SubTitle size={16} style={{ fontWeight: "400" }} color={dark_colors.text2}>Or Login</SubTitle>
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
        width: "33%",
        borderRadius: 10
    },
    //endregion
    //region tos
    tos: {
        marginVertical: 10,
        alignItems: "center",
        justifyContent: "center",
        alignContent: "center"
    }
    //endregion
});