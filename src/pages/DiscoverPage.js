import React, { useState, useRef, useCallback, useEffect } from 'react';
import { StyleSheet, FlatList, RefreshControl} from 'react-native';
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

export default function DiscoverPage({ navigation, route }) {
    const currentUser = useRef();

    const [users, setUsers] = useState([]);
    const [locEnabled, setLocEnabled] = useState(true);
    const [noUsers, setNoUsers] = useState(false);
    const [ready, setReady] = useState(false);
    const [refresh, setRefresh] = useState(false);
    const [rerender, setRerender] = useState(false);

    const netInfo = useNetInfo();

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
                        if (nearbyUsers.length == 0) setNoUsers(true);
                        else setNoUsers(false);
                        var userData = [];
                        for (var i = 0; i < nearbyUsers.length; i++) {
                            var user = nearbyUsers[i];
                            if (user.id == currentUser.current.id) continue;
                            user.profilePicture.loadFull = await Storage.get(user.profilePicture.loadFull);
                            user.profilePicture.full = await Storage.get(user.profilePicture.full);
                            user.distance = await distance.formula(user.lat, user.long, userLocationConverted.lat, userLocationConverted.long);
                            userData.push(user);
                        }
                        userData.sort((a, b) => {
                            if (a.distance > b.distance) return 1;
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
            <NoLocationAlert visible={!locEnabled} />
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