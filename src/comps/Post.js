import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';

import { colors, css } from '../config';
import Beam from './Beam';
import ImageLoader from './ImageLoader';
import SimpleMessage from './SimpleMessage';
import SubTitle from './SubTitle';

export default function Post({ user, profilePicture, post, edit, onDelete }) {
    return (
        <View style={styles.container}>
            <ImageLoader
                resizeMode="cover"
                isBackground={true}
                source={post.image.uri.full}
                defaultSource={post.image.uri.loadFull}
                cacheKey={post.image.uri.fullKey}
                style={styles.image}
            >
                <View style={styles.beam} >
                    <Beam/>
                    <View style={styles.header}>
                        {post.distance &&
                            <SimpleMessage
                                username={user.username}
                                ppic={profilePicture}
                                message={user.username}
                                ppInnerStyle={styles.ppInnerStyle}
                                ppOuterStyle={styles.ppOuterStyle}
                                bottomLine={"Posted " + post.distance + " away from you"}
                                style={styles.username}
                            />                        
                        }
                        {!post.distance &&
                            <SimpleMessage
                                username={user.username}
                                ppic={profilePicture}
                                message={user.username}
                                ppInnerStyle={styles.ppInnerStyle}
                                ppOuterStyle={styles.ppOuterStyle}
                                style={styles.username}
                            />  
                        }
                        <View style={styles.time}>
                            {edit &&
                                <TouchableOpacity onPress={onDelete}>
                                    <SubTitle style={styles.delete} size={18} color={colors.error}>Delete</SubTitle>
                                </TouchableOpacity>
                            }
                            <SubTitle color={colors.text4}>{post.time}</SubTitle>
                        </View>
                    </View>
                </View>
            </ImageLoader>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        height: 460,
        marginTop: 64
    },
    header: {
        height: 64,
        backgroundColor: colors.background,
        shadowRadius: 8,
        shadowOpacity: 1,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        alignItems: "center",
        flexDirection: "row",
        paddingHorizontal: 6,
        justifyContent: "space-between",
        shadowColor: "black"
    },
    beam: {
        marginTop: -64
    },
    image: {
        flex: 1
    },
    username: {
        fontWeight: "500"
    },
    ppOuterStyle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
    },
    ppInnerStyle: {
        borderRadius: 20,
    },
    time: {
        paddingRight: 4,
    },
    delete: {
        fontWeight: "600",
    }
})