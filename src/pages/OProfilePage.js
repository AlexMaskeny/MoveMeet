//region 3rd Party Imports
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { StyleSheet, View, FlatList, RefreshControl, Alert, ActivityIndicator, TouchableOpacity} from 'react-native';
import { Storage, Auth } from 'aws-amplify';
import { LinearGradient } from 'expo-linear-gradient';
import { CommonActions } from '@react-navigation/native';
import * as Location from 'expo-location';
//endregion
//region 1st Party Imports
import Screen from '../comps/Screen';
import Loading from '../comps/Loading';
import ImageLoader from '../comps/ImageLoader';
import Beam from '../comps/Beam';
import ProfileCircle from '../comps/ProfileCircle';
import SubTitle from '../comps/SubTitle';
import Post from '../comps/Post';
import SimpleInput from '../comps/SimpleInput';
import IconButton from '../comps/IconButton';
import { dark_colors } from '../config';
import { calls, instances, mmAPI } from '../api/mmAPI';
import * as logger from '../functions/logger';
import * as timeLogic from '../functions/timeLogic';
import * as distance from '../functions/distance';
import * as locConversion from '../functions/locConversion';
//endregion

export default function OProfilePage({ navigation, route }) {
    /* =============[ VARS ]============ */
    //region useRef variables
    const opposingUser = useRef(); //The dynamodb user of the logged-in user
    const currentUser = useRef();  //the dynamodb user of the user this page is displaying
    //endregion
    //region useState variables
    const [posts, setPosts] = useState([]);                   //A list of the opposingUser's posts
    const [username, setUsername] = useState("");             //The opposingUser's username
    const [bio, setBio] = useState("");                       //The opposingUser's bio
    const [name, setName] = useState("");                     //The opposingUser's name
    const [profilePicture, setProfilePicture] = useState({}); //Profile picture in the form {full: *URI*, loadFull: *URI*, fullKey: *CacheKey*}
    const [background, setBackground] = useState({});         //Background picture in form {full: *URI*, loadFull: *URI*, fullKey: *CacheKey*}
    const [ready, setReady] = useState(false);                //Have we attempted to get the currentUser's data at least once?
    const [loading, setLoading] = useState(false);            //Should we display an activity indicator instead of "Message"? (Triggered on clicking "Message")
    const [refresh, setRefresh] = useState(false);            //Should we display an activity indicator on top? (Triggered on pulling down)
    const [rerender, setRerender] = useState(false);          //Simply used to rerun the initial useEffect call. Always of form "setRerender(!rerender)
    //endregion

    /* =============[ HOOKS ]============ */
    //region [HOOK] "useEffect, [name]" = Header Initialization For Screen Specific Icons & Title
    useEffect(() => {
        navigation.setOptions({
            title: name,
            headerLeft: () => (
                <View style={{ alignItems: "center", justifyContent: "center", flexDirection: "row", flex: 1 }}>
                    <IconButton
                        icon="chevron-back"
                        brand="Ionicons"
                        color={dark_colors.pBeamBright}
                        size={34}
                        onPress={() => navigation.goBack()}
                    />
                </View>
            ),
        })
    }, [name])
    //endregion
    //region [HOOK] "useEffect, [rerender]" = Gets all of opposingUser's data and displays it
    useEffect(() => {
        //Must wrap async calls in this block in use effect calls.
        (async function() {
            try {
                logger.eLog("[OProfilePage] Fetching currentUser Data...");

                //region Get the currentUser
                const cognitoUser = await Auth.currentAuthenticatedUser();
                currentUser.current = await mmAPI.query({
                    call: calls.GET_USER_BY_COGNITO,
                    instance: "oProfilePage",
                    input: {
                        id: cognitoUser.attributes.sub
                    }
                });
                //endregion
                //region Get the opposingUser & update the text state variables (ie. username, name, bio)
                opposingUser.current = await mmAPI.query({
                    call: calls.GET_USER,
                    instance: instances.FULL,
                    input: {
                        id: route.params.opposingUser.id
                    }
                });
                setUsername(opposingUser.current.username);
                setName(opposingUser.current.name);
                setBio(opposingUser.current.bio);
                //endregion

                //PROFILE PICTURE
                //region Download opposingUser's profile picture and display it
                const loadFull = await Storage.get(opposingUser.current.profilePicture.loadFull);
                const full = await Storage.get(opposingUser.current.profilePicture.full);
                setProfilePicture({
                    full: full,
                    loadFull: loadFull,
                    fullKey: opposingUser.current.profilePicture.full
                });
                //endregion

                //BACKGROUND
                //region [IF] opposingUser uses a color background [THEN] set the background to that color
                if (opposingUser.current.background.enableColor)
                    setBackground({
                        isColor: true,
                        color: opposingUser.current.background.color
                    });
                //endregion
                //region [ELSE] opposingUser uses an image background [SO] download it and set the background to that image
                else {
                    const backLoadFull = await Storage.get(opposingUser.current.background.loadFull);
                    const backFull = await Storage.get(opposingUser.current.background.full);
                    setBackground({
                        full: backFull,
                        loadFull: backLoadFull,
                        color: "",
                        isColor: false,
                        fullKey: opposingUser.current.background.full
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
                //region Iterate through each of the opposingUser's posts, download post, calculate distance from currentUser to where post was created, and display post
                for (let i = 0; i < opposingUser.current.posts.items.length; i++) {
                    //download the post's image
                    const pLoadFull = await Storage.get(opposingUser.current.posts.items[i].image.loadFull);
                    const pFull = await Storage.get(opposingUser.current.posts.items[i].image.full);
                    opposingUser.current.posts.items[i].image.uri = {
                        full: pFull,
                        loadFull: pLoadFull,
                        fullKey: opposingUser.current.posts.items[i].image.full
                    }

                    //calculate the time since the post was created
                    opposingUser.current.posts.items[i].time = timeLogic.ago((Date.now() - Date.parse(opposingUser.current.posts.items[i].createdAt)) / 1000);

                    //calculate the distance the user is from where the post was created
                    if (locPerms.granted) {
                        opposingUser.current.posts.items[i].distance = distance.formula(
                            location.lat,
                            location.long,
                            opposingUser.current.posts.items[i].lat,
                            opposingUser.current.posts.items[i].long,
                        );
                    } else opposingUser.current.posts.items[i].distance = "an unknown distance"
                }
                //endregion
                //region Sort the posts (putting the more recent on top) and display them
                setPosts(opposingUser.current.posts.items.sort((a, b) => {
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
    //region [FUNC ASYNC] "message = async ()" = Trigger when the user clicks "Message". Navigates currentUser to a privateChat with opposingUser. (Does friendship checks)
    const message = async () => {
        try {
            if (currentUser.current.id === opposingUser.current.id) return;

            //Change the "Message" button to an activity indicator
            setLoading(true);

            //Find the friendship between the opposingUser and the current user
            const opposingUserIndex = currentUser.current.friends.findIndex(el => el.friendID === opposingUser.current.id);

            //region [IF] the opposingUser and the currentUser already have a friendship [THEN] make sure no one is blocked then message
            if (opposingUserIndex !== -1) {
                //Get the friendship between currentUser and opposingUser (from currentUser)
                const friend = currentUser.current.friends[opposingUserIndex];

                //region [IF] the opposingUser is blocked by the current user [THEN] alert the currentUser to unblock them
                if (friend.status == "666") {
                    Alert.alert("This user is blocked.", "You blocked this user. Go into your settings to unblock them.");
                    throw "Blocked";
                }
                //endregion
                //region [IF] there was at least one message in the chat [THEN] add the currentUser to the read list of the latest message
                //region Attempt to get the last message from the chat
                const last1response = await mmAPI.query({
                    call: calls.LIST_MESSAGES_BY_TIME,
                    instance: "settingsChat",
                    input: {
                        limit: 1,
                        chatMessagesId: friend.chatID
                    }
                });
                //endregion

                if (last1response.items.length > 0) {
                    //Store the list of people who read the latest message of the chat in a mutable container
                    let read = last1response.items[0].read;

                    //[IF] the currentUser isn't already included in the list of reads [THEN] add them
                    if (!read.includes(currentUser.current.id)) read.push(currentUser.current.id);
                    await mmAPI.mutate({
                        call: calls.UPDATE_MESSAGE,
                        input: {
                            id: last1response.items[0].id,
                            read: read
                        }
                    })
                }
                //endregion
                //region [IF] the currentUser has cleared their conversation with opposingUser from PrivateChatsPage [THEN] display it again.
                if (currentUser.current.friends[opposingUserIndex].status === "1" ||
                    currentUser.current.friends[opposingUserIndex].status === "3"
                ) {
                    if (currentUser.current.friends[opposingUserIndex].status === "1")
                        currentUser.current.friends[opposingUserIndex].status = "0";
                    if (currentUser.current.friends[opposingUserIndex].status === "3")
                        currentUser.current.friends[opposingUserIndex].status = "2";
                    await mmAPI.mutate({
                        call: calls.UPDATE_USER,
                        input: {
                            id: currentUser.current.id,
                            friends: currentUser.current.friends
                        }
                    });
                }
                //endregion

                //region Get the chat between the currentUser and opposingUser
                const chat = await mmAPI.query({
                    call: calls.GET_CHAT,
                    instance: "loadingPage",
                    input: {
                        id: friend.chatID
                    }
                });
                //endregion
                //region If the currentUser was blocked by opposingUser then alert & exit
                if (chat.members.items.length < 2) {
                    Alert.alert("You have been blocked", "This user has blocked you");
                    throw "Blocked 2";
                }
                //endregion

                //region Navigate to the chat page
                navigation.dispatch(CommonActions.navigate({
                    name: "ChatPage",
                    key: friend.chatID,
                    params: {
                        name: opposingUser.current.username,
                        created: chat.createdAt,
                        id: friend.chatID,
                        userChatMembersID: chat.members.items[0].user.id == currentUser.current.id ? chat.members.items[0].id : chat.members.items[1].id,
                        user: currentUser.current,
                        private: true
                    }
                }));
                //endregion

            }
            //endregion
            //region [ELSE] create the friendship between them & message.
            else {
                //region Create a new private chat
                const newChat = await mmAPI.mutate({
                    call: calls.CREATE_CHAT,
                    input: {
                        enabled: true,
                        private: true,
                    }
                });
                //endregion
                //region Add the currentUser as a member to the new chat (store as chatMember as currentUserMembership)
                const currentUserMembership = await mmAPI.mutate({
                    call: calls.CREATE_CHAT_MEMBERS,
                    input: {
                        chatID: newChat.id,
                        userID: currentUser.current.id,
                    }
                })
                //endregion
                //region Add the opposingUser as a member to the new chat
                await mmAPI.mutate({
                    call: calls.CREATE_CHAT_MEMBERS,
                    input: {
                        chatID: newChat.id,
                        userID: opposingUser.current.id,
                    }
                });
                //endregion
                //region Add the currentUser to the opposing user's friend list (status 0)
                opposingUser.current.friends.push({
                    friendID: currentUser.current.id,
                    chatID: newChat.id,
                    status: 0,
                });
                await mmAPI.mutate({
                    call: calls.UPDATE_USER,
                    input: {
                        id: opposingUser.current.id,
                        friends: opposingUser.current.friends
                    }
                });
                //endregion
                //region Add the opposingUser to the current user's friend list (status 0)
                currentUser.current.friends.push({
                    friendID: opposingUser.current.id,
                    chatID: newChat.id,
                    status: 0
                });
                await mmAPI.mutate({
                    call: calls.UPDATE_USER,
                    input: {
                        id: currentUser.current.id,
                        friends: currentUser.current.friends
                    }
                })
                //endregion

                //region Navigate to the new chat
                navigation.dispatch(CommonActions.navigate({
                    name: "ChatPage",
                    key: newChat.id,
                    params: {
                        name: opposingUser.current.username,
                        created: newChat.createdAt,
                        id: newChat.id,
                        userChatMembersID: currentUserMembership.id,
                        user: currentUser.current,
                        private: true
                    }
                }));
                //endregion
            }
            //endregion
        } catch (error) {
            logger.warn(error);
        } finally {
            setLoading(false);
        }
    }
    //endregion

    /* =============[ LIST ]============ */
    const keyExtractor = useCallback((item) => item.id, []);
    //region [CALL COMP] "RenderItem, [posts, profilePicture]" = The component used to render a post from the opposingUser
    const RenderItem = useCallback(({ item }) => (
        <Post
            user={opposingUser.current}
            profilePicture={profilePicture}
            post={item}
            edit={false}
            onDelete={()=>logger.eLog("This shouldn't happen")}
        />
    ), [posts, profilePicture]);
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
    //region [CALL COMP] "ListHeaderComponent, [rerender, ready, profilePicture, loading]" = Displays the header which includes the profile picture, bio, background, message button, username, etc.
    const ListHeaderComponent = useCallback(() => (<>
        <View style={styles.body}>
            <Beam style={{ marginTop: -6 }} />

            {/*=========[BACKGROUND]=========*/}
            {!background.isColor &&
                <>
                    <ImageLoader
                        style={{ height: 100, width: "100%" }}
                        resizeMode="cover"
                        source={background.full}
                        defaultSource={background.loadFull}
                        cacheKey={background.fullKey }
                    />
                    <LinearGradient
                    colors={['rgba(18, 18, 18,0.4)', dark_colors.background]}
                    style={{ height: 120, width: "100%", marginTop: -120}}
                    />
                </>
            }
            {background.isColor &&
                <View style={{ height: 100, width: "100%", backgroundColor: background.color }} />
            }

            {/*=========[PROFILE PICTURE]=========*/}
            <View style={styles.beamCircle}>
                <Beam style={styles.beam} />
                <View style={{ justifyContent: "center" }}>
                    <ProfileCircle ppic={profilePicture} style={styles.ppic} innerStyle={styles.innerPpic} />
                </View>         
                <Beam style={styles.beam} />
            </View>

            {/*=========[USERNAME & MESSAGE BUTTON]=========*/}
            <View style={styles.upperBody}>
                <View>
                    <SubTitle style={styles.title2} size={Platform.OS === "android" ? 18 : 16} color={dark_colors.background}>@{username}</SubTitle>
                </View>
                {loading &&
                    <View>
                        <ActivityIndicator color={dark_colors.text1} size="small" />
                    </View>
                }
                {!loading &&
                    <TouchableOpacity onPress={message} style={{zIndex: 8}}>
                        <SubTitle style={styles.title2} size={18} color={dark_colors.text1}>Message</SubTitle>
                    </TouchableOpacity>
                }
            </View>

            {/*=========[BIO]=========*/}
            <View style={styles.midBody}>
                <SimpleInput
                    autoCorrect={true}
                    editable={false}
                    cStyle={{backgroundColor: dark_colors.background} }
                    multiline={true}
                    maxLength={160}
                    style={styles.textInput}
                    defaultValue={bio}
                    onChangeText={setBio}
                />
            </View>

            <View style={{ height: 20 }} />
        </View>
    </>), [rerender, ready, profilePicture, loading]);
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
                    ListEmptyComponent={ListEmptyComponent}
                    windowSize={4}
                    refreshControl={
                        <RefreshControl
                            refreshing={refresh}
                            onRefresh={() => {
                                setRefresh(true);
                                setRerender(!rerender);
                            }}
                            tintColor={dark_colors.pBeam}
                        />
                    }
                    ListHeaderComponent={ListHeaderComponent}
                    renderItem={RenderItem}
                />
            }
            <Loading enabled={!ready} />
        </Screen>
    );
}

const styles = StyleSheet.create({
    //region beamCircle
    beamCircle: {
        flexDirection: 'row',
        alignItems: "center",
        marginTop: -50,
    },
    //endregion
    //region beam
    beam: {
        flex: 1,
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
    //region upperBody
    upperBody: {
        marginTop: -50,
        padding: 10,
        flexDirection: "row",
        justifyContent: "space-between",
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
        color: dark_colors.text1,
        fontSize: 18,
        maxHeight: 140,
    },
    //endregion
    //region posts
    posts: {
        flex: 1,
    },
    //endregion
    //region body
    body: {
        backgroundColor: dark_colors.background
    }
    //endregion
});
