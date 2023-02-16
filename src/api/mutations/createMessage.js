export const full = /* GraphQL */ `
  mutation CreateMessage(
    $input: CreateMessageInput!
    $condition: ModelMessageConditionInput
  ) {
    createMessage(input: $input, condition: $condition) {
        id
        chatMessagesId
        read
        user {
          id
          username
          profilePicture {
            loadFull
            full
          }
        }
        createdAt
        updatedAt
        image {
          loadFull
          full
        }
        content
        type
    }
  }
`;