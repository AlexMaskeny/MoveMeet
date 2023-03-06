//region 3rd Party Imports
import React, { useRef, useState } from 'react';
import { StyleSheet, Modal, View, Alert, TouchableOpacity, ActivityIndicator, ImageBackground} from 'react-native';
import uuid from "react-native-uuid";
import NetInfo from "@react-native-community/netinfo";
import * as Location from 'expo-location';
//endregion
//region 1st Party Imports
import IconButton from './IconButton';
import SimpleButton from './SimpleButton';
import SubTitle from './SubTitle';
import Beam from './Beam';
import { dark_colors, css, strings } from '../config';
import { calls, mmAPI } from '../api/mmAPI';
import * as media from '../functions/media';
import * as logger from '../functions/logger'
import * as locConversion from '../functions/locConversion';
//endregion

export default function CreatePost({ visible, onClose, currentUser, navigation }) {
    const [loading1, setLoading1] = useState(false);
    const [loading2, setLoading2] = useState(false);

    const [image, setImage] = useState("");
    const [smallImage, setSmallImage] = useState("");

    const id = useRef();

    //region [FUNCTION]   "close = ()" = Exit this modal
    const close = () => {
        setImage("");
        onClose();
    }
    //endregion

    //region [FUNC ASYNC] "selectImage = async ()" = Opens the menu to select the post's image
    const selectImage = async () => {
        id.current = uuid.v4();
        const onSuccess = (uri) => {
            setImage(uri.full);
            setSmallImage(uri.loadFull);
        }
        Alert.alert("Take a photo or select one", "Pick one of the options below to change your profile picture.", [
            { text: "Take Picture", onPress:() => media.openCamera(onSuccess) },
            { text: "Open Photos", onPress: () => media.openPhotos(onSuccess) }
        ]);
    }
    //endregion

    //region [FUNC ASYNC] "enableLocation = async ()" = Called when the user wants to enable their location
    const enableLocation = async () => {
        const result = await Location.getForegroundPermissionsAsync();
        if (result.canAskAgain) {
            const result = await Location.requestForegroundPermissionsAsync();
            if (result.granted) {
                navigation.navigate("LoadingPage");
                onClose();
            }
        } else {
            Alert.alert("Go to your settings", "In order to enable " + strings.APPNAME + " to access your location, you need to enable it in your settings");
        }
    }
    //endregion

    //region [FUNC ASYNC] "createPost = async ()" = Trigger when clicking the submit button. Creates the post.
    const createPost = async () => {
        try {
            setLoading2(true);
            //region Ensure the user is connected
            const netInfo = await NetInfo.fetch();
            if (!netInfo.isConnected) {
                Alert.alert("No Connection", "You must be connected to the internet to do this.");
                throw "No Connection";
            }
            //endregion

            //region Get the user's location and convert it to ft
            const location = await Location.getForegroundPermissionsAsync();
            if (!location.granted) {
                Alert.alert("Location Needed", "You need to let " + strings.APPNAME + " use your location to create posts. You will have to recreate your post after giving us access.", [
                    { text: "Cancel" },
                    { text: "Give Access", onPress: enableLocation },
                ]);
                throw "Location Needed";
            }
            const userLocation = await Location.getLastKnownPositionAsync();
            const userLocationConverted = locConversion.toUser(userLocation.coords.latitude, userLocation.coords.longitude);
            //endregion

            //region Upload the image to s3
            await mmAPI.store("FULLPOST" + id.current + ".jpg", image);
            await mmAPI.store("LOADFULLPOST" + id.current + ".jpg", smallImage);
            //endregion
            //region Create the post in the database
            const result2 = await mmAPI.mutate({
                call: calls.CREATE_POST,
                input: {
                    id: id.current,
                    image: {
                        bucket: "proxychatf2d762e9bc784204880374b0ca905be4120629-dev",
                        full: "FULLPOST" + id.current + ".jpg",
                        loadFull: "LOADFULLPOST" + id.current + ".jpg",
                        region: "us-east-2",
                    },
                    lat: userLocationConverted.lat,
                    long: userLocationConverted.long,
                    latf1: userLocationConverted.latf1,
                    latf2: userLocationConverted.latf2,
                    longf1: userLocationConverted.longf1,
                    longf2: userLocationConverted.longf2,
                    userPostsId: currentUser.id
                }

            });
            //endregion
            //region Success, exit the modal.
            setTimeout(function () {
                Alert.alert("Success", "Post Successfully Created.", [
                    { text: "Okay", onPress: ()=>close() },
                ])
                setLoading2(false);
            }, 1000);
            //endregion
        } catch (error) {
            logger.warn(error);
            setLoading2(false);
        }
    }
    //endregion

    return (
        <Modal visible={visible} animationType="slide">
            <View style={styles.page}>
                <View style={styles.header}>
                    <IconButton color={dark_colors.container} icon="ios-close-circle" brand="Ionicons" size={32} />
                    <SubTitle color={dark_colors.pBeamBright} style={styles.title} size={18}>Create Post</SubTitle>
                    <IconButton color={dark_colors.text1} icon="ios-close-circle" brand="Ionicons" size={32} onPress={close} />
                </View>
                {image.length === 0 &&
                    <TouchableOpacity style={styles.bigImage} onPress={selectImage} disabled={loading1} >
                        <View style={styles.bigPlus}>
                            {!loading1 && <IconButton color={dark_colors.pBeamBright} icon="add-circle" brand="Ionicons" size={70} disabled={true} />}
                            {loading1 && <ActivityIndicator color={dark_colors.pBeamBright} size="large" /> }
                        </View>
                    </TouchableOpacity>
                }
                {image.length > 0 &&
                    <TouchableOpacity style={styles.bigImage} onPress={selectImage} disabled={loading1} >
                        <ImageBackground source={{ uri: image }} style={styles.imageBackground} imageStyle={{borderRadius: 20}}>
                            <View style={[styles.smallPlus, {backgroundColor: dark_colors.container, margin: 10}]}>
                                {!loading1 && <IconButton color={dark_colors.pBeamBright} icon="add-circle" brand="Ionicons" size={34} disabled={true} />}
                                {loading1 && <ActivityIndicator color={dark_colors.pBeamBright} size="small" />}
                            </View>
                        </ImageBackground>
                    </TouchableOpacity>
                }
                <View style={styles.desc}>
                    <SubTitle size={16} style={styles.subtitle}>When you create a post it will</SubTitle>
                    <SubTitle size={16} style={styles.subtitle}>display on your profile publicly.</SubTitle>
                    <SubTitle size={16} style={styles.subtitle}>Delete posts by editing your profile.</SubTitle>
                </View>
                <Beam style={{ marginTop: 20, marginBottom: 10 }} />

                {(image.length > 0) && <SimpleButton title="Create Post" onPress={createPost} loading={loading2} disabled={loading2} />}
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    //region page
    page: {
        flex: 1,
        backgroundColor: dark_colors.background
    },
    //endregion
    //region header
    header: {
        backgroundColor: dark_colors.container,
        width: "100%",
        justifyContent: "space-between",
        alignItems: "center",
        flexDirection: "row",
        paddingHorizontal: 14,
        paddingTop: 50,
        paddingBottom: 10,
        marginBottom: 10,
    },
    //endregion
    //region title
    title: {
        fontWeight: "bold",
        alignSelf: "center",
    },
    //endregion
    //region desc
    desc: {
        marginTop: 6,
        alignItems: "center",
        justifyContent: "center"
    },
    //endregion
    //region subtitle
    subtitle: {
        fontWeight: "400"
    },
    //endregion
    //region bigImage
    bigImage: {
        backgroundColor: dark_colors.container,
        borderRadius: 20,
        height: 400,
        margin: 10,
        ...css.beamShadow,
        shadowColor: "black",
        alignItems: "center",
        justifyContent: 'center',
    },
    //endregion
    //region bigPlus
    bigPlus: {
        height: 200,
        width: 200,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 20,
        borderColor: dark_colors.pBeamBright,
        borderWidth: 2,
        ...css.beamShadow
    },
    //endregion
    //region smallPlus
    smallPlus: {
        height: 70,
        width: 70,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 20,
        borderColor: dark_colors.pBeamBright,
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
});