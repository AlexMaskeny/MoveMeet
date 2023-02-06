import React, { useState, useRef, useCallback, useEffect } from 'react';
import { StyleSheet, FlatList, RefreshControl, View} from 'react-native';
import { API, graphqlOperation, Storage, Auth } from 'aws-amplify';
import * as Location from 'expo-location';
import { useNetInfo } from "@react-native-community/netinfo";

import { colors, css, rules } from '../config';
import {listUsersByLocation, getUserByCognito} from '../api/calls';
import Screen from '../comps/Screen';
import Loading from '../comps/Loading';
import * as logger from '../functions/logger';
import * as distance from '../functions/distance';
import * as locConversion from '../functions/locConversion';
import UserSquare from '../comps/UserSquare';
import NoUsersAlert from '../comps/NoUsersAlert';
import NoLocationAlert from '../comps/NoLocationAlert';
import IconButton from '../comps/IconButton';
import HelpDiscoverPage from '../comps/HelpDiscoverPage';
import BugReport from '../comps/BugReport';

export default function DiscoverPage({ navigation, route }) {
    const currentUser = useRef();

    const [users, setUsers] = useState([]);
    const [locEnabled, setLocEnabled] = useState(true);
    const [noUsers, setNoUsers] = useState(false);
    const [ready, setReady] = useState(false);
    const [refresh, setRefresh] = useState(false);
    const [rerender, setRerender] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [showBug, setShowBug] = useState(false);

    const netInfo = useNetInfo();
    
    useEffect(() => {
        navigation.setOptions({
            headerLeft: () => (
                <View style={{ alignItems: "center", justifyContent: "center", marginLeft: 10, flex: 1 }}>
                    <IconButton
                        icon="help-circle"
                        brand="Ionicons"
                        color={colors.text1}
                        size={32}
                        onPress={() => setShowHelp(true)}
                    />
                </View>
            )
        })
    }, [navigation]);

    //DATA FETCHING
    useEffect(() => {
        const initialFunction = async () => {
            try {
                if (netInfo.isConnected || !ready) {
                    const cognitoUser = await Auth.currentAuthenticatedUser();
                    currentUser.current = (await API.graphql(graphqlOperation(getUserByCognito, {
                        id: cognitoUser.attributes.sub
                    }))).data.getUserByCognito;
                    onRefresh();
                }
            } catch (error) {
                logger.warn(error);
            }
        }
        initialFunction();
    }, [rerender]);

    const onRefresh = async () => {
        try {
            logger.eLog("Loading users near current user...");
            if (netInfo.isConnected || !ready) {
                const locPerm = await Location.getForegroundPermissionsAsync();
                if (locPerm.granted) {
                    const userLocation = await Location.getLastKnownPositionAsync();
                    const userLocationConverted = locConversion.toChat(userLocation.coords.latitude, userLocation.coords.longitude);

                    const nearbyUsersResponse = await API.graphql(graphqlOperation(listUsersByLocation, {
                        ...userLocationConverted,
                        radius: rules.nearYouRadius
                    }));
                    if (nearbyUsersResponse) {
                        const nearbyUsers = nearbyUsersResponse.data.listUsersByLocation.items;
                        var userData = [];
                        for (var i = 0; i < nearbyUsers.length; i++) {
                            var user = nearbyUsers[i];
                            if (user.id == currentUser.current.id) continue;
                            if (user.profilePicture.loadFull == " " || user.profilePicture.full == " ") user.noImage = true;
                            user.profilePicture.loadFull = await Storage.get(user.profilePicture.loadFull);
                            user.profilePicture.full = await Storage.get(user.profilePicture.full);
                            user.distance = await distance.formula(user.lat, user.long, userLocationConverted.lat, userLocationConverted.long);
                            user.dis = user.distance.substring(0, user.distance.indexOf(' '));
                            userData.push(user);
                        }
                        if (userData.length == 0) setNoUsers(true)
                        else setNoUsers(false);
                        userData.sort((a, b) => {
                            if (Number(a.dis) > Number(b.dis)) return 1;
                            else return -1;
                        })
                        setUsers(userData);
                    } else throw "[DISCOVERPAGE] onRefresh failed because there was an error getting nearby users";
                } else {
                    setLocEnabled(false);
                    throw "[DISCOVERPAGE] onRefresh failed because location is disabled.";
                }
            } else throw "[DISCOVERPAGE] onRefresh failed because there is no connection.";
        } catch (error) {
            logger.warn(error);
        } finally {
            setReady(true);
            setRefresh(false);
        }
    }

    const enableLocation = async () => {
        const result = await Location.requestForegroundPermissionsAsync();
        if (result.granted) {
            setLocEnabled(true);
            setReady(false);
            navigation.navigate("LoadingPage");
        }
    }

    const ListHeaderComponent = useCallback(() => {
        //return (<>
        //    <View style={styles.headerContainer}>
        //        <TouchableOpacity style={search ? styles.headerDisabled : styles.headerEnabled} onPress={()=>setSearch(false)}>
        //            <SubTitle style={styles.headerTextEnabled} size={16} color={colors.text1}>Near You</SubTitle>
        //        </TouchableOpacity>    
        //        <TouchableOpacity style={search ? styles.headerEnabled : styles.headerDisabled} onPress={() => setSearch(true)}>
        //            <SubTitle style={styles.headerTextDisabled} size={16} color={colors.text1 }>Search</SubTitle>
        //        </TouchableOpacity>   
        //    </View>
        //    <DarkBeam style={{backgroundColor: colors.container, marginBottom: 10, borderRadius: 5} } />
        //    {search && 
        //        <View style={styles.searchContainer}>
        //            <SimpleInput placeholder="Search" icon="account-search" />
        //        </View>
        //    }
        //</>)
    }, []);
    const keyExtractor = useCallback((item) => item.id, []);
    const renderItem = useCallback(({ item }) => {
        return <UserSquare user={item} navigation={navigation} />
    }, [users]);
    return (
        <Screen innerStyle={styles.page}>
            {ready &&         
                <FlatList
                    data={users}
                    numColumns={2}
                    ListHeaderComponent={ListHeaderComponent}
                    style={styles.users}
                    showsVerticalScrollIndicator={true}
                    keyboardShouldPersistTaps="always"
                    keyboardDismissMode="on-drag"
                    keyExtractor={keyExtractor}
                    ListFooterComponent={() => (<View style={{height: 20} } />) }
                    maxToRenderPerBatch={6}
                    windowSize={6}
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
                    renderItem={renderItem}
                />
            }
            <Loading enabled={!ready} />
            <NoUsersAlert visible={noUsers} />
            <NoLocationAlert visible={!locEnabled} enable={enableLocation} />
            <HelpDiscoverPage visible={showHelp} onClose={() => setShowHelp(false)} openBug={()=>setShowBug(true)} />
            <BugReport visible={showBug} onClose={() => setShowBug(false)} currentUser={currentUser.current} />
        </Screen>
    );
}

const styles = StyleSheet.create({
    users: {
        flex: 1,
        paddingTop: 10,
        paddingHorizontal: 6
    },
    headerDisabled: {
        flex: 1,
        height: 38,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.container,
        ...css.beamShadow,
        shadowColor: "black",
        shadowRadius: 2,
        shadowOpacity: 0.5,
        marginBottom: 14,
        marginTop: 6,
        marginHorizontal: 6,
        borderRadius: 20,
    },
    headerEnabled: {
        flex: 1,
        height: 38,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.container,
        ...css.beamShadow,
        borderColor: colors.pBeam,
        borderWidth: 1,
        marginBottom: 14,
        marginTop: 6,
        marginHorizontal: 6,
        borderRadius: 20,
    },
    headerTextDisabled: {
        fontWeight: "500",
    },
    headerTextEnabled: {
        fontWeight: "600"
    },
    headerContainer: {
        flexDirection: "row",
    }
})
