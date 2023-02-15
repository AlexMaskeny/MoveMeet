
export const empty = /* GraphQL */ `
    query GetChat($id: ID!) {
        getChat(id: $id) {
            id
        }
    }
`;

export const loadingPage = /* GraphQL */ `
    query GetChat($id: ID!) {
        getChat(id: $id) {
            id
            members {
                items {
                    id
                    user {
                        id
                    }
                }
            }
            createdAt

        }
    }
`;
export const full = /* GraphQL */ `
    query GetChat($id: ID!) {
        getChat(id: $id) {
            id
            name
            lat
            long
            background {
                bucket
                region
                loadFull
                full
            }
            messages {
                items {
                    id
                    type
                    content
                    index
                }
                nextToken
            }
            members {
                items {
                    id
                    user {
                        id
                        name
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
`;