export const empty = /* GraphQL */ `
  query ListChatsByLocation(
    $lat: String
    $long: String
    $latf1: String
    $latf2: String
    $long1: String
    $long2: String
    $long3: String
    $radius: Int
  ) {
    listChatsByLocation(latf1: $latf1, latf2: $latf2, lat: $lat, long: $long, long1: $long1, long2: $long2, long3: $long3, radius: $radius) {
      items {
        id
      }
    }
  }
`;

export const loadingPage = /* GraphQL */ `
  query ListChatsByLocation(
    $lat: String
    $long: String
    $latf1: String
    $latf2: String
    $long1: String
    $long2: String
    $long3: String
    $radius: Int
  ) {
    listChatsByLocation(latf1: $latf1, latf2: $latf2, lat: $lat, long: $long, long1: $long1, long2: $long2, long3: $long3, radius: $radius) {
      items {
        id
        private
      }
    }
  }
`;