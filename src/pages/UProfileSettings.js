import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Auth } from 'aws-amplify';

import { colors, debug } from '../config';
import BeamTitle from '../comps/BeamTitle';
import SimpleButton from '../comps/SimpleButton';
import Screen from '../comps/Screen';

function UProfileSettings({ navigation }) {
    const [username, setUsername] = React.useState("");
    const [email, setEmail] = React.useState("");

    //REQUIRES: internet connection, connected user
    //MODIFIES: none
    //EFFECTS:  gathers user data and gives a short summary
    React.useEffect(() => {
        const initialFunction = async () => {
            try {
                if (debug) console.log("[UProfileSettings] Fetching User Data...");
                const currentUser = await Auth.currentUserInfo();
                if (currentUser) {
                    setUsername(currentUser.username);
                    setEmail(currentUser.attributes.email);
                }
            } catch (error) {
                if (debug) console.log(error);
            }
        }
        initialFunction();
    }, []);

    //REQUIRES: internet connection, connected user
    //MODIFIES: logs user out
    //EFFECTS:  none
    const logout = async () => {
        try {
            await Auth.signOut();
            if (debug) console.log("Signed User Out");
            navigation.navigate("LoginPage");
        } catch (error) {
            if (debug) console.log(error);
        }
    }
    return (
        <Screen innerStyle={styles.page}>
            <BeamTitle>{username}</BeamTitle>
            <BeamTitle>{email}</BeamTitle>
            <SimpleButton title="Sign Out" onPress={logout} />
        </Screen>
    );
}

const styles = StyleSheet.create({
    page: {
        justifyContent: "center"
	}
})

export default UProfileSettings;