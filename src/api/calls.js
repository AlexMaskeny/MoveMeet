export const createUser = /* GraphQL */ `
  mutation CreateUser(
    $input: CreateUserInput!
    $condition: ModelUserConditionInput
  ) {
    createUser(input: $input, condition: $condition) {
      id
    }
  }
`;

export const updateUser = /* GraphQL */ `
  mutation UpdateUser(
    $input: UpdateUserInput!
    $condition: ModelUserConditionInput
  ) {
    updateUser(input: $input, condition: $condition) {
      id
    }
  }
`;

export const updateMessage = /* GraphQL */ `
  mutation UpdateMessage(
    $input: UpdateMessageInput!
    $condition: ModelMessageConditionInput
  ) {
    updateMessage(input: $input, condition: $condition) {
      id
    }
  }
`;

export const createChat = /* GraphQL */ `
  mutation CreateChat(
    $input: CreateChatInput!
    $condition: ModelChatConditionInput
  ) {
    createChat(input: $input, condition: $condition) {
      id
    }
  }
`;
export const updateChat = /* GraphQL */ `
  mutation UpdateChat(
    $input: UpdateChatInput!
    $condition: ModelChatConditionInput
  ) {
    updateChat(input: $input, condition: $condition) {
      id
      

    }
  }
`;
export const createMessage = /* GraphQL */ `
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
          thumbFull
          full
        }
        content
        type
    }
  }
`;

export const getMessage = /* GraphQL */ `
  query GetMessage($id: ID!) {
    getMessage(id: $id) {
      id
      chat {
        id
        name
        type
        lat
        long
        createdAt
        updatedAt
      }
      user {
        id
        username
        owner
        cognitoID
        lat
        long
        createdAt
        updatedAt
      }
      type
      image {
        bucket
        region
        loadFull
        thumbFull
        full
      }
      index
      content
      createdAt
      updatedAt
      userMessagesId
      chatMessagesId
    }
  }
`;

export const getUserChats = /* GraphQL */ `
  query GetUserChats($id: ID!) {
    getUser(id: $id) {
        id
        chats {
            items {
                chat {
                    id
                    name
                    private
                    lat
                    long
                    background {
                        bucket
                        region
                        loadFull
                        thumbFull
                        full
                    }
                    messages {
                        items {
                            id
                            type
                            content
                            index
                            user {
                                id
                                username
                                profilePicture {
                                    full
                                    loadFull
                                }
                            }
                        }
                        nextToken
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

export const getChat = /* GraphQL */ `
  query GetChat($id: ID!) {
    getChat(id: $id) {
      id
      name
      type
      lat
      long
      background {
        bucket
        region
        loadFull
        thumbFull
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
          }
        }
      }
      createdAt
      updatedAt
    }
  }
`;

export const listChats = /* GraphQL */ `
  query ListChats(
    $filter: ModelChatFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listChats(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        lat
        long
      }
      nextToken
    }
  }
`;

export const listChatsByLocation = /* GraphQL */ `
  query ListChatsByLocation(
    $lat: String
    $long: String
    $latf1: String
    $latf2: String
    $long1: String
    $long2: String
    $long3: String
    $radius: Int
  ) {
    listChatsByLocation(latf1: $latf1, latf2: $latf2, lat: $lat, long: $long, long1: $long1, long2: $long2, long3: $long3, radius: $radius) {
      items {
        id
        lat
        long
        createdAt
        name
        type
        members {
            items {
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
        background {
            full
            loadFull
        }
      }
    }
  }
`;

export const listUsersByLocation = /* GraphQL */ `
  query ListUsersByLocation(
    $lat: String
    $long: String
    $latf1: String
    $latf2: String
    $long1: String
    $long2: String
    $long3: String
    $radius: Int
  ) {
    listUsersByLocation(latf1: $latf1, latf2: $latf2, lat: $lat, long: $long, long1: $long1, long2: $long2, long3: $long3, radius: $radius) {
      items {
        id
        lat
        long
        username
        profilePicture {
            full
            loadFull
        }
      }
    }
  }
`;

export const listUsers = /* GraphQL */ `
  query ListUsers(
    $filter: ModelUserFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listUsers(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        username
      }
    }
  }
`;

export const createChatMembers = /* GraphQL */ `
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

export const getUserByCognito = /* GraphQL */ `
  query GetUserByCognito($id: String!) {
    getUserByCognito(id: $id) {
      id
      username
      allowNotifications
      profilePicture {
        bucket
        region
        loadFull
        thumbFull
        full
      }
    }
  }
`;

export const listMessagesByTime = /* GraphQL */ `
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
              thumbFull
            }
            content
            type
        }
        nextToken
      }
    }

`

export const getLatestMessagesByTime = /* GraphQL */ `
    query ListMessagesByTime (
        $chatMessagesId: String!, 
        $limit: Int,
    ) {
      listMessagesByTime(limit: $limit, chatMessagesId: $chatMessagesId) {
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
              thumbFull
            }
            content
            type
        }
      }
    }

`

export const getUser = /* GraphQL */ `
  query GetUser($id: ID!) {
    getUser(id: $id) {
      username
      profilePicture {
        loadFull
      }
    }
  }
`;

export const onReceiveMessage = /* GraphQL */ `
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
        image {
          bucket
          region
          loadFull
          thumbFull
          full
        }
        content
        type
    }
  }
`;

export const onMemberStatusChange = /* GraphQL */ `
    subscription OnMemberStatusChange($userID: String) {
        onMemberStatusChange(userID: $userID) {
        	id
	        userID
	        status

            
        }
    }
`

export const onUserTyping = /* GraphQL */ `
    subscription OnUserTyping($chatID: String) {
        onUserTyping(chatID: $chatID) {
        	id
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
	        status

            
        }
    }
`

export const updateTyping = /* GraphQL */ `
  mutation updateChatMembers(
    $input: UpdateChatMembersInput!
    $condition: ModelChatMembersConditionInput
  ) {
    updateChatMembers(input: $input, condition: $condition) {
        id
        chatID
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
	    status
      }
    }

`

export const onUserRemoved = /* GraphQL */ `
    subscription OnUserRemoved($chatID: String, $userID: String) {
        onUserRemoved(chatID: $chatID, userID: $userID) {
        	id
        }
    }
`

export const getMemberStatuses = /* GraphQL */ `
  query GetMemberStatuses($ChatID: ID!) {
    getChat(id: $ChatID) {
      members {
        items {
        id
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
	    status
        }
      }
    }
  }
`;