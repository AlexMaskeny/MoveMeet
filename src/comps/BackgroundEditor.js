import React, { useCallback } from 'react';
import { StyleSheet, Modal, View, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { colors, css } from '../config';
import IconButton from './IconButton';
import SubTitle from './SubTitle';



export default function BackgroundEditor({ visible, onClose, onSuccess }) {

    const COLORS = [
        { id: 0, color: "#B30000" },
        { id: 1, color: "#800000" },
        { id: 2, color: "#a0db8e" },
        { id: 3, color: "#065535" },
        { id: 4, color: "#ffc0cb" },
        { id: 5, color: "#ff1493" },
        { id: 6, color: "#b0e0e6" },
        { id: 7, color: "#000080" },
        { id: 9, color: "#C7C7FF" },
        { id: 8, color: "#660066" },
        { id: 11, color: "#ffffff" },
        { id: 10, color: "#000000" },
    ]


    return (
        <Modal visible={visible} animationType="slide">
            <View style={styles.page}>
                <View style={styles.header}>
                    <IconButton color={colors.container} icon="ios-close-circle" brand="Ionicons" size={32} />
                    <SubTitle color={colors.pBeamBright} style={styles.title} size={18}>Select Color</SubTitle>
                    <IconButton color={colors.text1} icon="ios-close-circle" brand="Ionicons" size={32} onPress={onClose} />
                </View>
                <FlatList
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={{
                                width: Dimensions.get("window").width / 3,
                                height: Dimensions.get("window").width / 3,
                                padding: 8,
                            }}
                            onPress={() => {
                                onSuccess(item.color);
                                onClose();
                            }}
                        >
                            <View style={{ backgroundColor: item.color, flex: 1, borderRadius: 10, ...css.beamShadow, shadowColor: "black" }} />
                        </TouchableOpacity>
                    )}
                    keyExtractor={(item) => item.id}
                    data={COLORS}
                    numColumns={3}
                />
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

})