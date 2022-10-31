import React from 'react';
import { StyleSheet, Image, ActivityIndicator, View } from 'react-native';

import { colors, debug } from '../config';
import Screen from '../comps/Screen';
import Chat from '../comps/Chat';
import DisabledChat from '../comps/DisabledChat';

//DESCRIPTION: A primary page of the SecondaryNav
//             is the hub for all localized chats

//REMOVE ON PRODUCTON [START]
//!!!!!!
//!!!!!!
//!!!!!!
const testMembers = [
    {
        id: "1",
        username: "alexander",
        ppic: {
            uri: 'https://cbeyondata.com/wp-content/uploads/2020/10/iStock-1237546531-1920x1280.jpg',
            loadImage: 'https://th.bing.com/th/id/R.4ef44de48283a70c345215439710e076?rik=DbmjSu8b4rFcmQ&riu=http%3a%2f%2fwww.kneson.com%2fnews%2fIII3%2fKELSEY_AD_example1.jpg&ehk=5jg5ZditRXiSNMQ9tGa0nhrMY8OnQBmFdvwW%2f%2bGfiCU%3d&risl=&pid=ImgRaw&r=0',
            key: "testMembers1",
        }
    },
    {
        id: "2",
        username: "alex",
        ppic: {
            uri: 'https://cbeyondata.com/wp-content/uploads/2020/10/iStock-1237546531-1920x1280.jpg',
            loadImage: 'https://th.bing.com/th/id/R.4ef44de48283a70c345215439710e076?rik=DbmjSu8b4rFcmQ&riu=http%3a%2f%2fwww.kneson.com%2fnews%2fIII3%2fKELSEY_AD_example1.jpg&ehk=5jg5ZditRXiSNMQ9tGa0nhrMY8OnQBmFdvwW%2f%2bGfiCU%3d&risl=&pid=ImgRaw&r=0',
            key: "testMembers2",
        }
    },
    {
        id: "3",
        username: "grace",
        ppic: {
            uri: 'https://cbeyondata.com/wp-content/uploads/2020/10/iStock-1237546531-1920x1280.jpg',
            loadImage: 'https://th.bing.com/th/id/R.4ef44de48283a70c345215439710e076?rik=DbmjSu8b4rFcmQ&riu=http%3a%2f%2fwww.kneson.com%2fnews%2fIII3%2fKELSEY_AD_example1.jpg&ehk=5jg5ZditRXiSNMQ9tGa0nhrMY8OnQBmFdvwW%2f%2bGfiCU%3d&risl=&pid=ImgRaw&r=0',
            key: "testMembers3",
        }
    },
    {
        id: "4",
        username: "Grace Suber",
        ppic: {
            uri: 'https://cbeyondata.com/wp-content/uploads/2020/10/iStock-1237546531-1920x1280.jpg',
            loadImage: 'https://th.bing.com/th/id/R.4ef44de48283a70c345215439710e076?rik=DbmjSu8b4rFcmQ&riu=http%3a%2f%2fwww.kneson.com%2fnews%2fIII3%2fKELSEY_AD_example1.jpg&ehk=5jg5ZditRXiSNMQ9tGa0nhrMY8OnQBmFdvwW%2f%2bGfiCU%3d&risl=&pid=ImgRaw&r=0',
            key: "testMembers4",
        }
    },
    {
        id: "5",
        username: "Augustus",
        ppic: {
            uri: 'https://cbeyondata.com/wp-content/uploads/2020/10/iStock-1237546531-1920x1280.jpg',
            loadImage: 'https://th.bing.com/th/id/R.4ef44de48283a70c345215439710e076?rik=DbmjSu8b4rFcmQ&riu=http%3a%2f%2fwww.kneson.com%2fnews%2fIII3%2fKELSEY_AD_example1.jpg&ehk=5jg5ZditRXiSNMQ9tGa0nhrMY8OnQBmFdvwW%2f%2bGfiCU%3d&risl=&pid=ImgRaw&r=0',
            key: "testMembers5",
        }
    },
    {
        id: "6",
        username: "Augustus",
        ppic: {
            uri: 'https://cbeyondata.com/wp-content/uploads/2020/10/iStock-1237546531-1920x1280.jpg',
            loadImage: 'https://th.bing.com/th/id/R.4ef44de48283a70c345215439710e076?rik=DbmjSu8b4rFcmQ&riu=http%3a%2f%2fwww.kneson.com%2fnews%2fIII3%2fKELSEY_AD_example1.jpg&ehk=5jg5ZditRXiSNMQ9tGa0nhrMY8OnQBmFdvwW%2f%2bGfiCU%3d&risl=&pid=ImgRaw&r=0',
            key: "testMembers6",
        }
    },
    {
        id: "7",
        username: "alexander",
        ppic: {
            uri: 'https://cbeyondata.com/wp-content/uploads/2020/10/iStock-1237546531-1920x1280.jpg',
            loadImage: 'https://th.bing.com/th/id/R.4ef44de48283a70c345215439710e076?rik=DbmjSu8b4rFcmQ&riu=http%3a%2f%2fwww.kneson.com%2fnews%2fIII3%2fKELSEY_AD_example1.jpg&ehk=5jg5ZditRXiSNMQ9tGa0nhrMY8OnQBmFdvwW%2f%2bGfiCU%3d&risl=&pid=ImgRaw&r=0',
            key: "testMembers7",
        }
    },
    {
        id: "8",
        username: "alex",
        ppic: {
            uri: 'https://cbeyondata.com/wp-content/uploads/2020/10/iStock-1237546531-1920x1280.jpg',
            loadImage: 'https://th.bing.com/th/id/R.4ef44de48283a70c345215439710e076?rik=DbmjSu8b4rFcmQ&riu=http%3a%2f%2fwww.kneson.com%2fnews%2fIII3%2fKELSEY_AD_example1.jpg&ehk=5jg5ZditRXiSNMQ9tGa0nhrMY8OnQBmFdvwW%2f%2bGfiCU%3d&risl=&pid=ImgRaw&r=0',
            key: "testMembers8",
        }
    },
    {
        id: "9",
        username: "grace",
        ppic: {
            uri: 'https://cbeyondata.com/wp-content/uploads/2020/10/iStock-1237546531-1920x1280.jpg',
            loadImage: 'https://th.bing.com/th/id/R.4ef44de48283a70c345215439710e076?rik=DbmjSu8b4rFcmQ&riu=http%3a%2f%2fwww.kneson.com%2fnews%2fIII3%2fKELSEY_AD_example1.jpg&ehk=5jg5ZditRXiSNMQ9tGa0nhrMY8OnQBmFdvwW%2f%2bGfiCU%3d&risl=&pid=ImgRaw&r=0',
            key: "testMembers9",
        }
    }, {
        id: "10",
        username: "Grace Suber",
        ppic: {
            uri: 'https://cbeyondata.com/wp-content/uploads/2020/10/iStock-1237546531-1920x1280.jpg',
            loadImage: 'https://th.bing.com/th/id/R.4ef44de48283a70c345215439710e076?rik=DbmjSu8b4rFcmQ&riu=http%3a%2f%2fwww.kneson.com%2fnews%2fIII3%2fKELSEY_AD_example1.jpg&ehk=5jg5ZditRXiSNMQ9tGa0nhrMY8OnQBmFdvwW%2f%2bGfiCU%3d&risl=&pid=ImgRaw&r=0',
            key: "testMembers10",
        }
    },
    {
        id: "11",
        username: "Augustus",
        ppic: {
            uri: 'https://cbeyondata.com/wp-content/uploads/2020/10/iStock-1237546531-1920x1280.jpg',
            loadImage: 'https://th.bing.com/th/id/R.4ef44de48283a70c345215439710e076?rik=DbmjSu8b4rFcmQ&riu=http%3a%2f%2fwww.kneson.com%2fnews%2fIII3%2fKELSEY_AD_example1.jpg&ehk=5jg5ZditRXiSNMQ9tGa0nhrMY8OnQBmFdvwW%2f%2bGfiCU%3d&risl=&pid=ImgRaw&r=0',
            key: "testMembers11",
        }
    },
    {
        id: "12",
        username: "Augustus",
        ppic: {
            uri: 'https://cbeyondata.com/wp-content/uploads/2020/10/iStock-1237546531-1920x1280.jpg',
            loadImage: 'https://th.bing.com/th/id/R.4ef44de48283a70c345215439710e076?rik=DbmjSu8b4rFcmQ&riu=http%3a%2f%2fwww.kneson.com%2fnews%2fIII3%2fKELSEY_AD_example1.jpg&ehk=5jg5ZditRXiSNMQ9tGa0nhrMY8OnQBmFdvwW%2f%2bGfiCU%3d&risl=&pid=ImgRaw&r=0',
            key: "testMembers12",
        }
    },
]
//!!!!!!
//!!!!!!
//!!!!!!
//REMOVE ON PRODUCTON [END]

