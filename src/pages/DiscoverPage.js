import React, { useState, useRef, useCallback, useEffect } from 'react';
import { StyleSheet, FlatList, RefreshControl, View, ActivityIndicator} from 'react-native';
import { Storage, Auth } from 'aws-amplify';
import * as Location from 'expo-location';
import { useNetInfo } from "@react-native-community/netinfo";

import { colors, css, rules } from '../config';
import Screen from '../comps/Screen';
import * as logger from '../functions/logger';
import * as distance from '../functions/distance';
import * as locConversion from '../functions/locConversion';
import UserSquare from '../comps/UserSquare';
import NoUsersAlert from '../comps/NoUsersAlert';
import NoLocationAlert from '../comps/NoLocationAlert';
import IconButton from '../comps/IconButton';
import HelpDiscoverPage from '../comps/HelpDiscoverPage';
import BugReport from '../comps/BugReport';
import { calls, instances, mmAPI } from '../api/mmAPI';

export default function DiscoverPage({ navigation, route }) {
    const currentUser = useRef();
    const remainingUsers = useRef([]);

    const [users, setUsers] = useState([]);
    const [locEnabled, setLocEnabled] = useState(true);
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
                    currentUser.current = await mmAPI.query({
                        call: calls.GET_USER_BY_COGNITO,
                        instance: instances.LEAST,
                        input: {
                            id: cognitoUser.attributes.sub
                        }
                    });
                    onRefresh();
                }
            } catch (error) {
                logger.warn(error);
            }
        }
        initialFunction();
    }, [rerender]);

    const fillData = async (reset = false) => {
        if (remainingUsers.current.length > 0) {
            const userLocation = await Location.getLastKnownPositionAsync();
            const userLocationConverted = locConversion.toChat(userLocation.coords.latitude, userLocation.coords.longitude);
            var userData = [];
            for (var i = 0; i < Math.min(rules.pagination.DiscoverPage, remainingUsers.current.length); i++) {
                var user = remainingUsers.current[i];
                if (user.profilePicture.loadFull == " " || user.profilePicture.full == " ") user.noImage = true;
                user.profilePicture.loadFull = await Storage.get(user.profilePicture.loadFull);
                user.profilePicture.full = await Storage.get(user.profilePicture.full);
                user.distance = await distance.formula(user.lat, user.long, userLocationConverted.lat, userLocationConverted.long);
                userData.push(user);
            }
            setUsers(existingData => {
                if (reset) return [...userData];
                else return [...existingData, ...userData]
            });
            remainingUsers.current = remainingUsers.current.slice(rules.pagination.DiscoverPage);
        }
    }

    const onRefresh = async () => {
        try {
            logger.eLog("Loading users near current user...");
            if (netInfo.isConnected || !ready) {
                const locPerm = await Location.getForegroundPermissionsAsync();
                if (locPerm.granted) {
                    const userLocation = await Location.getLastKnownPositionAsync();
                    const userLocationConverted = locConversion.toChat(userLocation.coords.latitude, userLocation.coords.longitude);
                    const nearbyUsersResponse = await mmAPI.query({
                        call: calls.LIST_USERS_BY_LOCATION,
                        instance: instances.LEAST,
                        input: {
                            ...userLocationConverted,
                            radius: rules.nearYouRadius
                        }
                    });
                    if (nearbyUsersResponse) {
                        const nearbyUsers = nearbyUsersResponse.items;
                        var userData = [];
                        for (var i = 0; i < nearbyUsers.length; i++) {
                            var user = nearbyUsers[i];
                            if (user.id == currentUser.current.id || user.loggedOut) continue;
                            user.dis = distance.raw(user.lat, user.long, userLocationConverted.lat, userLocationConverted.long);
                            if (user.dis > 1000) continue;
                            userData.push(user);
                        }
                        userData.sort((a, b) => {
                            if (Number(a.dis) > Number(b.dis)) return 1;
                            else return -1;
                        })
                        remainingUsers.current = userData;
                        fillData(true);
                    } else throw "[DISCOVERPAGE] onRefresh failed because there was an error getting nearby users";
                } else {
                    setLocEnabled(false);
                    setUsers([]);
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
        setLocEnabled(true);
        setReady(false);
        navigation.navigate("LoadingPage");
    }
    const ListEmptyComponent = React.useCallback(() => {
        if (ready && locEnabled) return <NoUsersAlert />;
        else if (ready && !locEnabled) return <NoLocationAlert enable={enableLocation} />
    }, [users, ready])
    const ListHeaderComponent = useCallback(() => {
        if (!ready) return <ActivityIndicator color={colors.pBeam} size="large" style={{ marginTop: 10 }} />
        
    }, [ready]);
    const keyExtractor = useCallback((item) => item.id, []);
    const renderItem = useCallback(({ item }) => {
        if (ready) {
            return <UserSquare user={item} navigation={navigation} />
        } else return <></>
    }, [users, ready]);
    return (
        <Screen innerStyle={styles.page}>
            <FlatList
                data={users}
                numColumns={2}
                ListHeaderComponent={ListHeaderComponent}
                style={styles.users}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="always"
                keyboardDismissMode="on-drag"
                keyExtractor={keyExtractor}
                ListFooterComponent={() => (<View style={{ height: 20 }} />)}
                ListEmptyComponent={ListEmptyComponent}
                maxToRenderPerBatch={6}
                onEndReached={fillData}
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
