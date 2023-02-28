import React, { useRef } from 'react';
import { StyleSheet, Image, View, TouchableOpacity, Dimensions } from 'react-native';
import {
    Menu,
    MenuOptions,
    MenuOption,
    MenuTrigger,
} from 'react-native-popup-menu';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { CommonActions } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

import { colors, css } from '../config';
import ProfileCircle from './ProfileCircle';
import SubTitle from './SubTitle';
import ImageLoader from './ImageLoader';
import DarkBeam from './DarkBeam';
import * as logger from '../functions/logger';

function ImageMessage({ children, ppic, username, userId, opposingUserId, source, style, time, onPress, navigation, ...props }) {
    const menuRef = useRef();

    const onView = async () => {
        if (opposingUserId != userId) {
            navigation.dispatch(CommonActions.navigate({
                name: "OProfilePage",
                key: opposingUserId,
                params: {
                    opposingUser: { id: opposingUserId },
                }
            }))
        }
    }
    const onSave = async () => {
        try {
            const perms = await MediaLibrary.getPermissionsAsync();
            if (!perms.granted) {
                const perms2 = await MediaLibrary.requestPermissionsAsync();
                if (!perms2.granted) return;
            }
            var localuri;
            if (source.disabled) localuri = source.full
            else {
                const response = await FileSystem.downloadAsync(source.full, FileSystem.documentDirectory + imgKey + ".jpg");
                localuri = response.uri
            }
            await MediaLibrary.createAssetAsync(localuri);

        } catch (error) {
            logger.warn(error);
        }
    }
    
    return (
        <View style={styles.container}>
            <ProfileCircle ppic={ppic} style={styles.pCircle} />
            <View style={{ width: 6 }} />
            <View style={{ flex: 1, marginRight: 10 }}>
                <View style={{ flexDirection: 'row', flex: 1, justifyContent: "space-between" }}>
                    <SubTitle size={16} color={colors.text4}>{username}</SubTitle>
                    <SubTitle size={14} color={colors.text4}>{time}</SubTitle>
                </View>
                <View style={{ height: 4 }} />
                <TouchableOpacity activeOpacity={1} onPress={onPress} onLongPress={() => menuRef.current.open()} style={styles.iContainer}>          
                    <ImageLoader style={styles.image} disabled={source.disabled} source={source.full} defaultSource={source.loadFull} cacheKey={source.fullKey} />
                    <Menu onOpen={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)} ref={menuRef}>
                        <MenuTrigger triggerOnLongPress={true} />
                        <MenuOptions customStyles={{ optionsContainer: styles.menu }}>
                            <View style={styles.innerMenu}>
                                <View style={{ flexDirection: "row", alignItems: "center" }}>
                                    <ProfileCircle ppic={ppic} style={styles.pCircle} />
                                    <View style={{ width: 6 }} />
                                    <View style={{ flexDirection: 'row', flex: 1, justifyContent: "space-between" }}>
                                        <SubTitle size={16} color={colors.text4}>{username}</SubTitle>
                                        <SubTitle size={14} color={colors.text4}>{time}</SubTitle>
                                    </View>
                                </View>
                                <View style={{marginTop: 10}} />
                                <ImageLoader style={styles.image} disabled={source.disabled} source={source.full} defaultSource={source.loadFull} cacheKey={source.fullKey} />
                            </View>
                            <View style={{ marginTop: 10 }} />
                            <View style={styles.innerMenu}>
                                {opposingUserId != userId && <>
                                    <MenuOption style={styles.optionContainer} onSelect={onView}>
                                        <MaterialIcons name="account-box" size={26} color={colors.pBeamBright} />
                                        <View style={{ width: 10 }} />
                                        <SubTitle style={styles.title} size={18}>View User Profile</SubTitle>
                                    </MenuOption>
                                    <DarkBeam style={styles.seperator} />
                                </>}
                                <MenuOption style={styles.optionContainer} onSelect={onSave}>
                                    <MaterialIcons name="save-alt" size={26} color={colors.pBeamBright} />
                                    <View style={{ width: 10 }} />
                                    <SubTitle style={styles.title} size={18}>Save Image</SubTitle>
                                </MenuOption>
                            </View>
                        </MenuOptions>
                    </Menu>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: "flex-start",
        flexDirection: "row",
        borderRadius: 20,

    },
    tStyle: {
        color: colors.text3,
        fontSize: 16,
        flex: 2,

    },
    pCircle: {
        width: 44,
        height: 44,
        borderWidth: 1,
        shadowOpacity: 0,
        borderColor: colors.text3
    }, 
    image: {
        width: 200,
        height: 280,
        borderRadius: 20,
        overflow: 'hidden',
        alignItems: "flex-end",
    },
    menu: {
        width: "100%",
        alignItems: "center",
        backgroundColor: "transparent",
    },
    iContainer: {
        ...css.beamShadow,
        shadowColor: "black",
        shadowRadius: 2,
    },
    innerMenu: {
        borderRadius: 26,
        padding: 16,
        backgroundColor: colors.container,
        width: Dimensions.get('screen').width * 0.9,
        borderColor: colors.pBeamBright,
        borderWidth: 2,
        ...css.beamShadow,
    },
    optionContainer: {
        flexDirection: 'row',
        alignItems: "center"
    },
    title: {
        fontWeight: "bold",
        color: colors.text2
    },
    seperator: {
        marginVertical: 8,
        backgroundColor: colors.text4,
        height: 1,
    }
})

export default ImageMessage;