function ChatsPage({ navigation, route }) {
    return (
        <>
            <Screen innerStyle={styles.page}>
                <Chat
                    background={{
                        uri: 'https://cbeyondata.com/wp-content/uploads/2020/10/iStock-1237546531-1920x1280.jpg',
                        loadImage: 'https://th.bing.com/th/id/R.4ef44de48283a70c345215439710e076?rik=DbmjSu8b4rFcmQ&riu=http%3a%2f%2fwww.kneson.com%2fnews%2fIII3%2fKELSEY_AD_example1.jpg&ehk=5jg5ZditRXiSNMQ9tGa0nhrMY8OnQBmFdvwW%2f%2bGfiCU%3d&risl=&pid=ImgRaw&r=0',
                        key: "background1",
                    }}
                    members={testMembers}
                    title="Mega Chat"
                    created="10/16/2022"
                    navigation={navigation}
                    onEndReached={()=>console.log("end")}
                />
                <DisabledChat
                    background={{
                        uri: 'https://cbeyondata.com/wp-content/uploads/2020/10/iStock-1237546531-1920x1280.jpg',
                        loadImage: 'https://th.bing.com/th/id/R.4ef44de48283a70c345215439710e076?rik=DbmjSu8b4rFcmQ&riu=http%3a%2f%2fwww.kneson.com%2fnews%2fIII3%2fKELSEY_AD_example1.jpg&ehk=5jg5ZditRXiSNMQ9tGa0nhrMY8OnQBmFdvwW%2f%2bGfiCU%3d&risl=&pid=ImgRaw&r=0',
                        key: 'background2'
                    }}
                    title="Mega Chat"
                    members={testMembers}
                />
                {/*<SimpleButton onPress={() => navigation.navigate("ChatPage",{ name: "Mega Chat" })} title="Navigate" />*/}
            </Screen>
        </>
    );
}

const styles = StyleSheet.create({
    logo: {
        height: 60,
        width: "100%"
    },
    page: {
        padding: 14,
    },
    header: {
        backgroundColor: colors.container,
        height: 100,
    },
})

export default ChatsPage;