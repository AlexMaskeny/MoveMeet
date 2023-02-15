export const empty = /* GraphQL */ `
    subscription OnMemberStatusChange($userID: String) {
        onMemberStatusChange(userID: $userID) {
        	id
        }
    }
`

export const chatsPage = /* GraphQL */ `
    subscription OnMemberStatusChange($userID: String) {
        onMemberStatusChange(userID: $userID) {
        	id
	        userID
	        status
        }
    }
`