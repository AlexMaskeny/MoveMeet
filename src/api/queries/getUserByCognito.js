//LoadingPage
export const empty = /* GraphQL */ `
    query GetUserByCognito($id: String!) {
        getUserByCognito(id: $id) {
            id
        }
    }
`
//LoadingPage
export const least = /* GraphQL */ `
    query GetUserByCognito($id: String!) {
        getUserByCognito(id: $id) {
            id
            username
            allowNotifications
            bio
            name
            profilePicture {
                loadFull
                full
            }
            createdAt
        }
    }
`

//LoadingPage
export const oProfilePage = /* GraphQL */ `
    query GetUserByCognito($id: String!) {
        getUserByCognito(id: $id) {
            id
            username
            allowNotifications
            bio
            name
            profilePicture {
                loadFull
                full
            }
            friends {
                friendID
                status
                chatID
            }
            createdAt
        }
    }
`



export const full = /* GraphQL */ `
    query GetUserByCognito($id: String!) {
        getUserByCognito(id: $id) {
            id
            username
            loggedOut
            allowNotifications
            bio
            name
            friends {
                friendID
                status
                chatID
            }
            profilePicture {
                loadFull
                full
            }
            background {
                loadFull
                full
                enableColor
                color
            }
            posts {
                items {
                    id
                    lat
                    image {
                        full
                        loadFull
                    }
                    latf1
                    latf2
                    longf1
                    long
                    longf2
                    owner
                    createdAt
                    userPostsId
                }
            }
        }
    }
`;