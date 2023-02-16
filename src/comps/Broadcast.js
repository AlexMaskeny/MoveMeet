import React from 'react';
import { StyleSheet, Modal, View, TouchableOpacity, Linking } from 'react-native';

import { colors, css, strings } from '../config';
import IconButton from './IconButton';
import SubTitle from './SubTitle';
import * as logger from '../functions/logger';
import SimpleButton from './SimpleButton';
import { MaterialCommunityIcons } from '@expo/vector-icons'; 

export default function Broadcast({ visible, onClose, broadcast }) {
    const onButton1 = () => {
        try {
            Linking.openURL(broadcast.button1link);
        } catch (error) {
            logger.warn(error);
        }
    }
    const onButton2 = () => {
        try {
            Linking.openURL(broadcast.button2link);
        } catch (error) {
            logger.warn(error);
        }
    }
    return (
        <Modal visible={visible} animationType="slide">
            <View style={styles.page}>
                <View style={styles.header}>
                    <IconButton color={colors.container} icon="ios-close-circle" brand="Ionicons" size={32} />
                    <SubTitle color={colors.pBeamBright} style={styles.title} size={18}>{strings.APPNAME} Reminders</SubTitle>
                    <IconButton color={colors.text1} icon="ios-close-circle" brand="Ionicons" size={32} onPress={onClose} />
                </View>
                <View style={styles.body}>
                    <MaterialCommunityIcons name="hand-wave" size={60} color={colors.pBeamBright} />
                    <SubTitle color={colors.pBeamBright} style={styles.title} size={18}>{broadcast.title}</SubTitle>
                    <View style={styles.content}>
                        <SubTitle color={colors.text2} style={styles.subtitle} size={16} numberOfLines={10}>{broadcast.content}</SubTitle>
                    </View>
                    {broadcast.button1text && <>
                        <View style={{ height: 10 }} />
                        <SimpleButton
                            title={broadcast.button1text}
                            outerStyle={{ width: "100%", backgroundColor: colors.container, borderColor: colors.text1, shadowColor: "transparent" }}
                            onPress={onButton1}
                        />                
                    </>}
                    {broadcast.button2text && <>
                        <View style={{ height: 10 }} />
                        <SimpleButton
                            title={broadcast.button2text}
                            outerStyle={{width: "100%", backgroundColor: colors.container} }
                            onPress={onButton2}
                        />
                    </>}
                </View>
                <TouchableOpacity onPress={onClose}>
                    <SubTitle color={colors.pBeamBright} style={styles.title} size={16}>Dismiss</SubTitle>
                </TouchableOpacity>
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
        borderBottomColor: colors.pBeamBright,
        borderBottomWidth: 2,
        zIndex: 5,
        ...css.beamShadow
    },
    title: {
        fontWeight: "bold",
        alignSelf: "center",
    },

    subtitle: {
        fontWeight: "400",
        color: colors.text2,
        alignContent: "center"
    },
    body: {
        padding: 10,
        paddingVertical: 20,
        alignItems: "center",
        backgroundColor: colors.container,
        margin: 20,
        borderRadius: 20,
    },
    content: {
        padding: 8,
        alignContent: "center"
    }

})