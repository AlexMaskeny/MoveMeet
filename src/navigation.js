import React from 'react';
import { StyleSheet } from 'react-native';
import { NavigationContainer, getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

import { colors, footerHeight, css, debug } from './config';
import LoadingPage from './pages/LoadingPage';
import LoginPage from './pages/LoginPage';
import ChatsPage from './pages/ChatsPage';
import ChatPage from './pages/ChatPage';
import IconButton from './comps/IconButton';
import UProfileSettings from './pages/UProfileSettings';

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
                tabBarShowLabel: false,
                tabBarStyle: SecondNavStyle.tabBarStyle,
            }}
        >
            <Secondary.Screen
                name="TChatNav"
                component={TChatNav}
                options={({ navigation, route }) => {
                    React.useLayoutEffect(() => {
                        const routeName = getFocusedRouteNameFromRoute(route);
                        if (debug) console.log(routeName);
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
                                    onPress={() => navigation.navigate("TChatNav")}
                                />
                        }
                    )
                }}
            />
            <Secondary.Screen
                name="UProfileSettings"
                component={UProfileSettings}
                options={({ navigation }) => (
                    {
                        tabBarIcon: ({ color }) =>
                            <IconButton
                                icon="baby-face"
                                brand="MaterialCommunityIcons"
                                color={color}
                                size={36}
                                style={{
                                    ...css.beamShadow,
                                    shadowColor: color,
                                }}
                                onPress={() => navigation.navigate("UProfileSettings")}
                            />
                    }
                )}
            />
            <Secondary.Screen
                name="OtherScreen2"
                component={TChatNav}
                options={({ navigation }) => (
                    {
                        tabBarIcon: ({ color }) =>
                            <IconButton
                                icon="baby-face"
                                color={color}
                                brand="MaterialCommunityIcons"
                                size={36}
                                style={{
                                    ...css.beamShadow,
                                    shadowColor: color,
                                }}
                                onPress={() => navigation.navigate("OtherScreen2")}
                            />
                    }
                )}
            />
        </Secondary.Navigator>
    );
    const TChat = createStackNavigator();
    const TChatNav = () => (
        <TChat.Navigator
            screenOptions={{
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
            }}
            
        >
            <TChat.Screen name="ChatsPage" component={ChatsPage} options={{ title: "Chats" }} />
            <TChat.Screen name="ChatPage" component={ChatPage} options={({ route, navigation }) => (
                {
                    title: route.params.name,
                    headerLeft: () => (
                        <IconButton
                            icon="ios-chevron-back-outline"
                            color={colors.pBeamBright}
                            brand="Ionicons"
                            size={36}
                            onPress={() => navigation.goBack()}
                        />
                    )
                }
               )}
            />
        </TChat.Navigator>
    );
    return (
        <NavigationContainer>
            <PrimaryNav />
        </NavigationContainer>
    );
}

export default navigation;