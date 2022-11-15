/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createUser = /* GraphQL */ `
  mutation CreateUser(
    $input: CreateUserInput!
    $condition: ModelUserConditionInput
  ) {
    createUser(input: $input, condition: $condition) {
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
export const updateUser = /* GraphQL */ `
  mutation UpdateUser(
    $input: UpdateUserInput!
    $condition: ModelUserConditionInput
  ) {
    updateUser(input: $input, condition: $condition) {
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
export const deleteUser = /* GraphQL */ `
  mutation DeleteUser(
    $input: DeleteUserInput!
    $condition: ModelUserConditionInput
  ) {
    deleteUser(input: $input, condition: $condition) {
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
export const createChat = /* GraphQL */ `
  mutation CreateChat(
    $input: CreateChatInput!
    $condition: ModelChatConditionInput
  ) {
    createChat(input: $input, condition: $condition) {
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
export const updateChat = /* GraphQL */ `
  mutation UpdateChat(
    $input: UpdateChatInput!
    $condition: ModelChatConditionInput
  ) {
    updateChat(input: $input, condition: $condition) {
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
export const deleteChat = /* GraphQL */ `
  mutation DeleteChat(
    $input: DeleteChatInput!
    $condition: ModelChatConditionInput
  ) {
    deleteChat(input: $input, condition: $condition) {
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
export const createPost = /* GraphQL */ `
  mutation CreatePost(
    $input: CreatePostInput!
    $condition: ModelPostConditionInput
  ) {
    createPost(input: $input, condition: $condition) {
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
export const updatePost = /* GraphQL */ `
  mutation UpdatePost(
    $input: UpdatePostInput!
    $condition: ModelPostConditionInput
  ) {
    updatePost(input: $input, condition: $condition) {
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
export const deletePost = /* GraphQL */ `
  mutation DeletePost(
    $input: DeletePostInput!
    $condition: ModelPostConditionInput
  ) {
    deletePost(input: $input, condition: $condition) {
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
export const updateMessage = /* GraphQL */ `
  mutation UpdateMessage(
    $input: UpdateMessageInput!
    $condition: ModelMessageConditionInput
  ) {
    updateMessage(input: $input, condition: $condition) {
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
export const deleteMessage = /* GraphQL */ `
  mutation DeleteMessage(
    $input: DeleteMessageInput!
    $condition: ModelMessageConditionInput
  ) {
    deleteMessage(input: $input, condition: $condition) {
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
export const updateChatMembers = /* GraphQL */ `
  mutation UpdateChatMembers(
    $input: UpdateChatMembersInput!
    $condition: ModelChatMembersConditionInput
  ) {
    updateChatMembers(input: $input, condition: $condition) {
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
export const deleteChatMembers = /* GraphQL */ `
  mutation DeleteChatMembers(
    $input: DeleteChatMembersInput!
    $condition: ModelChatMembersConditionInput
  ) {
    deleteChatMembers(input: $input, condition: $condition) {
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
