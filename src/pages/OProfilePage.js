import React, { useState, useRef, useCallback, useEffect } from 'react';
import { StyleSheet, View, FlatList, RefreshControl, Alert, ActivityIndicator, TouchableOpacity} from 'react-native';
import { Storage, Auth } from 'aws-amplify';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { CommonActions } from '@react-navigation/native';

import Screen from '../comps/Screen';
import Loading from '../comps/Loading';
import { colors } from '../config';
import ImageLoader from '../comps/ImageLoader';
import * as logger from '../functions/logger';
import * as timeLogic from '../functions/timeLogic';
import * as distance from '../functions/distance';
import * as locConversion from '../functions/locConversion';
import Beam from '../comps/Beam';
import ProfileCircle from '../comps/ProfileCircle';
import SubTitle from '../comps/SubTitle';
import Post from '../comps/Post';
import SimpleInput from '../comps/SimpleInput';
import IconButton from '../comps/IconButton';
import { calls, instances, mmAPI } from '../api/mmAPI';



export default function OProfilePage({ navigation, route }) {
    const currentUser = useRef();
    const cUser = useRef();

    const [posts, setPosts] = useState([]);
    const [username, setUsername] = useState("");
    const [bio, setBio] = useState(""); 
    const [name, setName] = useState("");
    const [profilePicture, setProfilePicture] = useState({});
    const [background, setBackground] = useState({});
    const [ready, setReady] = useState(false);
    const [loading, setLoading] = useState(false);
    const [refresh, setRefresh] = useState(false);
    const [rerender, setRerender] = useState(false);

    //SIMPLY TO MAKE THE HEADERBUTTON WORK
    useEffect(() => {
        navigation.setOptions({
            title: name,
            headerLeft: () => (
                <View style={{ alignItems: "center", justifyContent: "center", flexDirection: "row", flex: 1 }}>
                    <IconButton
                        icon="chevron-back"
                        brand="Ionicons"
                        color={colors.pBeamBright}
                        size={34}
                        onPress={() => navigation.goBack()}
                    />
                </View>
            ),
        })
    }, [name])

    //DATA FETCHING
    useEffect(() => {
        const initialFunction = async () => {
            try {
                logger.eLog("[OProfilePage] Fetching User Data...");
                const cognitoUser = await Auth.currentAuthenticatedUser();
                cUser.current = await mmAPI.query({
                    call: calls.GET_USER_BY_COGNITO,
                    instance: "oProfilePage",
                    input: {
                        id: cognitoUser.attributes.sub
                    }
                })
                currentUser.current = await mmAPI.query({
                    call: calls.GET_USER,
                    instance: instances.FULL,
                    input: {
                        id: route.params.opposingUser.id
                    }
                });
                setUsername(currentUser.current.username);
                setName(currentUser.current.name);
                setBio(currentUser.current.bio);
                const loadFull = await Storage.get(currentUser.current.profilePicture.loadFull);
                const full = await Storage.get(currentUser.current.profilePicture.full);
                if (currentUser.current.background.enableColor) setBackground({ isColor: true, color: currentUser.current.background.color });
                else {
                    const backLoadFull = await Storage.get(currentUser.current.background.loadFull);
                    const backFull = await Storage.get(currentUser.current.background.full);
                    setBackground({ full: backFull, loadFull: backLoadFull, color: "", isColor: false, fullKey: currentUser.current.background.full });
                }
                const locPerms = await Location.getForegroundPermissionsAsync();
                var location;
                if (locPerms.granted) {
                    const locResponse = await Location.getLastKnownPositionAsync();
                    location = locConversion.toUser(locResponse.coords.latitude, locResponse.coords.longitude);
                };
                for (var i = 0; i < currentUser.current.posts.items.length; i++) {
                    const pLoadFull = await Storage.get(currentUser.current.posts.items[i].image.loadFull);
                    const pFull = await Storage.get(currentUser.current.posts.items[i].image.full);
                    currentUser.current.posts.items[i].image.uri = {
                        full: pFull,
                        loadFull: pLoadFull,
                        fullKey: currentUser.current.posts.items[i].image.full 
                    }
                    currentUser.current.posts.items[i].time = timeLogic.ago((Date.now() - Date.parse(currentUser.current.posts.items[i].createdAt)) / 1000);
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
                    
                setPosts(currentUser.current.posts.items.sort((a, b) => {
                    if (Date.parse(a.createdAt) > Date.parse(b.createdAt)) {
                        return -1;
                    } else return 1;
                }));
                
                setProfilePicture({ full: full, loadFull: loadFull, fullKey: currentUser.current.profilePicture.full });
            } catch (error) {
                logger.warn(error);
            } finally {
                setReady(true);
                setRefresh(false);
            }
        }
        initialFunction();
    }, [rerender]);

    const message = async () => {
        try {
            setLoading(true);
            const userID = cUser.current.id;
            var userFriends = cUser.current.friends;
            const opposingUserEl = userFriends.findIndex(el => el.friendID == currentUser.current.id);

            if (opposingUserEl != -1) {
                const friend = userFriends[opposingUserEl];
                if (friend.status == "666") {
                    Alert.alert("This user is blocked.", "You blocked this user. Go into your settings to unblock them.");
                    throw "Blocked";
                } else {
                    const last1response = await mmAPI.query({
                        call: calls.LIST_MESSAGES_BY_TIME,
                        instance: "settingsChat",
                        input: {
                            limit: 1,
                            chatMessagesId: friend.chatID
                        }
                    });
                    if (last1response.items.length > 0) {
                        var read = last1response.items[0].read;
                        if (!read.includes(userID)) read.push(userID);
                        await mmAPI.mutate({
                            call: calls.UPDATE_MESSAGE,
                            input: {
                                id: last1response.items[0].id,
                                read: read
                            }
                        })
                        if (userFriends[opposingUserEl].status == "1" || userFriends[opposingUserEl].status == "3") {
                            if (userFriends[opposingUserEl].status == "1") userFriends[opposingUserEl].status = "0";
                            if (userFriends[opposingUserEl].status == "3") userFriends[opposingUserEl].status = "2";
                            await mmAPI.mutate({
                                call: calls.UPDATE_USER,
                                input: {
                                    id: userID,
                                    friends: userFriends
                                }
                            });
                        }
                    }
                    const chat = await mmAPI.query({
                        call: calls.GET_CHAT,
                        instance: "loadingPage",
                        input: {
                            id: friend.chatID
                        }
                    })
                    if (chat.members.items.length < 2) throw "Blocked 2";
                    navigation.dispatch(CommonActions.navigate({
                        name: "ChatPage",
                        key: friend.chatID,
                        params: {
                            name: currentUser.current.username,
                            created: chat.createdAt,
                            id: friend.chatID,
                            userChatMembersID: chat.members.items[0].user.id == userID ? chat.members.items[0].id : chat.members.items[1].id,
                            user: cUser.current,
                            private: true
                        }
                    }));
                }
            } else {
                const newChat = await mmAPI.mutate({
                    call: calls.CREATE_CHAT,
                    input: {
                        enabled: true,
                        private: true,
                    }
                })
                const newMember = await mmAPI.mutate({
                    call: calls.CREATE_CHAT_MEMBERS,
                    input: {
                        chatID: newChat.id,
                        userID: userID,
                    }
                })
                await mmAPI.mutate({
                    call: calls.CREATE_CHAT_MEMBERS,
                    input: {
                        chatID: newChat.id,
                        userID: currentUser.current.id,
                    }
                })

                navigation.dispatch(CommonActions.navigate({
                    name: "ChatPage",
                    key: newChat.id,
                    params: {
                        name: currentUser.current.username,
                        created: newChat.createdAt,
                        id: newChat.id,
                        userChatMembersID: newMember.id,
                        user: cUser.current,
                        private: true
                    }
                }));
                var opposingUserFriends = currentUser.current.friends;
                opposingUserFriends.push({
                    friendID: userID,
                    chatID: newChat.id,
                    status: 0,
                })
                userFriends.push({
                    friendID: currentUser.current.id,
                    chatID: newChat.id,
                    status: 0
                });
                await mmAPI.mutate({
                    call: calls.UPDATE_USER,
                    input: {
                        id: userID,
                        friends: userFriends
                    }
                })
                await mmAPI.mutate({
                    call: calls.UPDATE_USER,
                    input: {
                        id: currentUser.current.id,
                        friends: opposingUserFriends
                    }
                })

            }
        } catch (error) {
            logger.warn(error);
        } finally {
            setLoading(false);
        }
    }

    const keyExtractor = useCallback((item) => item.id, []);
    const renderItem = useCallback(({ item }) => (
        <Post
            user={currentUser.current}
            profilePicture={profilePicture}
            post={item}
            edit={false}
            onDelete={()=>logger.eLog("This shouldn't happen")}
        />
    ), [posts, profilePicture]);

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
        <View style={styles.body}>
            <Beam style={{ marginTop: -6 }} />
            {!background.isColor &&
                <ImageLoader
                    style={{ height: 100, width: "100%" }}
                    resizeMode="cover"
                    source={background.full}
                    defaultSource={background.loadFull}
                    cacheKey={background.fullKey }
                />
            }
            {background.isColor &&
                <View style={{ height: 100, width: "100%", backgroundColor: background.color }} />
            }
            {!background.isColor &&
                <LinearGradient
                    colors={['rgba(18, 18, 18,0.4)', colors.background]}
                    style={{ height: 120, width: "100%", marginTop: -120}}
                />
            }
            <View style={styles.beamCircle}>
                <Beam style={styles.beam} />
                <View style={{ justifyContent: "center" }}>
                    <ProfileCircle ppic={profilePicture} style={styles.ppic} innerStyle={styles.innerPpic} />
                </View>         
                <Beam style={styles.beam} />
            </View>
            <View style={styles.upperBody}>
                <View>
                    <SubTitle style={styles.title2} size={Platform.OS == "android" ? 18 : 16} color={colors.background}>@{username}</SubTitle>
                </View>
                {loading &&
                    <View>
                        <ActivityIndicator color={colors.text1} size="small" />
                    </View>
                }
                {!loading &&
                    <TouchableOpacity onPress={message} style={{zIndex: 8}}>
                        <SubTitle style={styles.title2} size={18} color={colors.text1}>Message</SubTitle>
                    </TouchableOpacity>
                }
            </View>
            <View style={styles.midBody}>
                <SimpleInput
                    autoCorrect={true}
                    editable={false}
                    cStyle={{backgroundColor: colors.background} }
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
                    ListEmptyComponent={ListEmptyComponent}
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
    ppic: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    innerPpic: {
        borderRadius: 50,
    },
    upperBody: {
        marginTop: -50,
        padding: 10,

        flexDirection: "row",
        justifyContent: "space-between",


    },
    midBody: {
        padding: 10,
        paddingTop: 20,
        margin: 0,
        minHeight: 70,
        alignItems: "center",
        justifyContent: "flex-end",

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
    body: {
        backgroundColor: colors.background

    }
})
