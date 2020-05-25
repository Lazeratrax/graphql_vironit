
const {buildSchema} = require("graphql")

const schema = buildSchema(`
       type User {
       id: ID!
       firstName: String!
       secondName:String!
       email: String
       password: String!
       tel: Int
       avatarUrl: String!
       isOnline: Boolean
      }
      
      type Query {
        users: [User!]!
        user(id: Int!): User!
    }

      type Mutation {
      editUser(id: Int!, firstName: String!, secondName: String!,email:String,password: String!,tel: Int, avatarUrl: String! ): User!
    }
    
    `)

module.exports = schema;
