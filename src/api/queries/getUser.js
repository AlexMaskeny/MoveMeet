//LoadingPage
export const empty = /* GraphQL */ `
    query GetUser($id: ID!) {
        getUser(id: $id) {
            id
        }
    }
`
export const username = /* GraphQL */ `
    query GetUser($id: ID!) {
        getUser(id: $id) {
            id
            username
        }
    }
`
//LoadingPage
export const least = /* GraphQL */ `
    query GetUser($id: ID!) {
        getUser(id: $id) {
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

export const friends = /* GraphQL */ `
  query GetUserFriends($id: ID!) {
    getUser(id: $id) {
        friends {
            friendID
            status
            chatID
        }
    }
  }
`

export const chatsFull = /* GraphQL */ `
    query GetUserChats($id: ID!) {
        getUser(id: $id) {
            id
            chats {
                items {
                    chat {
                        id
                        name
                        creator
                        private
                        enabled
                        lat
                        long
                        background {
                            loadFull
                            full
                            color
                            enableColor
                        }
                        members {
                            items {
                                id
                                user {
                                    id
                                    username
                                    profilePicture {
                                        full
                                        loadFull
                                    }   
                                 }  
                             }
                        }
                        createdAt
                        updatedAt
                    }
                }
            }
        }
    }
`

export const createChat = /* GraphQL */ `
    query GetUserChats($id: ID!) {
        getUser(id: $id) {
            id
            chats {
                items {
                    chat {
                        id
                        creator
                        private
                        enabled
                        createdAt
                        updatedAt
                    }
                }
            }
        }
    }
`

//LoadingPage
export const userBroadcasts = /* GraphQL */ `
    query GetUser($id: ID!) {
        getUser(id: $id) {
            broadcasts
        }
    }
`

export const full = /* GraphQL */ `
    query GetUser($id: ID!) {
        getUser(id: $id) {
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
                    createdAt
                    userPostsId
                }
            }
        }
    }
`;