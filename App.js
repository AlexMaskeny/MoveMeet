import react from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { withAuthenticator } from 'aws-amplify-react-native';
import { Amplify } from 'aws-amplify';
import awsconfig from './src/aws-exports';
import * as Notifications from 'expo-notifications';

import Navigation from './src/navigation';
//[Current Build] alpha 0.0.1

/*Plan of attack for alpha 0.0.2
 * ##### CHATS PAGE #####
 * Instead of doing a location check, get all chats you're a member of and their distance. (Location updates should occur in the background)
 * Subscribe to every chat you're part of on create so that you can have real time updates on page.
 * Ensure you subscribe to new chats and unsubscribe from old. Resubscribe regularly to avoid expiration.
 * Create a glowly outline when you have an unread message
 * Sort by most recent activity
 * ALGORITHM: Real time data is handled locally. Keep out of range chats around for a period of time using expiry async storage
 *            Update your location every 20 seconds in database
 *            Database adds you as a member to these chats/removes you if not already removed
 *            Refresh auto does this and resets timer
 *            
 * ##### BACKEND #####
 * Users don't seem to be being added to user group on create
 * ##### CHAT PAGE ######
 * Swiping down on keyboard
 * Incorperate typing, but not presence 
 * The loading indicator isn't great
 * Show when a user enter / leaves
 * Fix the annoying initial alert for disconnected
 * If chats >= 1 hour apart split them
 * Make messages copiable
 * Make images saveable via hold
 * When u send a regular chat after image everything breaks due to merging. Fix.
 * ##### IMAGE PREVIEW #####
 * Use react-native-image-viewer to allow zoomablity and scrollability
 * Use gesture control to swipe out off preview (a downward AND upward swipe)
 * Use thumbnail on image preview or use a cached image and loading indicator
 * Show user's name and ppic via a safe area view/shadow. No exit button but have a share icon
*/

//Alpha 0.0.3 will incorperate private messaging

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
    }),
});

Amplify.configure(awsconfig);



export default function App() {
    return (
        <Navigation />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
});
