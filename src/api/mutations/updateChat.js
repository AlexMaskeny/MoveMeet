export const empty = /* GraphQL */ `
    mutation UpdateChat(
        $input: UpdateChatInput!
        $condition: ModelChatConditionInput
    ) {
        updateChat(input: $input, condition: $condition) {
            id
        }
    }
`;