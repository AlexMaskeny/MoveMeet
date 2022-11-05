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
      chat {
        id
        owner
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
      owner
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

export const getMessage = /* GraphQL */ `
  query GetMessage($id: ID!) {
    getMessage(id: $id) {
      id
      chat {
        id
        owner
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
      owner
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

export const getChat = /* GraphQL */ `
  query GetChat($id: ID!) {
    getChat(id: $id) {
      id
      owner
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
    $numMessages: Int
  ) {
    listChatsByLocation(latf1: $latf1, latf2: $latf2, lat: $lat, long: $long, long1: $long1, long2: $long2, long3: $long3, radius: $radius) {
      items {
        id
        lat
        long
        name
        owner
        type
        background {
            full
            loadFull
        }
        messages(limit: $numMessages) {
          items {
            index
            owner
            type
            content
          }
          nextToken
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