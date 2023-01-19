import React, { useRef, useState } from 'react';
import { StyleSheet, Modal, View, Alert, TouchableOpacity, ActivityIndicator, ImageBackground} from 'react-native';
import uuid from "react-native-uuid";
import { API, graphqlOperation, Storage } from 'aws-amplify';
import * as Location from 'expo-location';

import { colors, css } from '../config';
import { createPost } from '../api/calls';
import IconButton from './IconButton';
import SimpleButton from './SimpleButton';
import SubTitle from './SubTitle';
import * as media from '../functions/media';
import * as logger from '../functions/logger'
import * as locConversion from '../functions/locConversion';
import Beam from './Beam';


export default function CreatePost({ visible, onClose, currentUser }) {
    const [loading1, setLoading1] = useState("");
    const [loading2, setLoading2] = useState("");

    const [image, setImage] = useState("");

    const id = useRef();

    const close = () => {
        setImage("");
        onClose();
    }

    const selectImage = async () => {
        setLoading1(true);
        id.current = uuid.v4();
        await media.openPhotos((img) => setImage(img));
        setLoading1(false);
    }

    const CreatePost = async () => {
        try {
            setLoading2(true);
            const location = await Location.getForegroundPermissionsAsync();
            if (!location.granted) {
                Alert.alert("Location Needed", "You need to let ProxyChat use your location to use this.", [
                    { text: "Okay" }
                ]);
                return;
            }
            const userLocation = await Location.getLastKnownPositionAsync();
            const userLocationConverted = locConversion.toUser(userLocation.coords.latitude, userLocation.coords.longitude);
            const response = await fetch(image);
            if (response) {
                const img = await response.blob();
                if (img) {
                    await Storage.put("FULLpost" + id.current + ".jpg", img);
                }
            }
            const result2 = await API.graphql(graphqlOperation(createPost, {
                input: {
                    id: id.current,
                    image: {
                        bucket: "proxychatf2d762e9bc784204880374b0ca905be4120629-dev",
                        full: "FULLpost" + id.current + ".jpg",
                        loadFull: "LOADFULLpost" + id.current + ".jpg",
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
            }));
            if (result2) {
                setTimeout(function () {
                    Alert.alert("Success", "Post Successfully Created.", [
                        { text: "Okay", onPress: ()=>close() },
                    ])
                    setLoading2(false);
                }, 1000);
            } else {
                throw ""
            }
        } catch (error) {
            logger.warn(error);
            setLoading2(false);
        }
    }

    return (
        <Modal visible={visible} animationType="slide">
            <View style={styles.page}>
                <View style={styles.header}>
                    <IconButton color={colors.container} icon="ios-close-circle" brand="Ionicons" size={32} />
                    <SubTitle color={colors.pBeamBright} style={styles.title} size={18}>Create Post</SubTitle>
                    <IconButton color={colors.text1} icon="ios-close-circle" brand="Ionicons" size={32} onPress={close} />
                </View>
                {image.length == 0 && 
                    <TouchableOpacity style={styles.bigImage} onPress={selectImage} disabled={loading1} >
                        <View style={styles.bigPlus}>
                            {!loading1 && <IconButton color={colors.pBeamBright} icon="add-circle" brand="Ionicons" size={70} disabled={true} />}
                            {loading1 && <ActivityIndicator color={colors.pBeamBright} size="large" /> }
                        </View>
                    </TouchableOpacity>
                }
                {image.length > 0 &&
                    <TouchableOpacity style={styles.bigImage} onPress={selectImage} disabled={loading1} >
                        <ImageBackground source={{ uri: image }} style={styles.imageBackground} imageStyle={{borderRadius: 20}}>
                            <View style={[styles.smallPlus, {backgroundColor: colors.container, margin: 10}]}>
                                {!loading1 && <IconButton color={colors.pBeamBright} icon="add-circle" brand="Ionicons" size={34} disabled={true} />}
                                {loading1 && <ActivityIndicator color={colors.pBeamBright} size="small" />}
                            </View>
                        </ImageBackground>
                    </TouchableOpacity>
                }
                <View style={styles.desc}>
                    <SubTitle size={16} style={styles.subtitle}>When you create a post it will</SubTitle>
                    <SubTitle size={16} style={styles.subtitle}>display on your profile publicly and</SubTitle>
                    <SubTitle size={16} style={styles.subtitle}>to everyone near you. You can</SubTitle>
                    <SubTitle size={16} style={styles.subtitle}>delete posts by editing your profile.</SubTitle>
                </View>
                <Beam style={{ marginTop: 20, marginBottom: 10 }} />

                {(image.length > 0) && <SimpleButton title="Create Post" onPress={CreatePost} loading={loading2} disabled={loading2} />}
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    page: {
        flex: 1,
        backgroundColor: colors.background
    },
    header: {
        backgroundColor: colors.container,
        width: "100%",
        justifyContent: "space-between",
        alignItems: "center",
        flexDirection: "row",
        paddingHorizontal: 14,
        paddingTop: 50,
        paddingBottom: 10,
        marginBottom: 10,
    },
    title: {
        fontWeight: "bold",
        alignSelf: "center",
    },
    desc: {
        marginTop: 6,
        alignItems: "center",
        justifyContent: "center"
    },
    subtitle: {
        fontWeight: "400"
    },
    bigImage: {
        backgroundColor: colors.container,
        borderRadius: 20,
        height: 400,
        margin: 10,
        ...css.beamShadow,
        shadowColor: "black",
        alignItems: "center",
        justifyContent: 'center',
    },
    bigPlus: {
        height: 200,
        width: 200,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 20,
        borderColor: colors.pBeamBright,
        borderWidth: 2,
        ...css.beamShadow
    },
    smallPlus: {
        height: 70,
        width: 70,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 20,
        borderColor: colors.pBeamBright,
        borderWidth: 2,
        ...css.beamShadow
    },
    imageBackground: {
        flex: 1,
        width: "100%",
        justifyContent: "flex-start",
        alignItems: "flex-end",
    }
})