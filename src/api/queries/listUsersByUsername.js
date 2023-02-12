export const least = /* GraphQL */ `
    query ListUsersByUsername($username: String!) {
        listUsersByUsername(username: $username) {  
            items {
                id
                username
                bio
                name
                profilePicture {
                    bucket
                    region
                    loadFull
                    full
                }
            }
        }
    }
`;