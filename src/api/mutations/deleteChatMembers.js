export const background = /* GraphQL */ `
  mutation DeleteChatMembers(
    $input: DeleteChatMembersInput!
    $condition: ModelChatMembersConditionInput
  ) {
    deleteChatMembers(input: $input, condition: $condition) {
      id
      userID
      chatID
    }
  }
`;