const { gql } = require('apollo-server');

module.exports = gql`
  directive @authenticated on FIELD_DEFINITION
  directive @public on FIELD_DEFINITION

  type User {
    id: ID!
    email: String!
    token: String!
    username: String!
    createdAt: String!
  }

  input RegisterInput {
    username: String!
    password: String!
    confirmPassword: String!
    email: String!
  }

  type Query {
    getDetails: User! @authenticated
    publicData: String! @public
    randomTest:String! @authenticated
  }

  type Mutation {
    register(registerInput: RegisterInput): User!
    login(username: String!, password: String!): User!
  }
`;
