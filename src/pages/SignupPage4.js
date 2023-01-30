import AsyncStorage from '@react-native-async-storage/async-storage';
import { API, Auth, graphqlOperation, Storage } from 'aws-amplify';
import React, { useRef, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Keyboard, Alert, ImageBackground, ActivityIndicator } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';

import Beam from '../comps/Beam';
import BeamTitle from '../comps/BeamTitle';
import Screen from '../comps/Screen';
import SimpleButton from '../comps/SimpleButton';
import SimpleInput from '../comps/SimpleInput';
import SubTitle from '../comps/SubTitle';
import { colors, css, storage } from '../config';
import * as logger from '../functions/logger'; 
import * as media from '../functions/media';
import { updateUser } from '../api/calls';
import IconButton from '../comps/IconButton';

export default function SignupPage4({ navigation, route }) {
    const [bio, setBio] = useState("");
    const [profilePicture, setProfilePicture] = useState(false);
    const [image, setImage] = useState({});
    const [loading, setLoading] = useState(false);

    const Submit = async () => {
        try {
            setLoading(true);
            await Location.requestForegroundPermissionsAsync();
            const result = await Notifications.requestPermissionsAsync();
            var params = {
                id: route.params.userID,
                allowNotifications: false,
            }
            if (result.granted) {
                const token = await Notifications.getExpoPushTokenAsync();
                params = {
                    ...params,
                    allowNotifications: true,
                    expoToken: token.data
                }
            }
            
            if (bio.length > 0) params = { ...params, bio: bio };
            if (profilePicture) {

                const response1 = await fetch(image.full);

                if (response1) {
                    const img = await response1.blob();
                    if (img) {
                        await Storage.put("FULLprofilePicture" + route.params.userID + ".jpg", img);
                    }
                }
                const response2 = await fetch(image.loadFull);
                if (response2) {
                    const img = await response2.blob();
                    if (img) {
                        await Storage.put("LOADFULLprofilePicture" + route.params.userID + ".jpg", img);
                    }
                }
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
            await API.graphql(graphqlOperation(updateUser, {
                input: params
            }));
        } catch (error) {
            logger.warn(error);
        } finally {
            setLoading(false);
            navigation.navigate("LoadingPage");
        }
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
                    <SubTitle size={14}>lummp is designing your profile.</SubTitle>
                    <TouchableOpacity style={{ marginTop: 4 }} onPress={Submit}>
                        <BeamTitle size={16} style={{fontWeight: "500", marginBottom: 20} }>Skip Step</BeamTitle>
                    </TouchableOpacity>
                    {!profilePicture &&
                        <TouchableOpacity style={styles.bigImage} onPress={selectImage} disabled={loading} >
                            {!loading && <>
                                <SubTitle style={styles.title} size={20}>Profile Picture</SubTitle>
                                <IconButton color={colors.pBeamBright} icon="add-circle" brand="Ionicons" size={70} disabled={true} />
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
                        style={styles.textInput}
                        placeholder="Bio"
                        onChangeText={(text)=>setBio(text)}
                    />
                    <SimpleButton disabled={loading} loading={loading} title="Done" onPress={Submit} outerStyle={{flexDirection: 'row', marginTop: 12} }/>
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
    bigImage: {
        backgroundColor: colors.container,
        borderRadius: 200,
        height: 200,
        width: 200,
        margin: 10,
        borderWidth: 2,
        borderColor: colors.pBeam,
        ...css.beamShadow,
        alignItems: "center",
        justifyContent: 'center',
    },
    bigPlus: {
        height: 100,
        width: 100,
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
        height: 160,
        width: "100%",
        marginTop: 10,
        padding: 10,
    },
})