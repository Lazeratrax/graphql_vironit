# graphql_vironit
init
playground tests: 

==================Query==============

query($email:String!) {
  user(email:$email){
    email
    id
    name
  }
}
{
  "email":"test@test.ru"
}


query {
     users{
         email
         id
         name
     }
 }
 
 query {
     posts{
        postId
      title
      description
     }
 }
 
 ===============Mutation=============
 
mutation($name:String!,$email:String!,$password:String! ) {
  signUp(name:$name,email:$email,password:$password ) {
    name
    email
    password
  }
}

{
  "name":"test",
  "email": "test@",
  "password": "12345"
}



 
 
 
