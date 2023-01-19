import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Keyboard, StyleSheet, TouchableOpacity, View, Image, FlatList, RefreshControl, Alert} from 'react-native';
import { API, Auth, graphqlOperation, Storage } from 'aws-amplify';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';

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
import { CUR } from 'aws-sdk';



export default function UProfilePage({ navigation }) {
    const currentUser = useRef();
    const bioEditRef = useRef();

    const [posts, setPosts] = useState([]);
    const [username, setUsername] = useState("");
    const [bio, setBio] = useState("");
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [profilePicture, setProfilePicture] = useState({});
    const [ready, setReady] = useState(false);
    const [refresh, setRefresh] = useState(false);
    const [editing, setEditing] = useState(false);
    const [bioEdit, setBioEdit] = useState(false);
    const [rerender, setRerender] = useState(false);
    const [changedImage, setChangedImage] = useState(false);
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
                            icon="settings"
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
    }, [navigation, editing, name, bio, profilePicture, postsToDelete])

    //DATA FETCHING
    useEffect(() => {
        const initialFunction = async () => {
            try {
                logger.eLog("[UProfilePage] Fetching User Data...");
                const cognitoUser = await Auth.currentUserInfo();
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
        if (changedImage || postsToDelete.length > 0 || bio != currentUser.current.bio) {
            Alert.alert("Are you sure?", "Select confirm to change your profile.", [
                { text: "Cancel" },
                {
                    text: "Confirm", onPress: async () => {
                        try {
                            if (changedImage) {
                                const response = await fetch(profilePicture.uri);
                                const img = await response.blob();
                                if (img) {
                                    const result1 = await Storage.remove(currentUser.current.profilePicture.loadFull);
                                    const result2 = await Storage.remove(currentUser.current.profilePicture.full);
                                    const result3 = await Storage.put(currentUser.current.profilePicture.full, img);
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
                    uri: uri,
                    loadImage: uri,
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
    const changeBio = async () => {
        await setBioEdit(true);
        bioEditRef.current.focus();
    }
    const removePost = (postID) => {
        Alert.alert("Deleted Post", "This post will now delete when you click done. Click cancel to not delete it.");
        setPostsToDelete(existingItems => {
            return [...existingItems, postID];
        })
    }

    const keyExtractor = useCallback((item) => item.id, []);
    const renderItem = useCallback(({ item }) => (
        <Post
            user={currentUser.current}
            profilePicture={profilePicture}
            post={item}
            edit={editing}
            onDelete={()=>removePost(item.id)}
        />
    ), [editing, posts, profilePicture]);

    const ListHeaderComponent = useCallback(()=>(<>
        <Image
            style={{ height: 100, width: "100%" }}
            resizeMode="cover"
            source={profilePicture}
        />
        <LinearGradient
            // Background Linear Gradient
            colors={['rgba(18, 18, 18,0.4)', colors.background]}
            style={{ height: 120, width: "100%", marginTop: -120}}
        />
        <View style={styles.beamCircle}>
            <Beam style={styles.beam} />
            {editing &&
                <TouchableOpacity onPress={changePpic} style={{justifyContent: "center"}}>
                    <ProfileCircle ppic={profilePicture} style={styles.ppicEditing} innerStyle={styles.innerPpicEditing} />
                    <View style={styles.changePpic}>
                        <IconButton icon="square-edit-outline" brand="MaterialCommunityIcons" size={40} color={colors.text1} onPress={changePpic} />
                    </View>
                </TouchableOpacity>                    
            }
            {!editing &&
                <View style={{ justifyContent: "center" }}>
                    <ProfileCircle ppic={profilePicture} style={styles.ppic} innerStyle={styles.innerPpic} />
                </View>         
            }
            <Beam style={styles.beam} />
        </View>
        <View style={styles.upperBody}>
            <View>
                <SubTitle style={styles.title2} size={18} color={colors.text1}>@{username}</SubTitle>
                <SubTitle size={14} color={colors.text4}>0 feet away</SubTitle>
            </View>
            <View>
                <SubTitle style={styles.title2} size={18} color={colors.text1}>Message</SubTitle>
            </View>
        </View>
        <View style={styles.midBody}>
            <SimpleInput
                autoCorrect={true}
                reference={bioEditRef}
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
    </>), [rerender, editing, ready, bioEdit, profilePicture]);

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
            <Settings visible={showSettings} onClose={() => setShowSettings(false)} navigation={navigation}/>
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
        justifyContent: "space-between"
    },
    midBody: {
        padding: 10,
        margin: 10,
        marginTop: 40,
        minHeight: 70,
        alignItems: "center",
        backgroundColor: colors.container,
        borderRadius: 20,
        ...css.beamShadow,
        shadowColor: "rgba(0,0,0,0.5)",
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
})
