import React from 'react';
import { StyleSheet} from 'react-native';
import { NavigationContainer, getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

import { colors, footerHeight, css } from './config';
import LoadingPage from './pages/LoadingPage';
import LoginPage from './pages/LoginPage';
import ChatsPage from './pages/ChatsPage';
import ChatPage from './pages/ChatPage';
import PrivateChatsPage from './pages/PrivateChatsPage';
import IconButton from './comps/IconButton';
import UProfilePage from './pages/UProfilePage';
import OProfilePage from './pages/OProfilePage';
import DiscoverPage from './pages/DiscoverPage';
import * as logger from './functions/logger';

//The navigation screen starts on the loading screen which uses
//the useEffect hook immediately calling an inner async function
//that attains data and redirects user to appropriate page.

function navigation() {
    const Primary = createStackNavigator();
    const PrimaryNav = () => (
        <Primary.Navigator
            screenOptions={{
                headerShown: false,
                gestureEnabled: false,
            }}
        >
            <Primary.Screen name="LoadingPage" component={LoadingPage} />
            <Primary.Screen name="LoginPage" component={LoginPage} />
            {/*<Primary.Screen name="SignupNav" component={SignupNav} />*/}
            <Primary.Screen name="SecondaryNav" component={SecondaryNav} />
        </Primary.Navigator>
    );
    const SecondNavStyle = StyleSheet.create({
        tabBarStyle: {
            height: footerHeight,
            borderTopColor: colors.pBeam,
            borderTopWidth: 1,
            backgroundColor: colors.container,
            ...css.beamShadow,

        }
    });
    const Secondary = createBottomTabNavigator();
    const SecondaryNav = () => (
        <Secondary.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.pBeamBright,
                inactiveTintColor: colors.text2,
                lazy: true,
                tabBarShowLabel: false,
                tabBarStyle: SecondNavStyle.tabBarStyle,
            }}
        >
            <Secondary.Screen
                name="TChatNav"
                component={TChatNav}
                options={({ navigation, route }) => {
                    React.useLayoutEffect(() => {
                        const routeName = getFocusedRouteNameFromRoute(route) ?? "ChatsPage";
                        logger.log("Page: " + routeName);
                        if (routeName === "ChatPage") {
                            navigation.setOptions({ tabBarStyle: { display: 'none' } });
                        } else {
                            navigation.setOptions({tabBarStyle: SecondNavStyle.tabBarStyle});
                        }
                    }, [navigation, route]);
                    return (
                        {
                            tabBarIcon: ({ color }) =>
                                <IconButton
                                    icon="earth"
                                    color={color}
                                    brand="MaterialCommunityIcons"
                                    size={36}
                                    style={{
                                        ...css.beamShadow,
                                        shadowColor: color,
                                    }}
                                    onPress={() => navigation.navigate("TChatNav")}
                                />
                        }
                    )
                }}
            />
            <Secondary.Screen
                name="DiscoverNav"
                component={DiscoverNav}
                options={({ navigation }) => (
                    {
                        headerShown: false,
                        gestureEnabled: false,

                        title: "Discover",
                        tabBarIcon: ({ color }) =>
                            <IconButton
                                icon="supervised-user-circle"
                                brand="MaterialIcons"
                                color={color}
                                size={36}
                                style={{
                                    ...css.beamShadow,
                                    shadowColor: color,
                                }}
                                onPress={() => navigation.navigate("DiscoverNav")}
                            />
                    }
                )}
            />
            <Secondary.Screen
                name="PChatNav"
                component={PChatNav}
                options={({ navigation, route }) => {
                    React.useLayoutEffect(() => {
                        const routeName = getFocusedRouteNameFromRoute(route) ?? "PrivateChatsPage";
                        logger.log("Page: " + routeName);
                        if (routeName === "ChatPage") {
                            navigation.setOptions({ tabBarStyle: { display: 'none' } });
                        } else {
                            navigation.setOptions({ tabBarStyle: SecondNavStyle.tabBarStyle });
                        }
                    }, [navigation, route]);
                    return (
                        {
                            tabBarIcon: ({ color }) =>
                                <IconButton
                                    icon="md-chatbubble-ellipses"
                                    color={color}
                                    brand="Ionicons"
                                    size={36}
                                    style={{
                                        ...css.beamShadow,
                                        shadowColor: color,
                                    }}
                                    onPress={() => navigation.navigate("PChatNav")}
                                />
                        }
                    )
                }}
            />
            <Secondary.Screen
                name="UProfileNav"
                component={UProfileNav}
                options={({ navigation }) => (
                    {
                        tabBarIcon: ({ color }) =>
                            <IconButton
                                icon="account-circle"
                                brand="MaterialCommunityIcons"
                                color={color}
                                size={36}
                                style={{
                                    ...css.beamShadow,
                                    shadowColor: color,
                                }}
                                onPress={() => navigation.navigate("UProfileNav")}
                            />
                    }
                )}
            />
        </Secondary.Navigator>
    );
    const chatNavOptions = {
        headerShown: true,
        gestureEnabled: false,
        headerStyle: {
            backgroundColor: colors.container,
            borderBottomColor: colors.pBeam,
            borderBottomWidth: 1,
            ...css.beamShadow
        },
        headerTintColor: colors.pBeamBright,
        headerLeft: () => <></>,
    }
    const TChat = createStackNavigator();
    const TChatNav = () => (
        <TChat.Navigator screenOptions={chatNavOptions}>
            <TChat.Screen name="ChatsPage" component={ChatsPage} options={({ navigation }) => ({
                title: "Chats Near You",
             })}/>
            <TChat.Screen name="ChatPage" component={ChatPage} />
            <TChat.Screen name="OProfilePage" component={OProfilePage} />
        </TChat.Navigator>
    );
    const PChat = createStackNavigator();
    const PChatNav = () => (
        <PChat.Navigator screenOptions={chatNavOptions}>
            <PChat.Screen name="PrivateChatsPage" component={PrivateChatsPage} options={{ title: "Private Chats" }} />
            <PChat.Screen name="ChatPage" component={ChatPage} />
            <PChat.Screen name="OProfilePage" component={OProfilePage} />
        </PChat.Navigator>
    );
    const UProfile = createStackNavigator();
    const UProfileNav = () => (
        <UProfile.Navigator screenOptions={chatNavOptions}>
            <UProfile.Screen name="UProfilePage" component={UProfilePage} options={{ title: "Your Profile" }} />
            <UProfile.Screen name="OtherPage" component={UProfilePage} options={{ title: "Other Page" }} />
        </UProfile.Navigator>
    );
    const Discover = createStackNavigator();
    const DiscoverNav = () => (
        <Discover.Navigator screenOptions={chatNavOptions}>
            <Discover.Screen name="DiscoverPage" component={DiscoverPage} options={{ title: "Discover" }} />
            <Discover.Screen name="OProfilePage" component={OProfilePage} />
        </Discover.Navigator>
    );
    return (
        <NavigationContainer>
                <PrimaryNav />
        </NavigationContainer>
    );
}

export default navigation;