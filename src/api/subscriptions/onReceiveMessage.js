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

export const chatPage = /* GraphQL */ `
  subscription OnReceiveMessage($chatMessagesId: String) {
    onReceiveMessage(chatMessagesId: $chatMessagesId) {
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