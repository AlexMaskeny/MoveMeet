export const least = /* GraphQL */ `
  query ListUsersByLocation(
    $lat: String
    $long: String
    $latf1: String
    $latf2: String
    $long1: String
    $long2: String
    $long3: String
    $radius: Int
  ) {
    listUsersByLocation(latf1: $latf1, latf2: $latf2, lat: $lat, long: $long, long1: $long1, long2: $long2, long3: $long3, radius: $radius) {
      items {
        id
        lat
        long
        username
        loggedOut
        bio
        profilePicture {
            full
            loadFull
        }
        updatedAt
      }
    }
  }
`;