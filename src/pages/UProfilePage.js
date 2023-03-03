//region 3rd Party Imports
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Keyboard, StyleSheet, TouchableOpacity, View, FlatList, RefreshControl, Alert } from 'react-native';
import { Auth, Storage } from 'aws-amplify';
import { LinearGradient } from 'expo-linear-gradient';
import uuid from "react-native-uuid";
import * as Location from 'expo-location';
//endregion
//region 1st Party Imports
import Beam from '../comps/Beam';
import Screen from '../comps/Screen';
import Loading from '../comps/Loading';
import ProfileCircle from '../comps/ProfileCircle';
import IconButton from '../comps/IconButton';
import SubTitle from '../comps/SubTitle';
import Post from '../comps/Post';
import SimpleInput from '../comps/SimpleInput';
import CreatePost from '../comps/CreatePost';
import Settings from '../comps/Settings';
import BackgroundEditor from '../comps/BackgroundEditor';
import ImageLoader from '../comps/ImageLoader';
import { calls, instances, mmAPI } from '../api/mmAPI';
import { colors } from '../config';
import * as logger from '../functions/logger';
import * as timeLogic from '../functions/timeLogic';
import * as distance from '../functions/distance';
import * as locConversion from '../functions/locConversion';
import * as media from '../functions/media';
//endregion

