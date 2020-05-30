const {buildSchema} = require("graphql")

const schema = buildSchema(`
       type User {
       id: Int
       name: String
       email: String
       avatar: String
       timeZone: Int
       isPasswordSet: Boolean
       isTeacherPreview: Boolean
       password: String
       access_token: String
      }
      
      input UserInput {
       id: Int
       name: String!
       password: String!
       email: String
       avatar: String
       timeZone: Int
       isPasswordSet: Boolean
       isTeacherPreview: Boolean
       access_token: String
      }
      
      type Post {
       postId: Int
       title: String
       content: String
       illustration: String 
      }
      
      input PostInput{
       postId: Int!
       title: String!
       content: String!
       illustration: String
      }
      
    type Query {
        users: [User!]!
        user(id: Int!,  name: String!, password: String!): User!
        me: User!
        posts: [Post!]!
        post(id: Int!, title:String!):Post!
    }
    
    input LoginInput {
        name: String!
        password: String!
    }
    
    type AccessToken {
        access_token: String!
    }
    
    type Mutation {
         createUser(user: UserInput!): User!
         loginUser(input: LoginInput!): AccessToken!
         editUser(id: Int, name: String, password: String!, access_token: String): User!
         deleteUser(id: Int!, name: String, password: String! ): User!     
         
         createPost(post: PostInput!):Post
         editPost(post: PostInput!):Post!
         deletePost(post: PostInput!):Post!
    }
`)

module.exports = schema;

// createTestUser(user: TestUserInput!): User!
// input TestUserInput {
//     id: Int!
//         name: String!
//         password: String!
// }

// createUser(id: Int!, name: String!, password: String!): User
// loginUser(id: Int, name: String, password: String, access_token: String): User
// editUser(id: Int, name: String, password: String!): User!
//     deleteUser(id: Int!, name: String, password: String! ): User!

// addPost(title: String!, content: String!, author: AuthorInput):Post!
//     editPost(title: String!, content: String!, author: User!):Post!
//     deletePost(title: String!, content: String!, author: User!):Post!

