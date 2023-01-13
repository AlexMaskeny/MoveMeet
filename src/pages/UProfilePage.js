import React, { useState, useRef } from 'react';
import { Keyboard, StyleSheet, TextInput, TouchableOpacity, View, Image} from 'react-native';
import { API, Auth, graphqlOperation, Storage } from 'aws-amplify';
import { LinearGradient } from 'expo-linear-gradient';

import BeamTitle from '../comps/BeamTitle';
import SimpleButton from '../comps/SimpleButton';
import Screen from '../comps/Screen';
import Loading from '../comps/Loading';
import { colors, css } from '../config';
import * as logger from '../functions/logger';
import { getUserByCognito } from '../api/calls';
import Beam from '../comps/Beam';
import ProfileCircle from '../comps/ProfileCircle';
import IconButton from '../comps/IconButton';
import SubTitle from '../comps/SubTitle';


export default function UProfilePage({ navigation }) {
    const currentUser = useRef();
    const bioEditRef = useRef();

    const [username, setUsername] = useState("");
    const [bio, setBio] = useState("");
    const [email, setEmail] = useState("");
    const [ready, setReady] = useState(false);
    const [refresh, setRefresh] = useState(false);
    const [profilePicture, setProfilePicture] = useState({});
    const [editing, setEditing] = useState(true);
    const [bioEdit, setBioEdit] = useState(false);

    React.useEffect(() => {
        const initialFunction = async () => {
            try {
                logger.eLog("[UProfileSettings] Fetching User Data...");
                const cognitoUser = await Auth.currentUserInfo();
                if (cognitoUser) {
                    setUsername(cognitoUser.username);
                    setEmail(cognitoUser.attributes.email);
                }
                const user = await API.graphql(graphqlOperation(getUserByCognito, {
                    id: cognitoUser.attributes.sub
                }));
                currentUser.current = user.data.getUserByCognito;
                setBio(currentUser.current.bio)
                const loadFull = await Storage.get(currentUser.current.profilePicture.loadFull);
                const full = await Storage.get(currentUser.current.profilePicture.full);
                setProfilePicture({ uri: full, loadImage: loadFull });
            } catch (error) {
                logger.warn(error);
            } finally {
                setReady(true);
            }
        }
        initialFunction();
    }, []);

    const logout = async () => {
        try {
            await Auth.signOut();
            logger.eLog("Signed User Out");
            navigation.navigate("LoginPage");
        } catch (error) {
            logger.warn(error);
        }
    }

    const changePpic = () => {
        console.log("PPic");
    }

    const changeBio = () => {
        setBioEdit(true);
        bioEditRef.current.focus();
    }

    return (
        <Screen innerStyle={styles.page}>
            {ready && <>           
                <Image
                    style={{ height: 100, width: 100 }}
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
                                <IconButton icon="square-edit-outline" brand="MaterialCommunityIcons" size={40} color={colors.text1} />
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
                        <SubTitle style={styles.title} size={18} color={colors.text1}>@{username}</SubTitle>
                        <SubTitle size={14} color={colors.text4}>0 feet away</SubTitle>
                    </View>
                    <View>
                        <SubTitle style={styles.title2} size={18} color={colors.text1}>Message</SubTitle>
                    </View>
                </View>
                {editing &&
                    <View style={styles.midBody}>
                        <TextInput
                            autoCorrect={true}
                            ref={bioEditRef}
                            multiline={true}
                            maxLength={160}
                            style={styles.textInput}
                            defaultValue={bio}
                            onPressIn={() => setBioEdit(true)}
                            onPressOut={() => setBioEdit(false) }
                            onChangeText={(text) => {
                                setBio(text);
                            }}
                        />
                        <View style={{height: 10}} />
                        {!bioEdit &&
                            <IconButton icon="square-edit-outline" brand="MaterialCommunityIcons" size={30} color={colors.pBeamBright} onPress={changeBio} />
                        }
                        {bioEdit &&
                            <TouchableOpacity onPress={() => { Keyboard.dismiss(); setBioEdit(false) }}>
                                <SubTitle style={styles.title2} size={18} color={colors.pBeamBright}>Done</SubTitle>
                            </TouchableOpacity>
                        }
                    </View>
                }
                {!editing &&
                    <View style={styles.midBody}>
                        <SubTitle numberOfLines={5} style={styles.title} size={18} color={colors.text1}>{bio}</SubTitle>
                    </View>
                }
            </>}
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
    }
})
