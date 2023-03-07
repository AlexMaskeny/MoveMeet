//region 3rd Party Imports
import React from 'react';
import { StyleSheet} from 'react-native';
import { NavigationContainer, getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
//endregion
//region 1st Party imports
import { dark_colors, footerHeight, css } from './config';
import * as logger from './functions/logger';
//endregion
//region Page Imports
import LoadingPage from './pages/LoadingPage';
import LoginPage from './pages/LoginPage';
import ChatsPage from './pages/ChatsPage';
import ChatPage from './pages/ChatPage';
import PrivateChatsPage from './pages/PrivateChatsPage';
import IconButton from './comps/IconButton';
import UProfilePage from './pages/UProfilePage';
import OProfilePage from './pages/OProfilePage';
import DiscoverPage from './pages/DiscoverPage';
import AuthPage from './pages/AuthPage';
import SignupPage1 from './pages/SignupPage1';
import SignupPage2 from './pages/SignupPage2';
import SignupPage3 from './pages/SignupPage3';
import SignupPage4 from './pages/SignupPage4';
import ForgotPasswordPage1 from './pages/ForgotPasswordPage1';
import ForgotPasswordPage2 from './pages/ForgotPasswordPage2';
import ExplorePage from './pages/ExplorePage';
//endregion

//The navigation screen starts on the loading screen which uses
//the useEffect hook immediately calling an inner async function
//that attains data and redirects user to appropriate page.

function navigation() {
    //region [STACK NAVIGATOR] "PrimaryNav" = The primary stack navigator of the app (includes auth pages on same level as secondary nav)
    const Primary = createStackNavigator();
    const PrimaryNav = () => (
        <Primary.Navigator
            screenOptions={{
                headerShown: false,
                gestureEnabled: false,
            }}
        >
            <Primary.Screen name="LoadingPage" component={LoadingPage} initialParams={{signOut: false}}/>
            <Primary.Screen name="AuthPage" component={AuthPage} />
            <Primary.Screen name="LoginPage" component={LoginPage} />
            <Primary.Screen name="SignupPage1" component={SignupPage1} />
            <Primary.Screen name="SignupPage2" component={SignupPage2} />
            <Primary.Screen name="SignupPage3" component={SignupPage3} />
            <Primary.Screen name="SignupPage4" component={SignupPage4} />
            <Primary.Screen name="ForgotPasswordPage1" component={ForgotPasswordPage1} />
            <Primary.Screen name="ForgotPasswordPage2" component={ForgotPasswordPage2} />
            <Primary.Screen name="SecondaryNav" component={SecondaryNav} />
        </Primary.Navigator>
    );
    //endregion

    //region [TAB NAVIGATOR] "SecondaryNav" = The tab navigator of the app which includes all main screens used regularly
    //region Style the tab bar
    const SecondNavStyle = StyleSheet.create({
        tabBarStyle: {
            height: footerHeight,
            borderTopColor: dark_colors.pBeam,
            borderTopWidth: 2,
            backgroundColor: dark_colors.background,
            ...css.beamShadow,

        }
    });
    //endregion
    const Secondary = createBottomTabNavigator();
    const SecondaryNav = () => (
        <Secondary.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: dark_colors.pBeamBright,
                inactiveTintColor: dark_colors.text2,
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
                                    onPress={() => navigation.navigate("TChatNav")}
                                />
                        }
                    )
                }}
            />
            <Secondary.Screen
                name="DiscoverNav"
                component={DiscoverNav}
                options={({ navigation, route }) => {
                    React.useLayoutEffect(() => {
                        const routeName = getFocusedRouteNameFromRoute(route) ?? "DiscoverPage";
                        logger.log("Page: " + routeName);
                        if (routeName === "ChatPage") {
                            navigation.setOptions({ tabBarStyle: { display: 'none' } });
                        } else {
                            navigation.setOptions({ tabBarStyle: SecondNavStyle.tabBarStyle });
                        }
                    }, [navigation, route]);
                    return ({
                        headerShown: false,
                        gestureEnabled: false,

                        title: "Discover",
                        tabBarIcon: ({ color }) =>
                            <IconButton
                                icon="supervised-user-circle"
                                brand="MaterialIcons"
                                color={color}
                                size={36}
                                onPress={() => navigation.navigate("DiscoverNav")}
                            />
                    })
                }}
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
                                onPress={() => navigation.navigate("UProfileNav")}
                            />
                    }
                )}
            />
        </Secondary.Navigator>
    );
    //endregion

    //region Default header options for the primary pages
    const chatNavOptions = {
        headerShown: true,
        gestureEnabled: false,
        headerStyle: {
            backgroundColor: dark_colors.background,
            borderBottomColor: dark_colors.pBeam,
            borderBottomWidth: 2,
            ...css.beamShadow
        },
        headerTintColor: dark_colors.pBeamBright,
        headerLeft: () => <></>,
    }
    //endregion
    //region TChatNav (The public chats)
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
    //endregion
    //region PChatNav (the private chats)
    const PChat = createStackNavigator();
    const PChatNav = () => (
        <PChat.Navigator screenOptions={chatNavOptions}>
            <PChat.Screen name="PrivateChatsPage" component={PrivateChatsPage} options={{ title: "Private Chats" }} />
            <PChat.Screen name="ChatPage" component={ChatPage} />
            <PChat.Screen name="OProfilePage" component={OProfilePage} />
        </PChat.Navigator>
    );
    //endregion
    //region UProfileNav
    const UProfile = createStackNavigator();
    const UProfileNav = () => (
        <UProfile.Navigator screenOptions={chatNavOptions}>
            <UProfile.Screen name="UProfilePage" component={UProfilePage} options={{ title: "Your Profile" }} />
            <UProfile.Screen name="OtherPage" component={UProfilePage} options={{ title: "Other Page" }} />
        </UProfile.Navigator>
    );
    //endregion
    //region DiscoverNav
    const Discover = createStackNavigator();
    const DiscoverNav = () => (
        <Discover.Navigator screenOptions={chatNavOptions}>
            <Discover.Screen name="DiscoverPage" component={DiscoverPage} options={{ title: "Discover" }} />
            <Discover.Screen name="OProfilePage" component={OProfilePage} />
            <Discover.Screen name="ChatPage" component={ChatPage} />
        </Discover.Navigator>
    );
    //endregion

    return (
        <NavigationContainer>
                <PrimaryNav />
        </NavigationContainer>
    );
}

export default navigation;