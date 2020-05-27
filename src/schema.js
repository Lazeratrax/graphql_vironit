
const {buildSchema} = require("graphql")

const schema = buildSchema(`
       type User {
       id: Int!
       firstName: String!
       password: String!
      }
      
      type Query {
        users: [User!]!
        user(id: Int!,  firstName: String!, password: String!): User!
    }

      type Mutation {
      createUser(id: Int!, firstName: String!, password: String!): User!
      loginUser(id: Int!, firstName: String!, password: String!): User
      editUser(id: Int, firstName: String, password: String!): User!
      deleteUser(id: Int!, firstName: String, password: String! ): User!
    }
    `)

module.exports = schema;

