import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Keyboard, Alert, ImageBackground, ActivityIndicator } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';

import Beam from '../comps/Beam';
import BeamTitle from '../comps/BeamTitle';
import Screen from '../comps/Screen';
import SimpleButton from '../comps/SimpleButton';
import SimpleInput from '../comps/SimpleInput';
import SubTitle from '../comps/SubTitle';
import { colors, css, strings } from '../config';
import * as logger from '../functions/logger'; 
import * as media from '../functions/media';
import IconButton from '../comps/IconButton';
import BackgroundEditor from '../comps/BackgroundEditor';
import { calls, mmAPI } from '../api/mmAPI';

export default function SignupPage4({ navigation, route }) {
    const [bio, setBio] = useState("");
    const [profilePicture, setProfilePicture] = useState(false);
    const [image, setImage] = useState({});
    const [background, setBackground] = useState({isColor: true, color: colors.background})
    const [loading, setLoading] = useState(false);
    const [showBack, setShowBack] = useState(false);

    const Submit = async () => {
        try {
            setLoading(true);
            const result1 = await Location.getForegroundPermissionsAsync();
            if (!result1.granted) await Location.requestForegroundPermissionsAsync();
            var params = {
                id: route.params.userID,
                allowNotifications: false,
                loggedOut: false,
            }
            const result2 = await Notifications.getPermissionsAsync();
            if (result2.granted) {
                const token = await Notifications.getExpoPushTokenAsync();
                params = {
                    ...params,
                    allowNotifications: true,
                    expoToken: token.data
                }
            } else {
                const result = await Notifications.requestPermissionsAsync();
                if (result.granted) {
                    const token = await Notifications.getExpoPushTokenAsync();
                    params = {
                        ...params,
                        allowNotifications: true,
                        expoToken: token.data
                    }
                }

            }
            
            if (bio.length > 0) params = { ...params, bio: bio };
            if (profilePicture) {
                await mmAPI.store("FULLprofilePicture" + route.params.userID + ".jpg", image.full)
                await mmAPI.store("LOADFULLprofilePicture" + route.params.userID + ".jpg", image.loadFull)
                params = {
                    ...params,
                    profilePicture: {
                        full: "FULLprofilePicture" + route.params.userID + ".jpg",
                        loadFull: "LOADFULLprofilePicture" + route.params.userID + ".jpg",
                        region: "us-east-2",
                        bucket: "proxychatf2d762e9bc784204880374b0ca905be4120629-dev"
                    }
                }
            }
            if (background.isColor) {
                params = {
                    ...params,
                    background: {
                        full: " ",
                        loadFull: " ",
                        enableColor: true,
                        color: background.color,
                        bucket: "proxychatf2d762e9bc784204880374b0ca905be4120629-dev",
                        region: "us-east-2",
                    }
                }
            } else {
                await mmAPI.store("FULLbackground" + route.params.userID + ".jpg", background.full);
                await mmAPI.store("LOADFULLbackground" + route.params.userID + ".jpg", background.loadFull);
                params = {
                    ...params,
                    background: {
                        full: "FULLbackground" + route.params.userID + ".jpg",
                        loadFull: "LOADFULLbackground" + route.params.userID + ".jpg",
                        enableColor: false,
                        color: " ",
                        bucket: "proxychatf2d762e9bc784204880374b0ca905be4120629-dev",
                        region: "us-east-2",
                    }
                }      
            }
            await mmAPI.mutate({
                call: calls.UPDATE_USER,
                input: params
            });
        } catch (error) {
            logger.warn(error);
        } finally {
            setLoading(false);
            navigation.navigate("LoadingPage");
        }
    }

    const changeBackground = async () => {
        Alert.alert("Use a photo or use a color", "Pick one of the options below to change your background", [
            { text: "Open Photos", onPress: () => media.openPhotos(onBackImageSuccess) },
            { text: "Select Color", onPress: () => setShowBack(true)}
        ])
    }

    const onBackImageSuccess = (uri) => {
        setBackground({ isColor: false, color: " ", full: uri.full, loadFull: uri.loadFull });
    }

    const onColorSuccess = (color) => {
        setShowBack(false);
        setBackground({ isColor: true, color: color, full: " ", loadFull: " " });
    }

    const selectImage = async () => {
        try {
            const onSuccess = (uri) => {
                setImage(uri);
                setProfilePicture(true);
            }
            Alert.alert("Take a photo or select one", "Pick one of the options below to change your profile picture.", [
                { text: "Take Picture", onPress: () => media.openCamera(onSuccess) },
                { text: "Open Photos", onPress: () => media.openPhotos(onSuccess) }
            ]);
        } catch (error) {
            logger.warn(error);
        }
    }

    return (
        <Screen>
            <TouchableOpacity activeOpacity={1} onPress={() => Keyboard.dismiss()}>
                <View style={styles.page}>
                    <BeamTitle>Edit your profile now</BeamTitle>
                    <SubTitle size={14}>The final step in signing up for</SubTitle>
                    <SubTitle size={14}>{strings.APPNAME} is designing your profile.</SubTitle>
                    <Beam style={{ marginTop: 20 }} />
                    {background.isColor &&
                        <View style={{ backgroundColor: background.color, paddingVertical: 10 }}>
                            <View style={styles.body}>
                                {!profilePicture &&
                                    <TouchableOpacity style={styles.bigImage} onPress={selectImage} disabled={loading} >
                                        {!loading && <>
                                            <IconButton color={colors.text1} icon="camera" brand="MaterialCommunityIcons" size={40} disabled={true} />
                                        </>}
                                        {loading && <ActivityIndicator color={colors.pBeamBright} size="large" />}
                                    </TouchableOpacity>
                                }
                                {profilePicture &&
                                    <TouchableOpacity style={styles.bigImage} onPress={selectImage} disabled={loading} >
                                        <ImageBackground source={{ uri: image.full }} style={styles.imageBackground} imageStyle={{ borderRadius: 200 }}>

                                        </ImageBackground>
                                    </TouchableOpacity>
                                }
                                <SimpleInput
                                    autoCorrect={true}
                                    multiline={true}
                                    maxLength={160}
                                    cStyle={styles.textInput}
                                    tStyle={{ alignSelf: 'flex-start' }}
                                    placeholder="Bio"
                                    value={bio}
                                    onChangeText={(text) => setBio(text)}
                                />
                            </View>
                            <SimpleButton
                                disabled={loading}
                                loading={loading}
                                title="Change Background"
                                onPress={changeBackground}
                                outerStyle={{ flexDirection: 'row', marginTop: 12, borderColor: colors.text1, shadowColor: colors.text1, backgroundColor: background.isColor ? "rgba(0,0,0,0.2)" : colors.container }}
                            />
                        </View>
                    }
                    {!background.isColor &&
                        <ImageBackground source={{ uri: background.full }} style={{paddingVertical: 10}}>
                            <View style={styles.body}>
                                {!profilePicture &&
                                    <TouchableOpacity style={styles.bigImage} onPress={selectImage} disabled={loading} >
                                        {!loading && <>
                                            <IconButton color={colors.text1} icon="camera" brand="MaterialCommunityIcons" size={40} disabled={true} />
                                        </>}
                                        {loading && <ActivityIndicator color={colors.pBeamBright} size="large" />}
                                    </TouchableOpacity>
                                }
                                {profilePicture &&
                                    <TouchableOpacity style={styles.bigImage} onPress={selectImage} disabled={loading} >
                                        <ImageBackground source={{ uri: image.full }} style={styles.imageBackground} imageStyle={{ borderRadius: 200 }}>

                                        </ImageBackground>
                                    </TouchableOpacity>
                                }
                                <SimpleInput
                                    autoCorrect={true}
                                    multiline={true}
                                    maxLength={160}
                                    cStyle={styles.textInput}
                                    tStyle={{ alignSelf: 'flex-start' }}
                                    placeholder="Bio"
                                    value={bio}
                                    onChangeText={(text) => setBio(text)}
                                />
                            </View>
                            <SimpleButton
                                disabled={loading}
                                loading={loading}
                                title="Change Background"
                                onPress={changeBackground}
                                outerStyle={{ flexDirection: 'row', marginTop: 12, borderColor: colors.text1, shadowColor: colors.text1, backgroundColor: colors.background }}
                            />
                        </ImageBackground>
                    }
                    <Beam style={{ marginBottom: 20 }} />
                    <View style={styles.body2}>
                        <TouchableOpacity style={{ marginTop: 4, flex: 1, alignItems: "center" }} onPress={Submit}>
                            <BeamTitle size={18} style={{ fontWeight: "500" }}>I'm Done</BeamTitle>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
            <BackgroundEditor visible={showBack} onClose={() => setShowBack(false)} onSuccess={onColorSuccess} />
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
    bigImage: {
        backgroundColor: colors.container,
        borderRadius: 200,
        height: 100,
        width: 100,
        margin: 10,
        borderWidth: 2,
        borderColor: colors.pBeam,
        ...css.beamShadow,
        alignItems: "center",
        justifyContent: 'center',
    },
    bigPlus: {
        height: 50,
        width: 50,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 100,
        borderColor: colors.pBeamBright,
        borderWidth: 2,
        ...css.beamShadow
    },
    imageBackground: {
        flex: 1,
        width: "100%",
        justifyContent: "flex-start",
        alignItems: "flex-end",
    },
    title: {
        fontWeight: "400",
    },
    textInput: {
        color: colors.text1,
        fontSize: 18,
        height: 100,
        width: "64%",
        marginTop: 10,
        padding: 10,
        ...css.beamShadow,
        shadowColor: "rgba(0,0,0,0.5)",
        alignContent: "flex-start",
        justifyContent: 'flex-start'
    },
    body: {
        flexDirection: 'row',
    },
    body2: {
        flexDirection: 'row',
        justifyContent: "space-between"
    }
})