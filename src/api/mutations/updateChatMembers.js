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