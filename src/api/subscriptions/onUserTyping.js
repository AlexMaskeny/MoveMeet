export const full = /* GraphQL */ `
    subscription OnUserTyping($chatID: String) {
        onUserTyping(chatID: $chatID) {
        	id
            user {
              id
              username
              profilePicture {
                bucket
                region
                loadFull
                full
              }
            }
	        status

            
        }
    }
`