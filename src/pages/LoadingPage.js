import React from 'react';
import { StyleSheet, Image, ActivityIndicator, View } from 'react-native';
import { colors, debug } from '../config';
import { Auth } from 'aws-amplify';

import Screen from '../comps/Screen';

function LoadingPage({navigation}) {
    //REQUIRES: this page was navigated to by the initial Primary Navigator
    //MODIFIES: none
    //EFFECTS: attains data from database and triggers an inner function
    //         that will redirect user to appropriate page upon profile
    //         data attainment
    React.useEffect(() => {
        const initialFunction = async () => {
            if (debug) console.log("Initiating...");
            //Get data during this interval
            setTimeout(async function () {
                try {
                    const currentUser = await Auth.currentAuthenticatedUser();
                    if (currentUser) {
                        //if (debug) console.log(currentUser);
                        navigation.navigate("SecondaryNav");
                    }
                } catch (error) {
                    if (debug) console.log(error);
                    if (error == "The user is not authenticated") {
                        navigation.navigate("LoginPage");
					}
			    }
            }, 20);
        }
        initialFunction();
    }, []);

    return (
        <Screen innerStyle={styles.page}>
            <Image
                source={require('../../assets/Logo.png')}
                style={styles.logo}
                resizeMode="contain"
            />
            <View height={20}/>
            <ActivityIndicator size='large' color={colors.pBeam} />
        </Screen>
    );
}

const styles = StyleSheet.create({
    logo: {
        height: 60,
        width: "100%"
    },
    page: {
        justifyContent: "center"
	}
})

export default LoadingPage;