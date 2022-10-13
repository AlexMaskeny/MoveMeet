import React from 'react';
import { Text, View, StyleSheet, Image } from 'react-native';

import { colors, css } from '../config';
import ProfileCircle from './ProfileCircle';
import SubTitle from './SubTitle';

function PCircleAndTitle({
    username,
    ...props
}) {
    return (
        <View style={styles.container}>
            <ProfileCircle {...props} />
            <SubTitle numberOfLines={1}>{username}</SubTitle>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: 50,
        justifyContent: "center",
        alignItems: "center",
    },

});

export default PCircleAndTitle;