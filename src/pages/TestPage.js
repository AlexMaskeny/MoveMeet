import React from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { API, Auth, graphqlOperation, Storage } from 'aws-amplify';

import { colors, debug } from '../config';
import { createUser } from '../api/calls';
import BeamTitle from '../comps/BeamTitle';
import SimpleButton from '../comps/SimpleButton';
import Screen from '../comps/Screen';

function TestScreen({ navigation }) {
    const [image, setImage] = React.useState("https://www.tamiu.edu/newsinfo/images/student-life/campus-scenery.JPG");

    React.useEffect(() => {
        const initialFunction = async () => {
            try {
                
            } catch (error) {
                if (debug) console.log(error);
            }
        }
        initialFunction();
    }, []);

    const test = async () => {
        console.log("Test");
        const result = await Storage.get("Alexander.jpg");
        const user = await Auth.currentUserInfo();
        console.log(user.id);
        setImage(result);
        const newUser = await API.graphql(graphqlOperation(createUser, {
            input: {
                profilePicture: {
                    full: image,
                    bucket: "proxychatf2d762e9bc784204880374b0ca905be4120629-dev",
                    region: "us-east-2",
                },
                cognitoID: user.id,
            }
        }))

        //console.log(result);
    };
    return (
        <Screen innerStyle={styles.page}>
            <BeamTitle>Alexander</BeamTitle>
            <Image source={{ uri: image }} style={{width: 200, height: 200} }/>
            <SimpleButton title="Test" onPress={()=>test()} />
        </Screen>
    );
}

const styles = StyleSheet.create({
    page: {
        justifyContent: "center"
	}
})

export default TestScreen;