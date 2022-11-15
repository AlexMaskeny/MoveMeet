/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getUser = /* GraphQL */ `
  query GetUser($id: ID!) {
    getUser(id: $id) {
      id
      username
      bio
      expoToken
      email
      profilePicture {
        bucket
        region
        loadFull
        thumbFull
        full
      }
      allowNotifications
      owner
      cognitoID
      posts {
        nextToken
      }
      friends {
        friendID
        status
        chatID
      }
      messages {
        nextToken
      }
      chats {
        nextToken
      }
      lat
      long
      latf1
      longf1
      latf2
      longf2
      createdAt
      updatedAt
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
        bio
        expoToken
        email
        allowNotifications
        owner
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
      nextToken
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
      members {
        nextToken
      }
      long
      latf1
      longf1
      latf2
      longf2
      background {
        bucket
        region
        loadFull
        thumbFull
        full
      }
      messages {
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
        owner
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
      nextToken
    }
  }
`;
export const getPost = /* GraphQL */ `
  query GetPost($id: ID!) {
    getPost(id: $id) {
      id
      owner
      user {
        id
        username
        bio
        expoToken
        email
        allowNotifications
        owner
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
      image {
        bucket
        region
        loadFull
        thumbFull
        full
      }
      lat
      createdAt
      updatedAt
      long
      latf1
      longf1
      latf2
      longf2
      userPostsId
    }
  }
`;
export const listPosts = /* GraphQL */ `
  query ListPosts(
    $filter: ModelPostFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listPosts(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        owner
        lat
        createdAt
        updatedAt
        long
        latf1
        longf1
        latf2
        longf2
        userPostsId
      }
      nextToken
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
        latf1
        longf1
        latf2
        longf2
        createdAt
        updatedAt
      }
      user {
        id
        username
        bio
        expoToken
        email
        allowNotifications
        owner
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
      createdAt
      updatedAt
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
      userMessagesId
      chatMessagesId
    }
  }
`;
export const listMessages = /* GraphQL */ `
  query ListMessages(
    $filter: ModelMessageFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listMessages(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        createdAt
        updatedAt
        owner
        type
        index
        content
        userMessagesId
        chatMessagesId
      }
      nextToken
    }
  }
`;
export const getChatMembers = /* GraphQL */ `
  query GetChatMembers($id: ID!) {
    getChatMembers(id: $id) {
      id
      userID
      chatID
      user {
        id
        username
        bio
        expoToken
        email
        allowNotifications
        owner
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
        owner
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
export const listChatMembers = /* GraphQL */ `
  query ListChatMembers(
    $filter: ModelChatMembersFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listChatMembers(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        userID
        chatID
        createdAt
        updatedAt
        owner
      }
      nextToken
    }
  }
`;
