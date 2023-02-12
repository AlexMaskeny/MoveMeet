export const empty = /* GraphQL */ `
    mutation CreateChatMembers(
        $input: CreateChatMembersInput!
        $condition: ModelChatMembersConditionInput
    ) {
        createChatMembers(input: $input, condition: $condition) {
            id
        }
    }
`;

export const background = /* GraphQL */ `
    mutation CreateChatMembers(
        $input: CreateChatMembersInput!
        $condition: ModelChatMembersConditionInput
    ) {
        createChatMembers(input: $input, condition: $condition) {
            id
            userID
        }
    }
`

export const full = /* GraphQL */ `
    mutation CreateChatMembers(
        $input: CreateChatMembersInput!
        $condition: ModelChatMembersConditionInput
    ) {
        createChatMembers(input: $input, condition: $condition) {
            id
            userID
            chatID
            user {
                id
                username
                cognitoID
                lat
                long
                latf1
                longf1
                latf2
                longf2
                createdAt
                updatedAt
            }
            chat {
                id
                name
                type
                lat
                long
                latf1
                longf1
                latf2
                longf2
                createdAt
                updatedAt
            }
            createdAt
            updatedAt
            owner
        }
    }
`;