export const full = /* GraphQL */ `
    query ListBroadcasts($limit: Int) {
        listBroadcasts(limit: $limit) {
            items {
                id
                button1link
                button1text
                button2link
                button2text
                content
                excemptVersions
                title
        
            }
        }
    }
`