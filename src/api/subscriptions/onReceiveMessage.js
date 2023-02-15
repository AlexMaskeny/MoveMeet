export const full = /* GraphQL */ `
  subscription OnReceiveMessage($chatMessagesId: String) {
    onReceiveMessage(chatMessagesId: $chatMessagesId) {
        id
        chatMessagesId
        read
        user {
          id
          username
          friends {
             friendID
             status
          }
          profilePicture {
            bucket
            region
            loadFull
            full
          }
        }
        createdAt
        updatedAt
        image {
          bucket
          region
          loadFull
          full
        }
        content
        type
    }
  }
`;

export const chatsPage = /* GraphQL */ `
  subscription OnReceiveMessage($chatMessagesId: String) {
    onReceiveMessage(chatMessagesId: $chatMessagesId) {
        id
        chatMessagesId
        read
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
        createdAt
        updatedAt
        content
        type
    }
  }
`;