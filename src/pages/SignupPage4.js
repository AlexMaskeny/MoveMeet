//region 3rd Party Imports
import React, {useCallback, useState} from 'react';
import {
    StyleSheet,
    View,
    TouchableOpacity,
    Keyboard,
    Alert,
    ImageBackground,
    ActivityIndicator,
    Platform
} from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import NetInfo from "@react-native-community/netinfo";
import uuid from "react-native-uuid";
//endregion
//region 1st Party Imports
import Beam from '../comps/Beam';
import BeamTitle from '../comps/BeamTitle';
import Screen from '../comps/Screen';
import SimpleButton from '../comps/SimpleButton';
import SimpleInput from '../comps/SimpleInput';
import SubTitle from '../comps/SubTitle';
import IconButton from '../comps/IconButton';
import BackgroundEditor from '../comps/BackgroundEditor';
import { calls, mmAPI } from '../api/mmAPI';
import { colors, css, strings } from '../config';
import * as logger from '../functions/logger'; 
import * as media from '../functions/media';
//endregion

export default function SignupPage4({ navigation, route }) {
    //region useState variables
    const [bio, setBio] = useState("");
    const [profilePicture, setProfilePicture] = useState(false);
    const [image, setImage] = useState({});
    const [background, setBackground] = useState({isColor: true, color: colors.background})
    const [loading, setLoading] = useState(false);
    const [showBack, setShowBack] = useState(false);
    //endregion

    /* =============[ FUNCS ]============ */
    //region [FUNC ASYNC] "submit = async ()" = Updates the user's dynamodb values and logs them in.
    const submit = async () => {
        try {
            setLoading(true);
            //region Ensure the user is connected
            const netInfo = await NetInfo.fetch();
            if (!netInfo.isConnected) {
                Alert.alert("No Connection", "You must be connected to the internet to signup.");
                setLoading(false);
                return;
            }
            //endregion
            //region Request access to the user's location
            const result1 = await Location.getForegroundPermissionsAsync();
            if (!result1.granted) await Location.requestForegroundPermissionsAsync();
            let params = {
                id: route.params.userID,
                allowNotifications: false,
                loggedOut: false,
            }
            //endregion
            //region Request access to send user notifications
            const result2 = await Notifications.getPermissionsAsync();
            if (result2.granted) {
                const token = await Notifications.getExpoPushTokenAsync();
                params = {
                    ...params,
                    allowNotifications: true,
                    expoToken: token.data
                }
            }
            else {
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
            //endregion

            //[IF] the user typed in a bio [THEN] change the user's bio to it
            if (bio.length > 0) params = { ...params, bio: bio };

            //region [IF] the user choose a profile picture [THEN] upload it & set the user's profile picture to it
            const id = uuid.v4();
            if (profilePicture) {
                await mmAPI.store("FULLPROFILEPICTURE" + id + ".jpg", image.full)
                await mmAPI.store("LOADFULLPROFILEPICTURE" + id + ".jpg", image.loadFull)
                params = {
                    ...params,
                    profilePicture: {
                        full: "FULLPROFILEPICTURE" + id + ".jpg",
                        loadFull: "LOADFULLPROFILEPICTURE" + id + ".jpg",
                        region: "us-east-2",
                        bucket: "proxychatf2d762e9bc784204880374b0ca905be4120629-dev"
                    }
                }
            }
            //endregion

            //region [IF] the user chose a background color [THEN] change their background to color mode with that color
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
            }
            //endregion
            //region [ELSE] the user picked a image background [SO] upload it and set the user's background to that image
            else {
                await mmAPI.store("FULLBACKGROUND" + id + ".jpg", background.full);
                await mmAPI.store("LOADFULLBACKGROUND" + id + ".jpg", background.loadFull);
                params = {
                    ...params,
                    background: {
                        full: "FULLBACKGROUND" + id + ".jpg",
                        loadFull: "LOADFULLBACKGROUND" + id + ".jpg",
                        enableColor: false,
                        color: " ",
                        bucket: "proxychatf2d762e9bc784204880374b0ca905be4120629-dev",
                        region: "us-east-2",
                    }
                }      
            }
            //endregion

            //region Submit all user changes to the database
            await mmAPI.mutate({
                call: calls.UPDATE_USER,
                input: params
            });
            //endregion
        } catch (error) {
            logger.warn(error);
        } finally {
            setLoading(false);
            navigation.navigate("LoadingPage");
        }
    }
    //endregion
    //region [FUNC ASYNC] "changeBackground = async ()" = Opens the menu to change the user's background
    const changeBackground = async () => {
        const onBackImageSuccess = (uri) => {
            setBackground({ isColor: false, color: " ", full: uri.full, loadFull: uri.loadFull });
        }
        Alert.alert("Use a photo or use a color", "Pick one of the options below to change your background", [
            { text: "Open Photos", onPress: () => media.openPhotos(onBackImageSuccess) },
            { text: "Select Color", onPress: () => setShowBack(true)}
        ])
    }
    //endregion
    //region [FUNC ASYNC] "selectProfilePicture = async ()" = Called when the user begins selecting a profile picture
    const selectProfilePicture = async () => {
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
    //endregion
    //region [FUNCTION]   "onColorSuccess = (color)" = Called when the user selects a color for their background
    const onColorSuccess = (color) => {
        setShowBack(false);
        setBackground({ isColor: true, color: color, full: " ", loadFull: " " });
    }
    //endregion

    /* =============[ COMPS ]============ */
    //region [COMPONENT] "ProfileInput" = The preview for the user's new profile picture (click to select)
    const ProfileInput = useCallback(()=><>
        {!profilePicture &&
            <TouchableOpacity style={styles.bigImage} onPress={selectProfilePicture} disabled={loading} >
                <IconButton color={colors.text1} icon="camera" brand="MaterialCommunityIcons" size={40} disabled={true} />
            </TouchableOpacity>
        }
        {profilePicture &&
            <TouchableOpacity style={styles.bigImage} onPress={selectProfilePicture} disabled={loading} >
                <ImageBackground source={{ uri: image.full }} style={styles.imageBackground} imageStyle={{ borderRadius: 200 }}>

                </ImageBackground>
            </TouchableOpacity>
        }
    </>,[profilePicture,image.full]);
    //endregion
    //region [COMPONENT] "BioInput" = The text input for the user's new bio
    const BioInput = useCallback(()=>
        <SimpleInput
            autoCorrect={true}
            multiline={true}
            maxLength={160}
            cStyle={styles.textInput}
            tStyle={{ alignSelf: 'flex-start' }}
            placeholder="Bio"
            onChangeText={(text) => setBio(text)}
        />
    ,[]);
    //endregion
    //region [COMPONENT] "SubmitButton = ({style})" = This is seperated because the submit buttons are essentially the same between color/image background types
    const SubmitButton = ({style}) => (
        <SimpleButton
            disabled={loading}
            loading={loading}
            title="Change Background"
            onPress={changeBackground}
            outerStyle={style}
        />
    )
    //endregion

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
                                <ProfileInput />
                                <BioInput />
                            </View>
                            <SubmitButton style={[styles.colorSubmit, {backgroundColor: background.isColor ? "rgba(0,0,0,0.2)" : colors.container}]} />
                        </View>
                    }
                    {!background.isColor &&
                        <ImageBackground source={{ uri: background.full }} style={{paddingVertical: 10}}>
                            <View style={styles.body}>
                                <ProfileInput />
                                <BioInput />
                            </View>
                            <SubmitButton style={styles.imageSubmit} />
                        </ImageBackground>
                    }
                    <Beam style={{ marginBottom: 20 }} />
                    <View style={styles.body2}>
                        <TouchableOpacity style={{ marginTop: 4, flex: 1, alignItems: "center" }} onPress={submit}>
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
    //region bigImage
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
    //endregion
    //region bigPlus
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
    //endregion
    //region imageBackground
    imageBackground: {
        flex: 1,
        width: "100%",
        justifyContent: "flex-start",
        alignItems: "flex-end",
    },
    //endregion
    //region title
    title: {
        fontWeight: "400",
    },
    //endregion
    //region textInput
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
    //endregion
    //region body
    body: {
        flexDirection: 'row',
    },
    //endregion
    //region body2
    body2: {
        flexDirection: 'row',
        justifyContent: "space-between"
    },
    //endregion
    //region colorSubmit
    colorSubmit: {
        flexDirection: 'row',
        marginTop: 12,
        borderColor: colors.text1,
        shadowColor: colors.text1,
    },
    //endregion
    //region imageSubmit
    imageSubmit: {
        flexDirection: 'row',
        marginTop: 12,
        borderColor: colors.text1,
        shadowColor: colors.text1,
        backgroundColor: colors.background
    },
    //endregion
});