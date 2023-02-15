export const empty = /* GraphQL */ `
    query ListMessagesByTime (
        $chatMessagesId: String!, 
        $limit: Int,
        $nextToken: String
    ) {
      listMessagesByTime(limit: $limit, chatMessagesId: $chatMessagesId, nextToken: $nextToken) {
        items {
            id
        }
        nextToken
      }
    }

`

export const settingsChat = /* GraphQL */ `
    query ListMessagesByTime (
        $chatMessagesId: String!, 
        $limit: Int,
        $nextToken: String
    ) {
      listMessagesByTime(limit: $limit, chatMessagesId: $chatMessagesId, nextToken: $nextToken) {
        items {
            id
            read
            
            createdAt
        }
        nextToken
      }
    }

`

export const createChat = /* GraphQL */ `
    query ListMessagesByTime (
        $chatMessagesId: String!, 
        $limit: Int,
        $nextToken: String
    ) {
      listMessagesByTime(limit: $limit, chatMessagesId: $chatMessagesId, nextToken: $nextToken) {
        items {
            id
            createdAt
        }
        nextToken
      }
    }

`

export const chatsPage = /* GraphQL */ `
    query ListMessagesByTime (
        $chatMessagesId: String!, 
        $limit: Int,
        $nextToken: String
    ) {
      listMessagesByTime(limit: $limit, chatMessagesId: $chatMessagesId, nextToken: $nextToken) {
        items {
            id
            read
            chatMessagesId
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
        nextToken
      }
    }

`

export const full = /* GraphQL */ `
    query ListMessagesByTime (
        $chatMessagesId: String!, 
        $limit: Int,
        $nextToken: String
    ) {
      listMessagesByTime(limit: $limit, chatMessagesId: $chatMessagesId, nextToken: $nextToken) {
        items {
            id
            read
            chatMessagesId
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
            image {
              bucket
              region
              loadFull
              full
            }
            content
            type
        }
        nextToken
      }
    }

`