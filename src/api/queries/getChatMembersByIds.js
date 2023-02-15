export const empty = /* GraphQL */ `
    query GetChatMembersByIds($userID: String!) {
        getChatMembersByIds(userID: $userID) {
            items {
                id
            }
        }
    }

`

export const loadingPage = /* GraphQL */ `
    query GetChatMembersByIds($userID: String!) {
        getChatMembersByIds(userID: $userID) {
            items {
                chatID
                chat {
                    private            
                }
                id
            }
        }
    }

`