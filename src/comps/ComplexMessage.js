import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LongPressGestureHandler, State } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { CommonActions } from '@react-navigation/native';

import { colors } from '../config';
import ProfileCircle from './ProfileCircle';
import SubTitle from './SubTitle';

function ComplexMessage({ navigation, opposingUserId, userId, children, ppic, username, message, style, time, ...props }) {
    const onPress = async (event) => {
        if (event.nativeEvent.state === State.ACTIVE) {
            if (opposingUserId != userId) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                navigation.dispatch(CommonActions.navigate({
                    name: "OProfilePage",
                    key: opposingUserId,
                    params: {
                        opposingUser: { id: opposingUserId }
                    }
                }))
            }
        }
    }
    return (
        <View style={styles.container}>
            <ProfileCircle ppic={ppic} style={styles.pCircle} />
            <View style={{ width: 6 }} />
            <View style={{ flex: 1, marginRight: 10}}>
                <View style={{ flexDirection: 'row', flex: 1, justifyContent: "space-between" }}>
                    <LongPressGestureHandler onHandlerStateChange={(event) => onPress(event)} minDurationMs={400}>
                        <View>
                            <SubTitle size={16} color={colors.text4}>{username}</SubTitle>
                        </View>
                    </LongPressGestureHandler>
                    <SubTitle size={14} color={colors.text4}>{time}</SubTitle>
                </View>
                <Text
                    style={[styles.tStyle, style]}
                    numberOfLines={0}
                    selectable={true}
                    {...props}
                >{message}</Text>
            </View>
        </View>
    );
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
    }
})

export default ComplexMessage;