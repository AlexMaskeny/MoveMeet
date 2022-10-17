/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createUser = /* GraphQL */ `
  mutation CreateUser(
    $input: CreateUserInput!
    $condition: ModelUserConditionInput
  ) {
    createUser(input: $input, condition: $condition) {
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
export const updateUser = /* GraphQL */ `
  mutation UpdateUser(
    $input: UpdateUserInput!
    $condition: ModelUserConditionInput
  ) {
    updateUser(input: $input, condition: $condition) {
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
export const deleteUser = /* GraphQL */ `
  mutation DeleteUser(
    $input: DeleteUserInput!
    $condition: ModelUserConditionInput
  ) {
    deleteUser(input: $input, condition: $condition) {
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
