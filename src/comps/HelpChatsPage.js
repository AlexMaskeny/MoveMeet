import React, { useCallback } from 'react';
import { StyleSheet, Modal, View, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { dark_colors, css, rules } from '../config';
import IconButton from './IconButton';
import SimpleButton from './SimpleButton';
import SubTitle from './SubTitle';



export default function HelpChatsPage({ visible, onClose, onCreateChat, openBug}) {
    const createChat = () => {
        onClose();
        onCreateChat();
    }
    const bugReport = () => {
        onClose();
        openBug();
    }
    return (
        <Modal visible={visible} animationType="slide" transparent={true}>
            <TouchableOpacity style={styles.page} onPress={() => onClose()} activeOpacity={1}>
                <TouchableOpacity style={styles.container} activeOpacity={1}>
                    <View style={styles.header}>
                        <IconButton color={dark_colors.background} icon="bug" brand="Ionicons" size={32}/>
                        <SubTitle color={dark_colors.pBeamBright} style={styles.title} size={18}>What are chats near you?</SubTitle>
                        <IconButton color={dark_colors.text1} icon="ios-close-circle" brand="Ionicons" size={32} onPress={onClose} />
                    </View>
                    <View style={styles.content}>
                        <SubTitle color={dark_colors.pBeamBright} style={styles.title} size={16}>They are public</SubTitle>
                        <SubTitle style={styles.subtitle} size={16}>Near you chats are group chats that</SubTitle>
                        <SubTitle style={styles.subtitle} size={16}>are shown to all people within {rules.nearYouRadius} feet</SubTitle>
                        <SubTitle style={styles.subtitle} size={16}>of where the chat was created.</SubTitle>
                    </View>
                    <View style={styles.content}>
                        <SubTitle color={dark_colors.pBeamBright} style={styles.title} size={16}>They aren't permanent</SubTitle>
                        <SubTitle style={styles.subtitle} size={16}>These chats will automatically be</SubTitle>
                        <SubTitle style={styles.subtitle} size={16}>removed if there isn't any activity in the</SubTitle>
                        <SubTitle style={styles.subtitle} size={16}>chat for more than {rules.chatDeletionTime} hours.</SubTitle>
                    </View>
                    <View style={{height: 10}} />
                    <SimpleButton onPress={createChat} title="Create One Now" />
                    <TouchableOpacity style={{ marginTop: 10 }} onPress={bugReport}>
                        <SubTitle style={styles.title} color={dark_colors.text1} size={16}>Report Bug</SubTitle>
                    </TouchableOpacity>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    )
}

const styles = StyleSheet.create({
    page: {
        flex: 1,
        alignItems: "center",
        justifyContent: "flex-end",
    },
    header: {
        width: "100%",
        justifyContent: "space-between",
        alignItems: "center",
        flexDirection: "row",
        paddingHorizontal: 14,
        paddingTop: 14,
        paddingBottom: 10,
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
    container: {
        backgroundColor: dark_colors.background,
        width: "100%",
        height: Dimensions.get('window').height * 0.62,
        borderColor: dark_colors.pBeamBright,
        borderTopWidth: 2,
        ...css.beamShadow
    },
    content: {
        justifyContent: "flex-start",
        alignItems: "center",
        backgroundColor: dark_colors.container,
        margin: 8,
        borderRadius: 20,
        padding: 20,
        ...css.beamShadow,
        shadowColor: "rgba(0,0,0,0.7)"
    },

})