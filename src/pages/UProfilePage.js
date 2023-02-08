import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Keyboard, StyleSheet, TouchableOpacity, View, Image, FlatList, RefreshControl, Alert } from 'react-native';
import { API, Auth, graphqlOperation, Storage } from 'aws-amplify';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

import Screen from '../comps/Screen';
import Loading from '../comps/Loading';
import { colors, css } from '../config';
import * as logger from '../functions/logger';
import * as timeLogic from '../functions/timeLogic';
import * as distance from '../functions/distance';
import * as locConversion from '../functions/locConversion';
import * as media from '../functions/media';
import { deletePost, getDetailedUserByCognito, updateUser } from '../api/calls';
import Beam from '../comps/Beam';
import ProfileCircle from '../comps/ProfileCircle';
import IconButton from '../comps/IconButton';
import SubTitle from '../comps/SubTitle';
import Post from '../comps/Post';
import SimpleInput from '../comps/SimpleInput';
import CreatePost from '../comps/CreatePost';
import Settings from '../comps/Settings';
import BackgroundEditor from '../comps/BackgroundEditor';




export default function UProfilePage({ navigation }) {
    const currentUser = useRef();
    const bioEditRef = useRef();

    const [posts, setPosts] = useState([]);
    const [username, setUsername] = useState("");
    const [showBack, setShowBack] = useState(false);
    const [bio, setBio] = useState("");
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [profilePicture, setProfilePicture] = useState({});
    const [background, setBackground] = useState({});
    const [ready, setReady] = useState(false);
    const [refresh, setRefresh] = useState(false);
    const [editing, setEditing] = useState(false);
    const [bioEdit, setBioEdit] = useState(false);
    const [rerender, setRerender] = useState(false);
    const [changedImage, setChangedImage] = useState(false);
    const [changedBackground, setChangedBackground] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [postsToDelete, setPostsToDelete] = useState([]);

    //SIMPLY TO MAKE THE HEADERBUTTON WORK
    useEffect(() => {
        if (!editing) {
            navigation.setOptions({
                title: name,
                headerRight: () => (
                    <View style={{ alignItems: "center", justifyContent: "center", marginRight: 10, flex: 1 }}>
                        <IconButton
                            icon="add-circle"
                            brand="Ionicons"
                            color={colors.text1}
                            size={32}
                            onPress={() => setShowCreate(true)}
                        />
                    </View>
                ),
                headerLeft: () => (
                    <View style={{ alignItems: "center", justifyContent: "center", marginLeft: 10, flexDirection: "row", flex: 1 }}>
                        <IconButton
                            icon="square-edit-outline"
                            brand="MaterialCommunityIcons"
                            color={colors.text1}
                            size={32}
                            onPress={() => setEditing(true)}
                        />
                        <View style={{ width: 6 }} />
                        <IconButton
                            icon="settings-sharp"
                            brand="Ionicons"
                            color={colors.text1}
                            size={30}
                            onPress={() => setShowSettings(true)}
                        />
                    </View>
                ),
            })
        } else {
            navigation.setOptions({
                title: name,
                headerRight: () => (
                    <TouchableOpacity>
                        <SubTitle style={{ marginRight: 10, fontWeight: "600" }} size={16} onPress={saveEdit}>Done</SubTitle>
                    </TouchableOpacity>
                ),
                headerLeft: () => (
                    <TouchableOpacity>
                        <SubTitle style={{ marginLeft: 10, fontWeight: "600" }} size={16} onPress={cancelEdit}>Cancel</SubTitle>
                    </TouchableOpacity>
                ),
            })
        }
    }, [navigation, editing, name, bio, profilePicture, postsToDelete, background])

    //DATA FETCHING
    useEffect(() => {
        const initialFunction = async () => {
            try {
                logger.eLog("[UProfilePage] Fetching User Data...");
                const cognitoUser = await Auth.currentAuthenticatedUser();
                if (cognitoUser) {
                    setUsername(cognitoUser.username);
                    setEmail(cognitoUser.attributes.email);
                    const user = await API.graphql(graphqlOperation(getDetailedUserByCognito, {
                        id: cognitoUser.attributes.sub
                    }));
                    currentUser.current = user.data.getUserByCognito;
                    setName(currentUser.current.name);
                    setBio(currentUser.current.bio);
                    const loadFull = await Storage.get(currentUser.current.profilePicture.loadFull);
                    const full = await Storage.get(currentUser.current.profilePicture.full);
                    if (currentUser.current.background.enableColor) setBackground({ isColor: true, color: currentUser.current.background.color });
                    else {
                        const backLoadFull = await Storage.get(currentUser.current.background.loadFull);
                        const backFull = await Storage.get(currentUser.current.background.full);
                        setBackground({ uri: backFull, loadImage: backLoadFull, color: "", isColor: false });
                    }
                    const locPerms = await Location.getForegroundPermissionsAsync();
                    var location;
                    if (locPerms.granted) {
                        const locResponse = await Location.getLastKnownPositionAsync();
                        location = locConversion.toUser(locResponse.coords.latitude, locResponse.coords.longitude);
                    };
                    for (var i = 0; i < currentUser.current.posts.items.length; i++) {
                        currentUser.current.posts.items[i].image.loadFull = await Storage.get(currentUser.current.posts.items[i].image.loadFull);
                        currentUser.current.posts.items[i].image.full = await Storage.get(currentUser.current.posts.items[i].image.full);
                        currentUser.current.posts.items[i].time = timeLogic.ago((Date.now() - Date.parse(currentUser.current.posts.items[i].createdAt)) / 1000);
                        if (locPerms.granted) {
                            currentUser.current.posts.items[i].distance = distance.formula(
                                location.lat,
                                location.long,
                                currentUser.current.posts.items[i].lat,
                                currentUser.current.posts.items[i].long,
                            );
                            currentUser.current.posts.items[i].distance
                        }
                    }

                    setPosts(currentUser.current.posts.items.sort((a, b) => {
                        if (Date.parse(a.createdAt) > Date.parse(b.createdAt)) {
                            return -1;
                        } else return 1;
                    }));
                    setProfilePicture({ uri: full, loadImage: loadFull });
                }
            } catch (error) {
                logger.warn(error);
            } finally {
                setReady(true);
                setRefresh(false);
            }
        }
        initialFunction();
    }, [rerender]);

    const closeCreate = () => {
        setShowCreate(false);
        setRefresh(true);
        setRerender(!rerender);
    }

    const saveEdit = () => {
        if (changedImage || postsToDelete.length > 0 || bio != currentUser.current.bio || changedBackground) {
            Alert.alert("Are you sure?", "Select confirm to change your profile.", [
                { text: "Cancel" },
                {
                    text: "Confirm", onPress: async () => {
                        try {
                            if (changedImage) {
                                const response1 = await fetch(profilePicture.uri);
                                const response2 = await fetch(profilePicture.loadImage);
                                const img1 = await response1.blob();
                                const img2 = await response2.blob();
                                if (img1 && img2) {
                                    //console.log(currentUser.current.profilePicture.full);
                                    if (currentUser.current.profilePicture.full != " ") {
                                        await Storage.remove(currentUser.current.profilePicture.loadFull);
                                        await Storage.remove(currentUser.current.profilePicture.full);
                                        await Storage.put(currentUser.current.profilePicture.full, img1);
                                        await Storage.put(currentUser.current.profilePicture.loadFull, img2);
                                    } else {
                                        await API.graphql(graphqlOperation(updateUser, {
                                            input: {
                                                id: currentUser.current.id,
                                                profilePicture: {
                                                    full: "FULLprofilePicture" + currentUser.current.id + ".jpg",
                                                    loadFull: "LOADFULLprofilePicture" + currentUser.current.id + ".jpg",
                                                    region: "us-east-2",
                                                    bucket: "proxychatf2d762e9bc784204880374b0ca905be4120629-dev"
                                                }
                                            }
                                        }));
                                        await Storage.put("FULLprofilePicture" + currentUser.current.id + ".jpg", img1);
                                        await Storage.put("LOADFULLprofilePicture" + currentUser.current.id + ".jpg", img2);
                                    }
                                }
                            }
                            if (changedBackground) {
                                if (background.isColor) {
                                    await API.graphql(graphqlOperation(updateUser, {
                                        input: {
                                            id: currentUser.current.id,
                                            background: {
                                                full: "FULLbackground" + currentUser.current.id + ".jpg",
                                                loadFull: "LOADFULLbackground" + currentUser.current.id + ".jpg",
                                                region: "us-east-2",
                                                bucket: "proxychatf2d762e9bc784204880374b0ca905be4120629-dev",
                                                enableColor: true,
                                                color: background.color
                                            }
                                        }
                                    }))
                                } else {
                                    const response1 = await fetch(background.uri);
                                    const response2 = await fetch(background.loadImage);
                                    const img1 = await response1.blob();
                                    const img2 = await response2.blob();
                                    if (img1 && img2) {
                                        await Storage.remove(currentUser.current.background.loadFull);
                                        await Storage.remove(currentUser.current.background.full);
                                        await Storage.put(currentUser.current.background.full, img1);
                                        await Storage.put(currentUser.current.background.loadFull, img2);
                                        await API.graphql(graphqlOperation(updateUser, {
                                            input: {
                                                id: currentUser.current.id,
                                                background: {
                                                    full: "FULLbackground" + currentUser.current.id + ".jpg",
                                                    loadFull: "LOADFULLbackground" + currentUser.current.id + ".jpg",
                                                    region: "us-east-2",
                                                    bucket: "proxychatf2d762e9bc784204880374b0ca905be4120629-dev",
                                                    enableColor: false
                                                }
                                            }
                                        }));


                                    }
                                }
                            }
                            if (bio != currentUser.current.bio) {
                                await API.graphql(graphqlOperation(updateUser, {
                                    input: {
                                        id: currentUser.current.id,
                                        bio: bio,
                                    }
                                }));
                            }
                            if (postsToDelete.length > 0) {
                                for (var i = 0; i < postsToDelete.length; i++) {
                                    await API.graphql(graphqlOperation(deletePost, {
                                        input: {
                                            id: postsToDelete[i]
                                        }
                                    }));
                                    setPosts(existingItems => {
                                        const result = existingItems.filter(el => el.id != postsToDelete[i])
                                        return [...result];
                                    });
                                }
                            }
                            setPostsToDelete([]);
                            setChangedImage(false);
                            setEditing(false);
                        } catch (error) {
                            logger.warn(error);
                            Alert.alert("Error", "Something when wrong when updating your profile", [{ text: "Try Again" }]);
                        }
                    }
                },
            ])
        } else setEditing(false);

    }
    const cancelEdit = () => {
        setEditing(false);
        setRerender(!rerender);
    }
    const changePpic = () => {
        try {
            const onSuccess = (uri) => {
                setChangedImage(true);
                setProfilePicture({
                    uri: uri.full,
                    loadImage: uri.loadFull,
                });
            }
            Alert.alert("Take a photo or select one", "Pick one of the options below to change your profile picture.", [
                { text: "Take Picture", onPress: () => media.openCamera(onSuccess) },
                { text: "Open Photos", onPress: () => media.openPhotos(onSuccess) }
            ]);
        } catch (error) {
            logger.warn(error);
            Alert.alert("Error", "Something when wrong when changing your profile picture", [{ text: "Try Again" }]);
        }
    }
    const changeBackground = () => {
        try {
            Alert.alert("Use a photo or use a color", "Pick one of the options below to change your background", [
                {
                    text: "Open Photos", onPress: () => {
                        media.openPhotos((uri) => {
                            setChangedBackground(true);
                            setBackground({
                                uri: uri.full,
                                loadImage: uri.loadFull,
                                isColor: false
                            })
                        });
                    }
                },
                {
                    text: "Select Color", onPress: () => {
                        setShowBack(true);
                    }
                }
            ]);
        } catch (error) {
            logger.warn(error);
            Alert.alert("Error", "Something when wrong when changing your profile picture", [{ text: "Try Again" }]);
        }
    }
    const successBack = (color) => {
        setChangedBackground(true);
        setBackground({ color: color, isColor: true });
    }
    const changeBio = async () => {
        await setBioEdit(true);
        bioEditRef.current.focus();
    }
    const removePost = (postID) => {
        Alert.alert("Deleted Post", "This post will now delete when you click done. Click cancel to not delete it.");
        setPostsToDelete(existingItems => {
            return [...existingItems, postID];
        })
        setPosts(existingItems => {
            return existingItems.filter(el => el.id != postID);
        })
    }

    const keyExtractor = useCallback((item) => item.id, []);
    const renderItem = useCallback(({ item }) => (
        <Post
            user={currentUser.current}
            profilePicture={profilePicture}
            post={item}
            edit={editing}
            onDelete={() => removePost(item.id)}
        />
    ), [editing, posts, profilePicture]);

    const ListEmptyComponent = useCallback(() => (<>
        <View style={styles.empty}>
            <Beam />
            <View style={{ height: 20 }} />
            <View style={{ alignItems: "center", height: "100%", justifyContent: "center", }}>
                <SubTitle style={styles.title2} size={16}>This user has no posts.</SubTitle>
            </View>
        </View>
    </>), []);

    const ListHeaderComponent = useCallback(() => (<>
        <Beam style={{ marginTop: -6 }} />
        {!background.isColor &&
            <Image
                style={{ height: 100, width: "100%" }}
                resizeMode="cover"
                source={background}
            />
        }
        {background.isColor &&
            <View style={{ height: 100, width: "100%", backgroundColor: background.color }} />
        }
        {editing &&
            <View style={{ position: 'absolute', alignSelf: "flex-end", padding: 4, zIndex: 4 }}>
                <IconButton icon="square-edit-outline" brand="MaterialCommunityIcons" size={40} color={colors.text1} onPress={changeBackground} />
            </View>
        }
        {!background.isColor &&
            <LinearGradient
                // Background Linear Gradient
                colors={['rgba(18, 18, 18,0.4)', colors.background]}
                style={{ height: 120, width: "100%", marginTop: -120 }}
            />
        }
        <View style={styles.beamCircle}>
            <Beam style={styles.beam} />
            {editing &&
                <TouchableOpacity onPress={changePpic} style={{ justifyContent: "center" }}>
                    <ProfileCircle ppic={{ uri: profilePicture.uri }} style={styles.ppicEditing} innerStyle={styles.innerPpicEditing} />
                    <View style={styles.changePpic}>
                        <IconButton icon="square-edit-outline" brand="MaterialCommunityIcons" size={40} color={colors.text1} onPress={changePpic} />
                    </View>
                </TouchableOpacity>
            }
            {!editing &&
                <View style={{ justifyContent: "center" }}>
                    <ProfileCircle ppic={{ uri: profilePicture.uri }} style={styles.ppic} innerStyle={styles.innerPpic} />
                </View>
            }
            <Beam style={styles.beam} />
        </View>
        <View style={styles.body}>
            <View style={styles.upperBody}>
                <View>
                    <SubTitle style={styles.title2} size={18} color={colors.background} selectable={true}>@{username}</SubTitle>

                </View>
            </View>
            <View style={styles.midBody}>
                <SimpleInput
                    autoCorrect={true}
                    reference={bioEditRef}
                    cStyle={{ backgroundColor: colors.background }}
                    editable={editing}
                    multiline={true}
                    maxLength={160}
                    style={styles.textInput}
                    defaultValue={bio}
                    onChangeText={setBio}
                />
                {editing && <>
                    <View style={{ height: 10 }} />
                    {!bioEdit &&
                        <IconButton icon="square-edit-outline" brand="MaterialCommunityIcons" size={30} color={colors.pBeamBright} onPress={changeBio} />
                    }
                    {bioEdit &&
                        <TouchableOpacity onPress={() => { Keyboard.dismiss(); setBioEdit(false) }}>
                            <SubTitle style={styles.title2} size={18} color={colors.pBeamBright}>Done</SubTitle>
                        </TouchableOpacity>
                    }
                </>}
            </View>
            <View style={{ height: 20 }} />
        </View>
    </>), [rerender, editing, ready, bioEdit, profilePicture, background]);

    return (
        <Screen innerStyle={styles.page}>
            {ready &&
                <FlatList
                    data={posts}
                    style={styles.posts}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="always"
                    keyboardDismissMode="on-drag"
                    keyExtractor={keyExtractor}
                    maxToRenderPerBatch={4}
                    windowSize={4}
                    ListEmptyComponent={ListEmptyComponent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refresh}
                            onRefresh={() => {
                                setRefresh(true);
                                setRerender(!rerender);
                            }}
                            tintColor={colors.pBeam}
                        />
                    }
                    ListHeaderComponent={ListHeaderComponent}
                    renderItem={renderItem}
                />
            }
            <Loading enabled={!ready} />
            <CreatePost visible={showCreate} onClose={closeCreate} currentUser={currentUser.current} />
            <BackgroundEditor visible={showBack} onClose={() => setShowBack(false)} onSuccess={successBack} />
            <Settings visible={showSettings} onClose={() => setShowSettings(false)} navigation={navigation} />
        </Screen>
    );
}

const styles = StyleSheet.create({
    page: {

    },
    beamCircle: {
        flexDirection: 'row',
        alignItems: "center",
        marginTop: -50,
        zIndex: 5,
    },
    beam: {
        flex: 1,
    },
    ppicEditing: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "black",
    },
    innerPpicEditing: {
        borderRadius: 50,
        opacity: 0.4
    },
    ppic: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    innerPpic: {
        borderRadius: 50,
    },
    changePpic: {
        position: "absolute",
        alignSelf: "center",
    },
    upperBody: {
        marginTop: -50,
        padding: 10,
        flexDirection: "row",
        justifyContent: "space-between",
        backgroundColor: colors.background

    },
    midBody: {
        padding: 10,
        paddingTop: 20,
        margin: 0,
        minHeight: 70,
        alignItems: "center",
        justifyContent: "flex-end",
        backgroundColor: colors.background
    },
    title: {
        fontWeight: "400"
    },
    title2: {
        fontWeight: "500"
    },
    textInput: {
        color: colors.text1,
        fontSize: 18,
        maxHeight: 140,
    },
    posts: {
        flex: 1,
    },
    empty: {
        height: "100%"
    },
    body: {
        backgroundColor: colors.background
    }
})