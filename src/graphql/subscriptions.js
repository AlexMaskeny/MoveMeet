/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCreateUser = /* GraphQL */ `
  subscription OnCreateUser($owner: String) {
    onCreateUser(owner: $owner) {
      id
      username
      profilePicture {
        bucket
        region
        loadFull
        thumbFull
        full
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
      lat
      long
      createdAt
      updatedAt
    }
  }
`;
export const onUpdateUser = /* GraphQL */ `
  subscription OnUpdateUser($owner: String) {
    onUpdateUser(owner: $owner) {
      id
      username
      profilePicture {
        bucket
        region
        loadFull
        thumbFull
        full
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
      lat
      long
      createdAt
      updatedAt
    }
  }
`;
export const onDeleteUser = /* GraphQL */ `
  subscription OnDeleteUser($owner: String) {
    onDeleteUser(owner: $owner) {
      id
      username
      profilePicture {
        bucket
        region
        loadFull
        thumbFull
        full
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
      lat
      long
      createdAt
      updatedAt
    }
  }
`;
export const onCreateChat = /* GraphQL */ `
  subscription OnCreateChat($owner: String) {
    onCreateChat(owner: $owner) {
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
export const onUpdateChat = /* GraphQL */ `
  subscription OnUpdateChat($owner: String) {
    onUpdateChat(owner: $owner) {
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
export const onDeleteChat = /* GraphQL */ `
  subscription OnDeleteChat($owner: String) {
    onDeleteChat(owner: $owner) {
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
export const onCreatePost = /* GraphQL */ `
  subscription OnCreatePost($owner: String) {
    onCreatePost(owner: $owner) {
      id
      owner
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
      image {
        bucket
        region
        loadFull
        thumbFull
        full
      }
      lat
      long
      createdAt
      updatedAt
      userPostsId
    }
  }
`;
export const onUpdatePost = /* GraphQL */ `
  subscription OnUpdatePost($owner: String) {
    onUpdatePost(owner: $owner) {
      id
      owner
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
      image {
        bucket
        region
        loadFull
        thumbFull
        full
      }
      lat
      long
      createdAt
      updatedAt
      userPostsId
    }
  }
`;
export const onDeletePost = /* GraphQL */ `
  subscription OnDeletePost($owner: String) {
    onDeletePost(owner: $owner) {
      id
      owner
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
      image {
        bucket
        region
        loadFull
        thumbFull
        full
      }
      lat
      long
      createdAt
      updatedAt
      userPostsId
    }
  }
`;
export const onCreateMessage = /* GraphQL */ `
  subscription OnCreateMessage($owner: String) {
    onCreateMessage(owner: $owner) {
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
export const onUpdateMessage = /* GraphQL */ `
  subscription OnUpdateMessage($owner: String) {
    onUpdateMessage(owner: $owner) {
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
export const onDeleteMessage = /* GraphQL */ `
  subscription OnDeleteMessage($owner: String) {
    onDeleteMessage(owner: $owner) {
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
