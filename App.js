import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { withAuthenticator } from 'aws-amplify-react-native';
import { Amplify } from 'aws-amplify';

import awsconfig from './src/aws-exports';

Amplify.configure(awsconfig)

export default withAuthenticator(function App() {
  return (
    <View style={styles.container}>
      <Text>Open up App.js to start working on your app!</Text>
          <StatusBar style="auto" />
          <Text>Alex Maskeny</Text>
    </View>
  );
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
