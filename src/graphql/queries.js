/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getUser = /* GraphQL */ `
  query GetUser($id: ID!) {
    getUser(id: $id) {
      id
      profilePicture {
        bucket
        region
        loadFull
        thumbFull
        full
        loadSquare
        thumbSquare
        square
      }
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
        owner
        cognitoID
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
      location
      background {
        bucket
        region
        loadFull
        thumbFull
        full
        loadSquare
        thumbSquare
        square
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
        location
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
        owner
        cognitoID
        createdAt
        updatedAt
      }
      image {
        bucket
        region
        loadFull
        thumbFull
        full
        loadSquare
        thumbSquare
        square
      }
      createdAt
      updatedAt
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
        createdAt
        updatedAt
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
        location
        createdAt
        updatedAt
      }
      user {
        id
        owner
        cognitoID
        createdAt
        updatedAt
      }
      owner
      type
      Image {
        bucket
        region
        loadFull
        thumbFull
        full
        loadSquare
        thumbSquare
        square
      }
      content
      createdAt
      updatedAt
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
        owner
        type
        content
        createdAt
        updatedAt
        userMessagesId
        chatMessagesId
      }
      nextToken
    }
  }
`;
