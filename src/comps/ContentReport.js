import React, { useState } from 'react';
import { StyleSheet, Modal, View, TouchableOpacity, KeyboardAvoidingView, Keyboard, Alert, Linking} from 'react-native';
import uuid from "react-native-uuid";

import { dark_colors, css } from '../config';
import IconButton from './IconButton';
import SubTitle from './SubTitle';
import { MaterialIcons } from '@expo/vector-icons'; 
import SimpleInput from './SimpleInput';
import SimpleButton from './SimpleButton';
import * as logger from '../functions/logger';
import { calls, mmAPI } from '../api/mmAPI';

export default function ContentReport({ visible, onClose, currentUserId, opposingUserId }) {
    const [description, setDescription] = useState(false);
    const [loading, setLoading] = useState(false);

    const close = () => {
        setDescription([]);
        onClose();
    }

    const submit = async () => {
        try {
            setLoading(true);
            if (description.length > 16) {
                const id = uuid.v4();
                const now = new Date(Date.now());
                await mmAPI.mutate({
                    call: calls.CREATE_REPORT,
                    input: {
                        id: id,
                        description: description,
                        reportedBy: currentUserId,
                        reportedUser: opposingUserId,
                        createdAt: now.toUTCString(),
                        updatedAt: now.toUTCString(),
                    }
                })
                Alert.alert("Report Submitted", "You have successfully submitted your report. We will look into this content.");
                setLoading(false);
                close()
            } else {
                Alert.alert("Your report isn't long enough", "Please type a more detailed response when making a report");
            }
        } catch (error) {
            logger.warn(error);
        } finally {
            setLoading(false);
        }
    }
    return (
        <Modal visible={visible} animationType="slide">
            <TouchableOpacity onPress={() => Keyboard.dismiss()} activeOpacity={1} style={styles.page}>
                <View style={styles.header}>
                    <IconButton color={dark_colors.container} icon="ios-close-circle" brand="Ionicons" size={32} />
                    <SubTitle color={dark_colors.pBeamBright} style={styles.title} size={18}>Report Content</SubTitle>
                    <IconButton color={dark_colors.text1} icon="ios-close-circle" brand="Ionicons" size={32} onPress={onClose} />
                </View>
                <KeyboardAvoidingView behavior="position">
                    <View style={styles.body}>
                        <MaterialIcons name="report" size={44} color={dark_colors.text1} />
                        <View style={{height: 10}} />
                        <SubTitle style={styles.subtitle} size={16}>Did you see a user breaking a rule?</SubTitle>
                        <SubTitle style={styles.subtitle} size={16}>We would greatly appreciate it if</SubTitle>
                        <SubTitle style={styles.subtitle} size={16}>you report them. Please mention</SubTitle>
                        <View style={{ flexDirection: 'row' }}>
                            <SubTitle style={styles.subtitle} size={16}>which </SubTitle>
                            <TouchableOpacity onPress={()=>Linking.openURL("https://movemeet.com/rules")}>
                                <SubTitle style={[styles.subtitle, {color: dark_colors.pBeam}]} size={16}>rule</SubTitle>
                            </TouchableOpacity>
                            <SubTitle style={styles.subtitle} size={16}> they violated. Thank you!</SubTitle> 
                        </View>
                        <View style={{ height: 10 }} />
                        <View style={styles.content}>
                            <SimpleInput
                                autoCorrect={true}
                                multiline={true}
                                maxLength={300}
                                cStyle={styles.textInput}
                                tStyle={{ alignSelf: 'flex-start', margin: 0 }}
                                placeholder="Please include a description of the content you are report and which rule it violates. The rules can be viewed by clicking the rule link above."
                                onChangeText={(text) => setDescription(text)}
                            /> 
                        </View>
                    </View>
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
        backgroundColor: dark_colors.background
    },
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
        borderBottomColor: dark_colors.pBeamBright,
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
        color: dark_colors.text2
    },
    body: {
        padding: 10,
        alignItems: "center"
    },
    textInput: {
        color: dark_colors.text1,
        fontSize: 18,
        height: 180,
        padding: 0,
        margin: 0,

        alignContent: "flex-start",
        justifyContent: 'flex-start'
    },
    content: {
        color: dark_colors.text1,
        height: 260,
        width: "100%",
        marginTop: 10,
        padding: 10,
        paddingHorizontal: 0,
        ...css.beamShadow,
        shadowColor: "black",
        backgroundColor: dark_colors.container,
        borderRadius: 20,
        alignContent: "flex-start",
        justifyContent: 'flex-start'
    },
})