export default function UProfilePage({ navigation }) {
    //region useRef variables
    const currentUser = useRef(); //The current dynamodb user
    const bioEditRef = useRef();  //the "ref={bioEditRef}" prop of the bio editing text input
    //endregion
    //region useState variables
    const [posts, setPosts] = useState([]);                            //The list of posts the user has
    const [postsToDelete, setPostsToDelete] = useState([]);            //The list of posts objects the user selected to delete
    const [username, setUsername] = useState("");                      //The currentUser's username
    const [bio, setBio] = useState("");                                //The currentUser's bio (could be edited and thus different than database)
    const [name, setName] = useState("");                              //The currentUser's name
    const [changedProfilePic, setChangedProfilePic] = useState(false); //Did the user edit their profile picture?
    const [profilePicture, setProfilePicture] = useState({});          //The current user's profile picture
    const [changedBackground, setChangedBackground] = useState(false); //Did the user edit their background?
    const [background, setBackground] = useState({});                  //The current user's background
    const [showSettings, setShowSettings] = useState(false);           //Should we show the settings modal?
    const [showCreate, setShowCreate] = useState(false);               //Should we show the createPost modal?
    const [showBack, setShowBack] = useState(false);                   //Should we show the background color selector?
    const [editing, setEditing] = useState(false);                     //Is the page in edit mode?
    const [bioEdit, setBioEdit] = useState(false);                     //Is the bio currently being edited?
    const [rerender, setRerender] = useState(false);                   //Refreshes the page. Always used with setRerender(!rerender)
    const [ready, setReady] = useState(false);                         //Have we attempted to get the currentUser's data at least once?
    const [refresh, setRefresh] = useState(false);                     //Should we show the activity indicator (triggered only on second useEffect)
    //endregion

    /* =============[ HOOKS ]============ */
    //region [HOOK] "useEffect, [navigation, editing, name, bio, profilePicture, postsToDelete, background]" = Renders the header. Changes based on editing mode or not.
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
    //endregion
    //region [HOOK] "useEffect, [rerender]" = Gets all of currentUser's data and displays it
    useEffect(() => {
        //This structure must be present if calling async functions in useEffect hook
        (async function () {
            try {
                logger.eLog("[UProfilePage] Fetching User Data...");
                //region Get the current dynamodb user
                const cognitoUser = await Auth.currentAuthenticatedUser();
                setUsername(cognitoUser.username);
                currentUser.current = await mmAPI.query({
                    call: calls.GET_USER_BY_COGNITO,
                    instance: instances.FULL,
                    input: {
                        id: cognitoUser.attributes.sub
                    }
                });
                setName(currentUser.current.name);
                setBio(currentUser.current.bio);
                //endregion

                //PROFILE PICTURE
                //region Download the current user's profile picture.
                const loadFull = await Storage.get(currentUser.current.profilePicture.loadFull);
                const full = await Storage.get(currentUser.current.profilePicture.full);
                setProfilePicture({
                    full: full,
                    loadFull: loadFull,
                    cacheKey: currentUser.current.profilePicture.loadFull
                });
                //endregion

                //BACKGROUND
                //region [IF] the current user's background is a color [THEN] set it
                if (currentUser.current.background.enableColor)
                    setBackground({
                        isColor: true,
                        color: currentUser.current.background.color
                    });
                //endregion
                //region [ELSE] the current user's background is an image [SO] download it and set it
                else {
                    const backLoadFull = await Storage.get(currentUser.current.background.loadFull);
                    const backFull = await Storage.get(currentUser.current.background.full);
                    setBackground({
                        full: backFull,
                        loadFull:
                        backLoadFull,
                        color: "",
                        isColor: false,
                        cacheKey: currentUser.current.background.full
                    });
                }
                //endregion

                //POSTS
                //region [IF] we have access to location [THEN] convert it to ft and use it to calculate distance from posts below. (It will display as "an unknown distance" if disabled and run successfully)
                const locPerms = await Location.getForegroundPermissionsAsync();
                let location;
                if (locPerms.granted) {
                    const locResponse = await Location.getLastKnownPositionAsync();
                    location = locConversion.toUser(locResponse.coords.latitude, locResponse.coords.longitude);
                }
                //endregion
                //region Iterate through each of the currentUser's posts, download post, calculate distance from currentUser to where post was created, and display post
                for (let i = 0; i < currentUser.current.posts.items.length; i++) {
                    //Download the post image
                    const loadFull = await Storage.get(currentUser.current.posts.items[i].image.loadFull);
                    const full = await Storage.get(currentUser.current.posts.items[i].image.full);
                    currentUser.current.posts.items[i].image.uri = {
                        loadFull: loadFull,
                        full: full,
                        cacheKey: currentUser.current.posts.items[i].image.full,
                    }

                    //calculate the time since the post was created
                    currentUser.current.posts.items[i].time = timeLogic.ago((Date.now() - Date.parse(currentUser.current.posts.items[i].createdAt)) / 1000);

                    //calculate the distance the user is from where the post was created
                    if (locPerms.granted) {
                        currentUser.current.posts.items[i].distance = distance.formula(
                            location.lat,
                            location.long,
                            currentUser.current.posts.items[i].lat,
                            currentUser.current.posts.items[i].long,
                        );
                        currentUser.current.posts.items[i].distance
                    } else currentUser.current.posts.items[i].distance = "an unknown distance"
                }
                //endregion
                //region Sort the posts (putting the most recent on top) and display them
                setPosts(currentUser.current.posts.items.sort((a, b) => {
                    if (Date.parse(a.createdAt) > Date.parse(b.createdAt)) {
                        return -1;
                    } else return 1;
                }));
                //endregion
            } catch (error) {
                logger.warn(error);
            } finally {
                setReady(true);
                setRefresh(false);
            }
        })();
    }, [rerender]);
    //endregion

    /* =============[ FUNCS ]============ */
    //region [FUNCTION]   "closeCreate = ()" = Closes the create post modal
    const closeCreate = () => {
        setShowCreate(false);
        setRefresh(true);
        setRerender(!rerender);
    }
    //endregion
    //region [FUNCTION]   "saveEdit = ()" = Prompts user if they want to save their edits to their profile. If yes an async func is called.
    const saveEdit = () => {
        //[IF] the user made a change, warn them. [ELSE] do nothing
        if (changedProfilePic || postsToDelete.length > 0 || bio !== currentUser.current.bio || changedBackground) {
            Alert.alert("Are you sure?", "Select confirm to change your profile.", [
                { text: "Cancel" },
                {
                    text: "Confirm", onPress: async () => {
                        try {

                            //region [IF] the user changed their profile picture [THEN] upload the new image and set it as their profile picture
                            if (changedProfilePic) {
                                //Create and ID for the new image
                                const newId = uuid.v4();

                                //Remove the previous profile picture (If there isn't one nothing bad occurs)
                                await Storage.remove(currentUser.current.profilePicture.full);
                                await Storage.remove(currentUser.current.profilePicture.loadFull);

                                //Upload the new profile picture
                                await mmAPI.store("FULLPROFILEPICTURE" + newId + ".jpg", profilePicture.full);
                                await mmAPI.store("LOADFULLPROFILEPICTURE" + newId + ".jpg", profilePicture.loadFull);

                                //region Make the user's profile picture the newly uploaded image
                                await mmAPI.mutate({
                                    call: calls.UPDATE_USER,
                                    input: {
                                        id: currentUser.current.id,
                                        profilePicture: {
                                            full: "FULLPROFILEPICTURE" + newId + ".jpg",
                                            loadFull: "LOADFULLPROFILEPICTURE" + newId + ".jpg",
                                            region: "us-east-2",
                                            bucket: "proxychatf2d762e9bc784204880374b0ca905be4120629-dev"
                                        }
                                    }
                                });
                                //endregion
                            }
                            //endregion

                            //region [IF] the user changed their background [THEN] change their background in database (upload image / change color)
                            if (changedBackground) {
                                //region [IF] the new background is a color [THEN] change the user's background to that color
                                if (background.isColor) {
                                    await mmAPI.mutate({
                                        call: calls.UPDATE_USER,
                                        input: {
                                            id: currentUser.current.id,
                                            background: {
                                                full: " ",
                                                loadFull: " ",
                                                region: "us-east-2",
                                                bucket: "proxychatf2d762e9bc784204880374b0ca905be4120629-dev",
                                                enableColor: true,
                                                color: background.color
                                            }
                                        }
                                    });
                                }
                                //endregion
                                //region [ELSE] the background is an image [SO] upload it and set the user's background to that image
                                else {
                                    //create an ID for the new image
                                    const newId = uuid.v4();

                                    //region Remove the old background picture
                                    if (!currentUser.current.background.enableColor) {
                                        await Storage.remove(currentUser.current.background.full);
                                        await Storage.remove(currentUser.current.background.loadFull);
                                    }
                                    //endregion

                                    //Upload the new background image
                                    await mmAPI.store("FULLBACKGROUND" + newId + ".jpg", background.full);
                                    await mmAPI.store("LOADFULLBACKGROUND" + newId + ".jpg", background.loadFull);

                                    //region Make the user's background the newly uploaded image
                                    await mmAPI.mutate({
                                        call: calls.UPDATE_USER,
                                        input: {
                                            id: currentUser.current.id,
                                            background: {
                                                full: "FULLBACKGROUND" + newId + ".jpg",
                                                loadFull: "LOADFULLBACKGROUND" + newId + ".jpg",
                                                region: "us-east-2",
                                                bucket: "proxychatf2d762e9bc784204880374b0ca905be4120629-dev",
                                                enableColor: false
                                            }
                                        }
                                    });
                                    //endregion
                                }
                                //endregion
                            }
                            //endregion

                            //region [IF] the user changed their bio [THEN] update their bio in the database
                            if (bio !== currentUser.current.bio) {
                                await mmAPI.mutate({
                                    call: calls.UPDATE_USER,
                                    input: {
                                        id: currentUser.current.id,
                                        bio: bio,
                                    }
                                });
                            }
                            //endregion

                            //region [IF] the user deleted at least one post [THEN] delete them in the database
                            if (postsToDelete.length > 0) {
                                for (let i = 0; i < postsToDelete.length; i++) {
                                    await mmAPI.mutate({
                                        call: calls.DELETE_POST,
                                        input: {
                                            id: postsToDelete[i]
                                        }
                                    });
                                }
                            }
                            //endregion

                            //region Reset the editing inputs to default
                            setPostsToDelete([]);
                            setChangedProfilePic(false);
                            setEditing(false);
                            //endregion

                        } catch (error) {
                            logger.warn(error);
                            Alert.alert("Error", "Something when wrong when updating your profile", [{ text: "Try Again" }]);
                        }
                    }
                },
            ])
        } else setEditing(false);
    }
    //endregion
    //region [FUNCTION]   "cancelEdit = ()" = Exits the editor and refreshes the page
    const cancelEdit = () => {
        setEditing(false);
        setRerender(!rerender);
    }
    //endregion
    //region [FUNCTION]   "changePpic = ()" = Opens the menu for the user to change their profile picture
    const changePpic = () => {
        try {
            const onSuccess = (uri) => {
                setChangedProfilePic(true);
                setProfilePicture({
                    full: uri.full,
                    loadFull: uri.loadFull,
                    disable: true,
                    fullKey: " ",
                    loadFullKey: " ",
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
    //endregion
    //region [FUNCTION]   "changeBackground = ()" = Opens the menu for the user to change their background
    const changeBackground = () => {
        try {
            Alert.alert("Use a photo or use a color", "Pick one of the options below to change your background", [
                {
                    text: "Open Photos", onPress: () => {
                        media.openPhotos((uri) => {
                            setChangedBackground(true);
                            setBackground({
                                full: uri.full,
                                loadFull: uri.loadFull,
                                disable: true,
                                fullKey: " ",
                                loadFullKey: " ",
                                isColor: false,
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
    //endregion
    //region [FUNCTION]   "successBack = (color)" = Called when the user changes their background to a color
    const successBack = (color) => {
        setChangedBackground(true);
        setBackground({
            color: color,
            isColor: true,
            disable: true
        });
    }
    //endregion
    //region [FUNCTION]   "removePost = (postID)" = *locally* removes the post with the provided ID
    const removePost = (postID) => {
        Alert.alert("Deleted Post", "This post will now delete when you click done. Click cancel to not delete it.");
        setPostsToDelete(existingItems => {
            return [...existingItems, postID];
        })
        setPosts(existingItems => {
            return existingItems.filter(el => el.id !== postID);
        })
    }
    //endregion
    //region [FUNC ASYNC] "changeBio = async ()" = Opens the bio editor
    const changeBio = async () => {
        await setBioEdit(true);
        bioEditRef.current.focus();
    }
    //endregion

    /* =============[ LIST ]============ */
    const keyExtractor = useCallback((item) => item.id, []);
    //region [CALL COMP] "RenderItem, [editing, posts, profilePicture]" = The component rendered for each user post
    const RenderItem = useCallback(({ item }) => (
        <Post
            user={currentUser.current}
            profilePicture={profilePicture}
            post={item}
            edit={editing}
            onDelete={() => removePost(item.id)}
        />
    ), [editing, posts, profilePicture]);
    //endregion
    //region [CALL COMP] "ListEmptyComponent, []" = [IF] there are no posts [THEN] display "This user has no posts"
    const ListEmptyComponent = useCallback(() => (<>
        <View style={styles.empty}>
            <Beam />
            <View style={{ height: 20 }} />
            <View style={{ alignItems: "center", height: "100%", justifyContent: "center", }}>
                <SubTitle style={styles.title2} size={16}>This user has no posts.</SubTitle>
            </View>
        </View>
    </>), []);
    //endregion
    //region [CALL COMP] "ListHeaderComponent, [rerender, editing, ready, bioEdit, profilePicture, background]" = Displays the header which includes the profile picture, bio, background, message button, username, etc.
    const ListHeaderComponent = useCallback(() => (<>
        <Beam style={{ marginTop: -6 }} />
        {!background.isColor &&
            <ImageLoader
                style={{ height: 100, width: "100%" }}
                resizeMode="cover"
                cacheKey={background.fullKey}
                disable={background.disable}
                source={background.full}
                defaultSource={background.loadFull}
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
    //endregion

    /* =============[ COMPS ]============ */
    //region [COMPONENT] "Modals" = The modals that display implicitly over the screen (createPost, etc).
    const Modals = () => <>
        <Loading enabled={!ready} />
        <CreatePost
            visible={showCreate}
            onClose={closeCreate}
            currentUser={currentUser.current}
            navigation={navigation}
        />
        <BackgroundEditor
            visible={showBack}
            onClose={() => setShowBack(false)}
            onSuccess={successBack}
        />
        <Settings
            visible={showSettings}
            onClose={() => setShowSettings(false)}
            navigation={navigation}
        />
    </>
    //endregion

    return (
        <Screen>
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
                    renderItem={RenderItem}
                />
            }
            <Modals />
        </Screen>
    );
}

const styles = StyleSheet.create({
    //region beamCircle
    beamCircle: {
        flexDirection: 'row',
        alignItems: "center",
        marginTop: -50,
        zIndex: 5,
    },
    //endregion
    //region beam
    beam: {
        flex: 1,
    },
    //endregion
    //region ppicEditing
    ppicEditing: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "black",
    },
    //endregion
    //region innerPpicEditing
    innerPpicEditing: {
        borderRadius: 50,
        opacity: 0.4
    },
    //endregion
    //region ppic
    ppic: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    //endregion
    //region innerPpic
    innerPpic: {
        borderRadius: 50,
    },
    //endregion
    //region changePpic
    changePpic: {
        position: "absolute",
        alignSelf: "center",
    },
    //endregion
    //region upperBody
    upperBody: {
        marginTop: -50,
        padding: 10,
        flexDirection: "row",
        justifyContent: "space-between",
        backgroundColor: colors.background
    },
    //endregion
    //region midBody
    midBody: {
        padding: 10,
        paddingTop: 20,
        margin: 0,
        minHeight: 70,
        alignItems: "center",
        justifyContent: "flex-end",
        backgroundColor: colors.background
    },
    //endregion
    //region title
    title: {
        fontWeight: "400"
    },
    //endregion
    //region title2
    title2: {
        fontWeight: "500"
    },
    //endregion
    //region textInput
    textInput: {
        color: colors.text1,
        fontSize: 18,
        maxHeight: 140,
    },
    //endregion
    //region posts
    posts: {
        flex: 1,
    },
    //endregion
    //region empty
    empty: {
        height: "100%"
    },
    //endregion
    //region body
    body: {
        backgroundColor: colors.background
    }
    //endregion
})