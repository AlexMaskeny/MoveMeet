export const empty = /* GraphQL */ `
    mutation createBug ($input: CreateBugInput!) {
        createBug(input: $input) {
            id
        }
    }
`;