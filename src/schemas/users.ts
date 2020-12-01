import { gql } from 'apollo-server';

export default gql`
  type User {
    username: String
    firstName: String
    lastName: String
  }

  type Query {
    users: [User!]
  }
`;
