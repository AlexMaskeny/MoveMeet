//region 3rd Party Imports
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { StyleSheet, FlatList, RefreshControl, View, ActivityIndicator} from 'react-native';
import { Storage, Auth } from 'aws-amplify';
import * as Location from 'expo-location';
import { useNetInfo } from "@react-native-community/netinfo";
//endregion
//region 1st Party Imports
import Screen from '../comps/Screen';
import UserSquare from '../comps/UserSquare';
import NoUsersAlert from '../comps/NoUsersAlert';
import NoLocationAlert from '../comps/NoLocationAlert';
import IconButton from '../comps/IconButton';
import HelpDiscoverPage from '../comps/HelpDiscoverPage';
import BugReport from '../comps/BugReport';
import { calls, instances, mmAPI } from '../api/mmAPI';
import { colors, css, rules } from '../config';
import * as logger from '../functions/logger';
import * as distance from '../functions/distance';
import * as locConversion from '../functions/locConversion';
//endregion

export default function DiscoverPage({ navigation}) {
    /* =============[ VARS ]============ */
    //region useRef variables
    const currentUser = useRef();      //The current dynamodb user (not cognito)
    const remainingUsers = useRef([]); //The users nearby that are not yet rendered
    //endregion
    //region useState variables
    const [users, setUsers] = useState([]);             //The users nearby that ARE already rendered
    const [locEnabled, setLocEnabled] = useState(true); //Is the user's location enabled? If no display a no location alert
    const [ready, setReady] = useState(false);          //Have we attempted to get the nearby users at least once?
    const [refresh, setRefresh] = useState(false);      //Are we currently attempting to get the nearby users?
    const [rerender, setRerender] = useState(false);    //A placeholder state variable. Only utilized to run useFocusEffect again by setRerender(!rerender)
    const [showHelp, setShowHelp] = useState(false);    //Should we show the help modal?
    const [showBug, setShowBug] = useState(false);      //Should we show the bug report modal?
    //endregion
    const netInfo = useNetInfo();

    /* =============[ HOOKS ]============ */
    //region [HOOK] "useEffect, [navigation]" = Header Initialization For Screen Specific Icons
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
    }, [navigation,]);
    //endregion
    //region [HOOK] "useEffect, [rerender]" = Get the current user and get the nearby users.
    useEffect(() => {
        //All async calls must be in this block in useEffect hooks
        (async function() {
            try {
                //Ensure the user is connected. Sometimes it displays disconnected on first run through, so always run on first run through.
                if (!netInfo.isConnected && ready) return;

                //region Get the current user
                const cognitoUser = await Auth.currentAuthenticatedUser();
                currentUser.current = await mmAPI.query({
                    call: calls.GET_USER_BY_COGNITO,
                    instance: instances.LEAST,
                    input: {
                        id: cognitoUser.attributes.sub
                    }
                });
                //endregion

                //Now get the nearby users
                await onRefresh();
            } catch (error) {
                logger.warn(error);
            }
        })();
    }, [rerender]);
    //endregion

    /* =============[ FUNCS ]============ */
    //region [FUNC ASYNC] "onRefresh = async ()" = Get ALL the nearby users then use pagination and fillData to display the closest 14 (or less)
    const onRefresh = async () => {
        try {
            //region Verify that we CAN refresh [warning is okay]
            //Ensure the user is connected. Sometimes it displays disconnected on first run through, so always run on first run through.
            if (!netInfo.isConnected && ready) throw "[DISCOVERPAGE] onRefresh failed because there is no connection.";

            //If location is disabled, exit
            const locPerm = await Location.getForegroundPermissionsAsync();
            if (!locPerm.granted) {
                setLocEnabled(false);
                setUsers([]);
                throw "[DISCOVERPAGE] onRefresh failed because location is disabled.";
            }
            //endregion
            //region Get the current user's location (in coordinate degrees) and convert it to units comparable to database units (ft)
            const userLocation = await Location.getLastKnownPositionAsync();
            const userLocationConverted = locConversion.toChat(userLocation.coords.latitude, userLocation.coords.longitude);
            //endregion
            //region Get the nearby users
            const nearbyUsersResponse = await mmAPI.query({
                call: calls.LIST_USERS_BY_LOCATION,
                instance: instances.LEAST,
                input: {
                    ...userLocationConverted,
                    radius: rules.nearYouRadius
                }
            });
            //endregion

            //If there is no problem getting the nearby users then continue
            if (nearbyUsersResponse) {
                const nearbyUsers = nearbyUsersResponse.items;
                let userData = [];

                //region Iterate through each nearby user and calculate the distance from it (does not download images)
                for (let i = 0; i < nearbyUsers.length; i++) {
                    let user = nearbyUsers[i];

                    //[IF] the user nearby is the current user [THEN] go to the next user
                    if (user.id === currentUser.current.id || user.loggedOut) continue;

                    //Calculate the distance from the user
                    user.dis = distance.raw(user.lat, user.long, userLocationConverted.lat, userLocationConverted.long);

                    //[IF] the user nearby is actually far away [THEN] go to the next user
                    if (user.dis > 1000) continue;
                    //[ELSE] add the user
                    userData.push(user);
                }
                //endregion

                //Put the closet users on top
                userData.sort((a, b) => {
                    if (Number(a.dis) > Number(b.dis)) return 1;
                    else return -1;
                })

                //Store the new users
                remainingUsers.current = userData;

                //Download the users profile pictures, but with pagination (see fillData's explanation for more info)
                await fillData(true);
            } else throw "[DISCOVERPAGE] onRefresh failed because there was an error getting nearby users";

        } catch (error) {
            logger.warn(error);
        } finally {
            setReady(true);
            setRefresh(false);
        }
    }
    //endregion
    //region [FUNC ASYNC] "fillData = async (reset = false)" = Downloads the profile pictures of the next 14 (or less) remaining users and displays these users.
    const fillData = async (reset = false) => {
        //If there are no more users to render then exit
        if (remainingUsers.current.length <= 0) return;
        let userData = [];

        //region Get the current user's location (in coordinate degrees) and convert it to units comparable to database units (ft)
        const userLocation = await Location.getLastKnownPositionAsync();
        const userLocationConverted = locConversion.toChat(userLocation.coords.latitude, userLocation.coords.longitude);
        //endregion
        //region Iterate through the next 14 (or less) users. Download their profile pictures, and calculate the new distance
        for (let i = 0; i < Math.min(rules.pagination.DiscoverPage, remainingUsers.current.length); i++) {
            let user = remainingUsers.current[i];

            //region [IF] the user has no profile picture [THEN] set user.noImage to true
            if (user.profilePicture.loadFull === " " || user.profilePicture.full === " ") user.noImage = true;
            //endregion
            //region [ELSE] download the user's profile picture
            else {
                const loadFull = await Storage.get(user.profilePicture.loadFull);
                const full = await Storage.get(user.profilePicture.full);
                user.profilePicture.uri = {
                    loadFull: loadFull,
                    full: full,
                    fullKey: user.profilePicture.full
                }
            }
            //endregion

            //get the distance from current user
            user.distance = distance.formula(user.lat, user.long, userLocationConverted.lat, userLocationConverted.long);

            //Display this user
            userData.push(user);
        }
        //endregion
        //region Display the next 14 (or less) users. Remove the displayed users from the remaining users.
        setUsers(existingData => {
            if (reset) return [...userData];
            else return [...existingData, ...userData]
        });
        remainingUsers.current = remainingUsers.current.slice(rules.pagination.DiscoverPage);
        //endregion
    }
    //endregion
    //region [FUNC ASYNC] "enableLocation = async ()" = Enable location and send user to LoadingPage to enable loc subs.
    const enableLocation = async () => {
        setLocEnabled(true);
        setReady(false);
        navigation.navigate("LoadingPage");
    }
    //endregion

    /* =============[ LIST ]============ */
    //region [CALL COMP] "ListEmptyComponent, [users, ready]" = When there are no nearby users and location is enabled then display a noUsersAlert. If loc disabled display no location alert.
    const ListEmptyComponent = React.useCallback(() => {
        if (ready && locEnabled) return <NoUsersAlert />;
        else if (ready && !locEnabled) return <NoLocationAlert enable={enableLocation} />
    }, [users, ready]);
    //endregion
    //region [CALL COMP] "ListHeaderComponent, [ready]" = Displays an activity indicator during initial load.
    const ListHeaderComponent = useCallback(() => {
        if (!ready) return <ActivityIndicator color={colors.pBeam} size="large" style={{ marginTop: 10 }} />
    }, [ready]);
    //endregion
    //region [CALL COMP] "RenderItem, [users, ready]" = Displays a nearby user's usersquare
    const RenderItem = useCallback(({ item }) => {
        if (ready) {
            return <UserSquare user={item} navigation={navigation} />
        } else return <></>
    }, [users, ready]);
    //endregion
    const keyExtractor = useCallback((item) => item.id, []);

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
                renderItem={RenderItem}
            /> 
            <HelpDiscoverPage visible={showHelp} onClose={() => setShowHelp(false)} openBug={()=>setShowBug(true)} />
            <BugReport visible={showBug} onClose={() => setShowBug(false)} currentUser={currentUser.current} />
        </Screen>
    );
}

const styles = StyleSheet.create({
    //region users
    users: {
        flex: 1,
        paddingTop: 10,
        paddingHorizontal: 6
    },
    //endregion
    //region headerDisabled
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
    //endregion
    //region headerEnabled
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
    //endregion
    //region headerTextDisabled
    headerTextDisabled: {
        fontWeight: "500",
    },
    //endregion
    //region headerTextEnabled
    headerTextEnabled: {
        fontWeight: "600"
    },
    //endregion
    //region headerContainer
    headerContainer: {
        flexDirection: "row",
    }
    //endregion
});
