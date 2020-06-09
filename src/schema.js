const {buildSchema} = require("graphql")

const schema = buildSchema(`

     type AccessToken {
        access_token: String!
     }
           
     type User {
       id: Int!
       name: String!
       email: String!
       avatar: String
       timeZone: Int
       password: String!
     }    
     input signUpInput {
       id: Int!
       name: String!
       email: String!
       avatar: String
       timeZone: Int
       password: String!
     }
     input logInInput {
       id: Int!
       email: String!
       password: String!
     }
     input editUserInput {
       id: Int!
       email: String!
       password: String!
     }
     
      
     type Post {
       postId: Int!
       title: String!
       description: String!
       authorId: User
     }      
     input addPostInput{
       postId: Int!
       title: String!
       description: String!
       authorId: logInInput
     }   
     input editPostInput{
       postId: Int!
       title: String!
       description: String!
       authorId: logInInput
     }     
     
     
    type Mutation {
         signUp(User__signUp: signUpInput!): User!
         logIn(User__logIn: logInInput!): AccessToken!
         editUser(User__editUser: editUserInput! ): User!
         deleteUser(id: ID! ):  Boolean!     
         
         addPost(Post__addPost: addPostInput!): Post
         editPost(Post__editPost: editPostInput!): Post
         deletePost(postId: ID!): Boolean!
    }
    
    type Query {
        users: [User!]!
        user(email: String!): User!
        me: User!
        posts: [Post!]!
        post(postId: ID, title:String!):Post!
    }
`)

module.exports = schema;

