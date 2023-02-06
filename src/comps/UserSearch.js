import React, { useState, useRef, useCallback } from 'react';
import { StyleSheet, Modal, View, TouchableOpacity, FlatList, Dimensions, ActivityIndicator, Image } from 'react-native';
import { API, graphqlOperation, Storage } from 'aws-amplify';

import * as logger from '../functions/logger';
import { colors, css, strings } from '../config';
import BeamTitle from './BeamTitle';
import IconButton from './IconButton';
import SimpleInput from './SimpleInput';
import SubTitle from './SubTitle';
import { listUsersByUsername } from '../api/calls';
import SimpleButton from './SimpleButton';
import { CommonActions } from '@react-navigation/native';



export default function UserSearch({ visible, onClose, navigation, currentUser }) {
    const [search, setSearch] = useState("");
    const [foundUsers, setFoundUsers] = useState([]);
    const [sentText, setSentText] = useState("");
    const timeout = useRef();
    const [loading, setLoading] = useState(false);

    const navigateDiscoverPage = () => {
        navigation.navigate("DiscoverNav");
        onClose();
    }

    const navigateProfile = (itemID) => {
        if (itemID != currentUser.id) {
            navigation.dispatch(CommonActions.navigate({
                name: "OProfilePage",
                key: itemID,
                params: {
                    opposingUser: { id: itemID }
                }
            }));
            onClose();
        }
    }

    const renderItem = useCallback(({item}) => {
        return (
            <View style={styles.user}>
                <Image
                    source={{ uri: item.profilePicture.full }}
                    defaultSource={{ uri: item.profilePicture.loadFull }}
                    style={styles.image}
                />
                <View style={styles.userRight}>
                    <TouchableOpacity onPress={()=>navigateProfile(item.id)} style={{flexDirection: "row", alignItems: "center", justifyContent: "space-between"} }>
                        <SubTitle style={styles.title} size={20}>{item.username}</SubTitle>
                        <SubTitle size={16} color={colors.pBeamBright} style={{ fontWeight: "500" }}>View</SubTitle>
                    </TouchableOpacity>
                    <SubTitle style={styles.subtitle} size={16} color={colors.text2}>{item.bio}</SubTitle>
                </View>
            </View>    
        )
    }, []); 
    const keyExtractor = useCallback(item => item.id, []);
    const ListEmptyComponent = useCallback(() => {
        if (!loading) return (
            <View style={styles.listEmptyComponent}>
                <IconButton disabled={true} color={colors.text1} icon="sad" brand="Ionicons" size={60} />
                <BeamTitle>No Users Found</BeamTitle>
                {search.length >= 4 && <>
                    <SubTitle size={16}>We couldn't find any users named</SubTitle>
                    <SubTitle size={16}>"{sentText}". Can't find any users?</SubTitle>
                </>}
                {search.length < 4 && <>
                    <SubTitle size={16}>All {strings.APPNAME} usernames are at least four</SubTitle>
                    <SubTitle size={16}>characters long. Can't find any users?</SubTitle>
                </>}
                <View style={styles.suggestion}>
                    <SubTitle size={16}>Find users on the </SubTitle>
                    <TouchableOpacity onPress={navigateDiscoverPage}>
                        <SubTitle size={16} color={colors.pBeamBright} style={{ fontWeight: "500" }}>Discover Page</SubTitle>
                    </TouchableOpacity>
                </View>
            </View>
        )
        else {
            return (
                <View style={styles.listEmptyComponent}>
                    <ActivityIndicator size="large" color={colors.text1} style={{marginTop: 20}} />
                </View>
            );
        }
    }, [search, sentText, loading, foundUsers]);
    return (
        <Modal visible={visible} animationType="slide">
            <View style={styles.page}>
                <View style={styles.header}>
                    <IconButton color={colors.container} icon="ios-close-circle" brand="Ionicons" size={32} />
                    <SubTitle color={colors.pBeamBright} style={styles.title} size={18}>Search For Users</SubTitle>
                    <IconButton color={colors.text1} icon="ios-close-circle" brand="Ionicons" size={32} onPress={onClose} />
                </View>
                <SimpleInput
                    placeholder="Type a username"
                    autocorrect={false}
                    autoComplete="off"
                    icon="magnify"
                    autoCapitalize="none"
                    value={search}
                    maxLength={18}
                    onChangeText={(text) => {
                        if (
                            /^[a-zA-Z]+$/.test(text[text.length - 1]) || text.length == 0 ||
                            /^[0-9]+$/.test(text[text.length - 1]) || text[text.length - 1] == '_' ||
                            text[text.length - 1] == '.' || text[text.length - 1] == ' '
                        ) {
                            setSearch(text);
                            try { clearTimeout(timeout.current) } catch { }
                            if (text.length >= 4) {
                                if (text.length == 4) setSentText(text);
                                timeout.current = setTimeout(async () => {
                                    setFoundUsers([]);
                                    setLoading(true);
                                    try {
                                        setSentText(text);
                                        const result = await API.graphql(graphqlOperation(listUsersByUsername, {
                                            username: text
                                        }));
                                        if (result.data.listUsersByUsername.items.length > 0) {
                                            var data = result.data.listUsersByUsername.items;
                                            data[0].profilePicture.loadFull = await Storage.get(data[0].profilePicture.loadFull);
                                            data[0].profilePicture.full = await Storage.get(data[0].profilePicture.full);
                                            setFoundUsers(data);
                                        }
                                        setLoading(false);
                                    } catch (error) {
                                        logger.warn(error);
                                    }
                                }, 400);
                            } else setFoundUsers([]);
                        };
                    } }
                />
                <FlatList
                    data={foundUsers}
                    style={styles.list}
                    keyboardDismissMode="on-drag"
                    keyboardShouldPersistTaps="true"
                    renderItem={renderItem}
                    keyExtractor={keyExtractor}
                    ListEmptyComponent={ListEmptyComponent}
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

    },
    desc: {
        marginTop: 6,
        alignItems: "center",
        justifyContent: "center"
    },
    subtitle: {
        fontWeight: "400"
    },
    list: {
        flex: 1,
        marginTop: 10
    },
    listEmptyComponent: {
        flex: 1,
        padding: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    suggestion: {
        flexDirection: "row"
    },
    user: {
        height: 140,
        backgroundColor: colors.container,
        flex: 1,
        margin: 10,
        borderRadius: 40,
        flexDirection: "row",
        padding: 10
    },
    userRight: {
        flex: 1,
        padding: 10
    },
    image: {
        width: 120,
        height: 120,
        borderRadius: 60,
        ...css.beamShadow,
        borderColor: colors.pBeam,
        borderWidth: 2,
        overflow: 'hidden',
        alignItems: "flex-end",
    },
    button: {
        padding: 8,
        backgroundColor: colors.container,
        borderRadius: 30,
    }

})