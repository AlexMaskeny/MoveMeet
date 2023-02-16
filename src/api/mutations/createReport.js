export const empty = /* GraphQL */ `
    mutation createReport ($input: CreateReportInput!) {
        createReport(input: $input) {
            id
        }
    }
`;
