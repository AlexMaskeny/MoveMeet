import React, { useCallback, useState } from 'react';
import { StyleSheet, Modal, View, TouchableOpacity, FlatList, Dimensions, KeyboardAvoidingView, Keyboard, Image, Alert} from 'react-native';
import uuid from "react-native-uuid";

import { colors, css, strings } from '../config';
import IconButton from './IconButton';
import SubTitle from './SubTitle';
import { Ionicons } from '@expo/vector-icons'; 
import SimpleInput from './SimpleInput';
import SimpleButton from './SimpleButton';
import * as media from '../functions/media';
import * as logger from '../functions/logger';
import { calls, mmAPI } from '../api/mmAPI';

export default function BugReport({ visible, onClose, currentUser }) {
    const [description, setDescription] = useState(false);
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);

    const close = () => {
        setImages([]);
        setDescription([]);
        onClose();
    }

    const addImages = async () => {
        media.openMultiplePhotos((result) => setImages(result));
    }

    const submit = async () => {
        try {
            setLoading(true);
            if (description.length > 20) {
                const id = uuid.v4();
                const imgs = []
                for (var i = 0; i < images.length; i++) {
                    await mmAPI.store("BUGREPORT" + id + "-" + i + ".jpg", images[i].full);
                    imgs.push({
                        bucket: "proxychatf2d762e9bc784204880374b0ca905be4120629-dev",
                        region: "us-east-2",
                        full: "BUGREPORT" + id + "-" + i + ".jpg",
                        loadFull: ""
                    });
                }
                const now = new Date(Date.now());
                await mmAPI.mutate({
                    call: calls.CREATE_BUG,
                    input: {
                        id: id,
                        description: description,
                        reportedBy: currentUser.id,
                        images: imgs,
                        createdAt: now.toUTCString(),
                        updatedAt: now.toUTCString(),
                    }
                });
                Alert.alert("Thank you!", "You have successfully submitted your bug report.");
                setLoading(false);
                close()
            } else {
                Alert.alert("Your report isn't long enough", "Please type a more detailed response when making a bug report");
            }
        } catch (error) {
            logger.warn(error);
        } finally {
            setLoading(false);
        }
    }
    const renderItem = useCallback(({item}) => (
        <Image style={styles.imageSelection} source={{uri: item.full}} />    

    ));
    return (
        <Modal visible={visible} animationType="slide">
            <TouchableOpacity onPress={() => Keyboard.dismiss()} activeOpacity={1} style={styles.page}>
                <View style={styles.header}>
                    <IconButton color={colors.container} icon="ios-close-circle" brand="Ionicons" size={32} />
                    <SubTitle color={colors.pBeamBright} style={styles.title} size={18}>Report Bug</SubTitle>
                    <IconButton color={colors.text1} icon="ios-close-circle" brand="Ionicons" size={32} onPress={onClose} />
                </View>
                <KeyboardAvoidingView behavior="position">
                    <View style={styles.body}>
                        <Ionicons name="bug" size={44} color={colors.text1} />
                        <View style={{height: 10}} />
                        <SubTitle style={styles.subtitle} size={16}>We work hard at {strings.APPNAME} to give you</SubTitle>
                        <SubTitle style={styles.subtitle} size={16}>the best possible experience, but</SubTitle>
                        <SubTitle style={styles.subtitle} size={16}>sometimes we miss a bug or two. We</SubTitle>
                        <SubTitle style={styles.subtitle} size={16}>greatly appreciate all bug reports!</SubTitle>
                        <View style={{ height: 10 }} />
                        <View style={styles.content}>
                            <SimpleInput
                                autoCorrect={true}
                                multiline={true}
                                maxLength={300}
                                cStyle={styles.textInput}
                                tStyle={{ alignSelf: 'flex-start', margin: 0 }}
                                placeholder="Please describe the bug you wish to report in a few sentences."
                                onChangeText={(text) => setDescription(text)}
                            /> 
                            <FlatList
                                style={{ paddingHorizontal: 14 }}
                                data={images}
                                renderItem={renderItem}
                                keyExtractor={item => item.id}
                                horizontal={true}
                            />
                        </View>
                    </View>
                    <SimpleButton
                        outerStyle={{ backgroundColor: colors.background, borderColor: colors.text1, shadowColor: "transparent" }}
                        title={images.length == 0 ? "Attach up to three images" : "Reselect Images"}
                        onPress={addImages}
                    />
                    <View style={{ height: 10 }} />
                    <SimpleButton
                        disabled={loading}
                        loading={loading}
                        title="Submit"
                        onPress={submit}
                    />
                </KeyboardAvoidingView>
            </TouchableOpacity>
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
        borderBottomColor: colors.pBeamBright,
        borderBottomWidth: 2,
        zIndex: 5,
        ...css.beamShadow
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
        fontWeight: "400",
        color: colors.text2
    },
    body: {
        padding: 10,
        alignItems: "center"
    },
    textInput: {
        color: colors.text1,
        fontSize: 18,
        height: 180,
        padding: 0,
        margin: 0,

        alignContent: "flex-start",
        justifyContent: 'flex-start'
    },
    content: {
        color: colors.text1,
        height: 260,
        width: "100%",
        marginTop: 10,
        padding: 10,
        paddingHorizontal: 0,
        ...css.beamShadow,
        shadowColor: "black",
        backgroundColor: colors.container,
        borderRadius: 20,
        alignContent: "flex-start",
        justifyContent: 'flex-start'
    },
    imageSelection: {
        height: 50,
        width: 50,
        marginHorizontal: 4,
        borderRadius: 10
    }

})