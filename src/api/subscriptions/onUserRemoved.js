export const empty = /* GraphQL */ `
    subscription OnUserRemoved($chatID: String, $userID: String) {
        onUserRemoved(chatID: $chatID, userID: $userID) {
        	id
        }
    }
`