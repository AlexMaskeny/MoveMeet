import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

import { colors, footerHeight } from './config';
import LoadingPage from './pages/LoadingPage';
import LoginPage from './pages/LoginPage';
import ChatsPage from './pages/ChatsPage';
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
    const Secondary = createBottomTabNavigator();
    const SecondaryNav = () => (
        <Secondary.Navigator
            screenOptions={{
                headerShown: false,
                activeTintColor: colors.pBeam,
                inactiveTintColor: colors.text2,
                tabBarShowLabel: false,
                tabBarStyle: {
                    height: footerHeight,
                    backgroundColor: colors.container,
                }
            }}
        >
            <Secondary.Screen
                name="TChatNav"
                component={TChatNav}
                options={({ navigation }) => (
                    {
                        tabBarIcon: ({ color }) =>
                            <IconButton
                                icon="md-chatbubble-ellipses"
                                color={color}
                                brand="Ionicons"
                                size={36}
                                onPress={() => navigation.navigate("TChatNav")}
                            />
                    }
                )}
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
                
            }}
        >
            <TChat.Screen name="ChatsPage" component={ChatsPage} />
            <TChat.Screen name="ChatPage" component={ChatsPage} />
        </TChat.Navigator>
    );
    return (
        <NavigationContainer>
            <PrimaryNav />
        </NavigationContainer>
    );
}

export default navigation;