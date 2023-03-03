//region 3rd Party Imports
import React from 'react';
import { StyleSheet, Image, View, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
//endregion
//region 1st Party Imports
import Beam from '../comps/Beam';
import Screen from '../comps/Screen';
import SimpleButton from '../comps/SimpleButton';
import SubTitle from '../comps/SubTitle';
import { colors, storage } from '../config';
import * as logger from '../functions/logger';
//endregion

export default function AuthPage({ navigation }) {
    //region [FUNC] "navToSignup" = If the <code>user</code> is unconfirmed, navigate to confirmation page. Otherwise, navigate to first signup page
    const navToSignup = async () => {
        try {
            const result = await AsyncStorage.getItem(storage.UNCONFIRMED);
            if (result) {
                const parsed = JSON.parse(result);
                if (parsed.val) {
                    logger.log("Unconfirmed User Exists");
                    navigation.navigate("SignupPage2");
                    return;
                }
            }
            navigation.navigate("SignupPage1");
        } catch (error) {
            logger.warn(error);
        }
    }
    //endregion

    return (
        <Screen>
            <View style={styles.page}>
                <Image
                    source={require('../../assets/Logo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
                <View style={{height: 10}} />
                <SimpleButton
                    title="Create an account"
                    onPress={navToSignup}
                />
                
                <View style={styles.beamContainer}>
                    <Beam style={styles.beam} />
                    <TouchableOpacity onPress={()=>navigation.navigate("LoginPage")}>
                        <SubTitle size={16} style={{ fontWeight: "400" }} color={colors.text2}>Or Login</SubTitle>
                    </TouchableOpacity>
                    <Beam style={styles.beam} />
                </View>
                <View style={{ height: 40 }} />
            </View>
        </Screen>
    );
}

const styles = StyleSheet.create({
    //region logo
    logo: {
        height: 60,
        width: "100%"
    },
    //endregion
    //region page
    page: {
        width: "100%",
        height: "100%",
        justifyContent: "center",
    },
    //endregion
    //region beamContainer
    beamContainer: {
        marginTop: 14,
        marginHorizontal: 14,
        flexDirection: 'row',
        justifyContent: "space-between",
        alignItems: "center"
    },
    //endregion
    //region beam
    beam: {
        width: "33%",
        borderRadius: 10
    }
    //endregion
})