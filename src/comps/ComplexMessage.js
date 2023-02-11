import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableWithoutFeedback, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { CommonActions } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import {
    Menu,
    MenuOptions,
    MenuOption,
    MenuTrigger,
} from 'react-native-popup-menu';


import { colors, css } from '../config';
import ProfileCircle from './ProfileCircle';
import SubTitle from './SubTitle';
import DarkBeam from './DarkBeam';
import ContentReport from './ContentReport';

function ComplexMessage({ navigation, opposingUserId, userId, children, ppic, username, message, style, time, ...props }) {
    const [showContentReport, setShowContentReport] = useState(false);

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
    const onCopy = async () => {
        await Clipboard.setStringAsync(message);
    }
    const onReport = async () => {
        setShowContentReport(true);
    }

    const Message = () => (
        <View style={styles.container}>
            <ProfileCircle ppic={ppic} style={styles.pCircle} />
            <View style={{ width: 6 }} />
            <View style={{ flex: 1, marginRight: 10 }}>
                <View style={{ flexDirection: 'row', flex: 1, justifyContent: "space-between" }}>
                    <View>
                        <SubTitle size={16} color={colors.text4}>{username}</SubTitle>
                    </View>
                    <SubTitle size={14} color={colors.text4}>{time}</SubTitle>
                </View>
                <Text
                    style={[styles.tStyle, style]}
                    numberOfLines={0}
                    selectable={false}
                    {...props}
                >{message}</Text>
            </View>
        </View>
    );

    return (<>
        <Menu onOpen={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy) }>
            <MenuTrigger customStyles={{ TriggerTouchableComponent: TouchableWithoutFeedback }} triggerOnLongPress={true}>
                <Message />
            </MenuTrigger>
            <MenuOptions customStyles={{ optionsContainer: styles.menu }}>
                <View style={styles.innerMenu}>
                    <Message />
                </View>
                <View style={{height: 20}} />
                <View style={styles.innerMenu}>
                    {opposingUserId != userId && <>
                        <MenuOption style={styles.optionContainer} onSelect={onView}>
                            <MaterialIcons name="account-box" size={26} color={colors.pBeamBright} />
                            <View style={{ width: 10 }} />
                            <SubTitle style={styles.title} size={18}>View User Profile</SubTitle>
                        </MenuOption>
                        <DarkBeam style={styles.seperator} />
                    </>}
                    <MenuOption style={styles.optionContainer} onSelect={onCopy}>
                        <MaterialIcons name="content-copy" size={26} color={colors.pBeamBright} />
                        <View style={{ width: 10 }} />
                        <SubTitle style={styles.title} size={18}>Copy Message</SubTitle>
                    </MenuOption>
                    {opposingUserId != userId && <>
                    <DarkBeam style={styles.seperator} />
                    <MenuOption style={styles.optionContainer} onSelect={onReport}>
                        <MaterialIcons name="report" size={26} color={colors.pBeamBright} />
                        <View style={{ width: 10 }} />
                        <SubTitle style={styles.title} size={18}>Report Content</SubTitle>
                    </MenuOption>
                    </>}
                </View>
            </MenuOptions>
        </Menu> 
        <ContentReport visible={showContentReport} onClose={() => setShowContentReport(false)} currentUserId={userId} opposingUserId={opposingUserId} />
    </>);
}

const styles = StyleSheet.create({
    container: {
        alignItems: "flex-start",
        flexDirection: "row",
        justifyContent: "flex-start",
        borderRadius: 30,

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
    iconBox: {
        width: 50,
        height: 50,
        borderRadius: 8,
        backgroundColor: colors.container,
        alignItems: "center",
        justifyContent: "center"
    },
    menu: {
        width: "100%",
        alignItems: "center",
        backgroundColor: "transparent",
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

export default ComplexMessage;