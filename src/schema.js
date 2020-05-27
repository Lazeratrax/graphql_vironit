
const {buildSchema} = require("graphql")

const schema = buildSchema(`
       type User {
       id: Int!
       firstName: String!
      }
      
      type Query {
        users: [User!]!
        user(id: Int!): User!
        random(min: Int!, max:Int!, count:Int!): [Float!]!
    }

      type Mutation {
      createUser(id: Int!, firstName: String!): User!
      editUser(id: Int, firstName: String ): User!
      deleteUser(id: Int!): User!
      loginUser(id: Int!):User!
      logoutUser(id: Int!):User!
    }
    `)

module.exports = schema;

// secondName:String!
//     email: String
// password: String!
//     tel: Int
// avatarUrl: String!
//     isOnline: Boolean
