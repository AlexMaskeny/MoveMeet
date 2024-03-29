//region 3rd Party Imports
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Auth } from 'aws-amplify';
import React, { useRef, useState } from 'react';
import {StyleSheet, View, TouchableOpacity, Keyboard, Alert, Platform} from 'react-native';
import Beam from '../comps/Beam';
import BeamTitle from '../comps/BeamTitle';
import NetInfo from "@react-native-community/netinfo";
//endregion
//region 1st Party Imports
import Screen from '../comps/Screen';
import SimpleButton from '../comps/SimpleButton';
import SimpleInput from '../comps/SimpleInput';
import SubTitle from '../comps/SubTitle';
import { dark_colors, storage } from '../config';
import * as logger from '../functions/logger';
//endregion

export default function SignupPage2({ navigation, route }) {
    const [number, setNumber] = useState("");
    const [loading, setLoading] = useState(false);

    const numberRef = useRef();

    //region [FUNC ASYNC] "onNext = async ()" = Signs the user up and navigates to confirmation page
    const onNext = async () => {
        try {
            setLoading(true);
            //region Make sure the user is connected
            const netInfo = await NetInfo.fetch();
            if (!netInfo.isConnected) {
                Alert.alert("No Connection", "You must be connected to the internet to signup.");
                setLoading(false);
                return;
            }
            //endregion
            //region Store the new user locally as unconfirmed user (used if user restarts app before confirming)
            await AsyncStorage.setItem(storage.UNCONFIRMED, JSON.stringify({ val: true }));
            await AsyncStorage.setItem(storage.UNCONFIRMEDUSER, JSON.stringify({
                username: route.params.username,
                password: route.params.password,
                name: route.params.name,
                phone_numer: "+1" + number
            }));
            //endregion
            //region Sign the user up
            const result = await Auth.signUp({
                username: route.params.username,
                password: route.params.password,
                attributes: {
                    email: 'alex@maskeny.com',
                    phone_number: "+1"+number
                }
            });
            //endregion
            //region Navigate to the confirmation page
            if (result) {
                navigation.navigate("SignupPage3");
            }
            //endregion
        } catch (error) {
            logger.log(error);
            if (error.code === "UsernameExistsException")
                Alert.alert("Username Already Exists", "The username you selected is already taken.");
            else
                Alert.alert("Error", "Some error occured.", [{ text: "Try Again", onPress: () => logger.warn(error) }]);
        } finally {
            setLoading(false);

        }
    }
    //endregion

    return (
        <Screen>
            <TouchableOpacity activeOpacity={1} onPress={() => Keyboard.dismiss()}>
                <View style={styles.page}>
                    <BeamTitle>Verify your account</BeamTitle>
                    <SubTitle size={14}>In order to verify your identity, we</SubTitle>
                    <SubTitle size={14}>need your phone number.</SubTitle>
                    <View style={{ height: 20 }} />
                    <SimpleInput
                        reference={numberRef}
                        value={number}
                        placeholder="Phone Number"
                        keyboardType="phone-pad"
                        autocorrect={false}
                        textContentType="numeric"
                        icon="phone"
                        maxLength={10}
                        autoCapitalize="none"
                        onChangeText={(text)=>setNumber(text)}
                    />
                    <View style={{ height: 10 }} />
                    <SimpleButton
                        title="Create Account"
                        outerStyle={{ flexDirection: "row" }}
                        onPress={onNext}
                        disabled={number.length < 10}
                        loading={loading}
                    />
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <SubTitle size={16} style={{ fontWeight: '500', marginTop: 14 }}>Go Back</SubTitle>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
            <View style={styles.beamContainer}>
                <Beam style={styles.beam} />
                <TouchableOpacity onPress={() => navigation.navigate("AuthPage")}>
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
});