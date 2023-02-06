import React, { useState, useRef, useCallback, useEffect } from 'react';
import { StyleSheet, View, Image, FlatList, RefreshControl, Alert, ActivityIndicator} from 'react-native';
import { API, graphqlOperation, Storage, Auth } from 'aws-amplify';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { CommonActions } from '@react-navigation/native';

import Screen from '../comps/Screen';
import Loading from '../comps/Loading';
import { colors, css } from '../config';
import * as logger from '../functions/logger';
import * as timeLogic from '../functions/timeLogic';
import * as distance from '../functions/distance';
import * as locConversion from '../functions/locConversion';
import { createChat, createChatMembers, getUserByCognito, getDetailedUser, getSimplifiedChat, getUserFriends, listMessagesByTime, updateMessage, updateUser } from '../api/calls';
import Beam from '../comps/Beam';
import ProfileCircle from '../comps/ProfileCircle';
import SubTitle from '../comps/SubTitle';
import Post from '../comps/Post';
import SimpleInput from '../comps/SimpleInput';
import IconButton from '../comps/IconButton';



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
                const cUserResponse = await API.graphql(graphqlOperation(getUserByCognito, {
                    id: cognitoUser.attributes.sub
                }))
                cUser.current = cUserResponse.data.getUserByCognito;
                const user = await API.graphql(graphqlOperation(getDetailedUser, {
                    id: route.params.opposingUser.id
                }));
                currentUser.current = user.data.getUser;
                setUsername(currentUser.current.username);
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
                    } else currentUser.current.posts.items[i].distance = "an unknown distance"
                }
                    
                setPosts(currentUser.current.posts.items.sort((a, b) => {
                    if (Date.parse(a.createdAt) > Date.parse(b.createdAt)) {
                        return -1;
                    } else return 1;
                }));
                setProfilePicture({ uri: full, loadImage: loadFull });
                
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
            var userFriends = (await API.graphql(graphqlOperation(getUserFriends, {
                UserID: userID
            }))).data.getUser.friends;
            const opposingUserEl = userFriends.findIndex(el => el.friendID == currentUser.current.id);
            if (opposingUserEl != -1) {
                const friend = userFriends[opposingUserEl];
                if (friend.status == "666") {
                    Alert.alert("This user is blocked.", "You blocked this user. Go into your settings to unblock them.");
                    throw "Blocked";
                } else {
                    const last1response = await API.graphql(graphqlOperation(listMessagesByTime, {
                        limit: 1,
                        chatMessagesId: friend.chatID
                    }));
                    if (last1response.data.listMessagesByTime.items.length > 0) {
                        var read = last1response.data.listMessagesByTime.items[0].read;
                        if (!read.includes(userID)) read.push(userID);
                        await API.graphql(graphqlOperation(updateMessage, {
                            input: {
                                id: last1response.data.listMessagesByTime.items[0].id,
                                read: read
                            }
                        }));
                        if (userFriends[opposingUserEl].status == "1" || userFriends[opposingUserEl].status == "3") {
                            if (userFriends[opposingUserEl].status == "1") userFriends[opposingUserEl].status = "0";
                            if (userFriends[opposingUserEl].status == "3") userFriends[opposingUserEl].status = "2";
                            await API.graphql(graphqlOperation(updateUser, {
                                input: {
                                    id: userID,
                                    friends: userFriends
                                }
                            }));
                        }
                    }
                    const chat = await API.graphql(graphqlOperation(getSimplifiedChat, {
                        id: friend.chatID
                    }));
                    if (chat.data.getChat.members.items.length < 2) throw "Blocked 2";
                    navigation.dispatch(CommonActions.navigate({
                        name: "ChatPage",
                        key: friend.chatID,
                        params: {
                            name: currentUser.current.username,
                            created: chat.data.getChat.createdAt,
                            id: friend.chatID,
                            userChatMembersID: chat.data.getChat.members.items[0].user.id == userID ? chat.data.getChat.members.items[0].id : chat.data.getChat.members.items[1].id,
                            user: cUser.current,
                            private: true
                        }
                    }));
                }
            } else {
                const newChat = await API.graphql(graphqlOperation(createChat, {
                    input: {
                        enabled: true,
                        private: true,
                    }
                }));
                const newChatID = newChat.data.createChat.id;
                const newMember = await API.graphql(graphqlOperation(createChatMembers, {
                    input: {
                        chatID: newChatID,
                        userID: userID,
                    }
                }));
                await API.graphql(graphqlOperation(createChatMembers, {
                    input: {
                        chatID: newChatID,
                        userID: currentUser.current.id,
                    }
                }));
                navigation.dispatch(CommonActions.navigate({
                    name: "ChatPage",
                    key: newChatID,
                    params: {
                        name: currentUser.current.username,
                        created: newChat.data.createChat.createdAt,
                        id: newChatID,
                        userChatMembersID: newMember.data.createChatMembers.id,
                        user: cUser.current,
                        private: true
                    }
                }));
                var opposingUserFriends = (await API.graphql(graphqlOperation(getUserFriends, {
                    UserID: currentUser.current.id
                }))).data.getUser.friends;
                opposingUserFriends.push({
                    friendID: userID,
                    chatID: newChatID,
                    status: 0,
                })
                userFriends.push({
                    friendID: currentUser.current.id,
                    chatID: newChatID,
                    status: 0
                });
                await API.graphql(graphqlOperation(updateUser, {
                    input: {
                        id: userID,
                        friends: userFriends
                    }
                }));
                await API.graphql(graphqlOperation(updateUser, {
                    input: {
                        id: currentUser.current.id,
                        friends: opposingUserFriends
                    }
                }));
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
        {!background.isColor &&
            <LinearGradient
                colors={['rgba(18, 18, 18,0.4)', colors.background]}
                style={{ height: 120, width: "100%", marginTop: -120}}
            />
        }
        <View style={styles.beamCircle}>
            <Beam style={styles.beam} />
            <View style={{ justifyContent: "center" }}>
                <ProfileCircle ppic={{uri: profilePicture.uri}} style={styles.ppic} innerStyle={styles.innerPpic} />
            </View>         
            <Beam style={styles.beam} />
        </View>
        <View style={styles.upperBody}>
            <View>
                <SubTitle style={styles.title2} size={Platform.OS == "android" ? 18 : 16} color={colors.text1}>@{username}</SubTitle>
            </View>
            {loading &&
                <View>
                    <ActivityIndicator color={colors.text1} size="small" />
                </View>
            }
            {!loading &&
                <View>
                    <SubTitle style={styles.title2} size={18} color={colors.text1} onPress={message}>Message</SubTitle>
                </View>
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
        justifyContent: "space-between"
    },
    midBody: {
        padding: 10,
        margin: 10,
        marginTop: 40,
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
})
