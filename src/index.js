const express = require("express")
//эмулятор graphiQL
const graphqlHttp = require("express-graphql")
//withMongoose -
const schema = require('./schema/schema')
//buildSchema:
// const schema = require("./schema")
// const resolvers = require("./resolver")
const mongoose = require('mongoose')

// const StartDatabase = require('./database')

const expressPlayground = require("graphql-playground-middleware-express").default;

const context = require("./context")
const app = express()

const PORT = 3550

//связь с БД
//коннект нужен ТОЛЬКО для запуска, далее работаю с файлом mockDatabase, подключенным через контекст/
// в перспективе сделаю миграцию в Atlas
mongoose.connect("mongodb+srv://lazeratrax:bntu2010@cluster0-n3obi.mongodb.net/qraphQL_test",
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })

app.use(
    '/graphql',
    graphqlHttp(async (req) => ({
        schema,
        // rootValue: resolvers,
        graphiql: true,
        context: () => context(req)
    })),
)

app.get('/playground', expressPlayground({endpoint: '/graphql'}));

//проверки на коннект
const dbConnection = mongoose.connection;
dbConnection.on('error', err => console.log(`connection error: ${err}`));
dbConnection.once('open', () => console.log('connection to db!!'));

// /graphql - стандарт graphiQL, /playground - дает возмость отправлять хэдерs, т.е. тестить токены
app.listen(PORT, err => {
    err ? console.log(error) : console.log(`server started at localhost:${PORT}
            localhost:${PORT}/graphql
            test - http://localhost:${PORT}/playground`);
})

//===========================playground================================//
// query {
//     users{
//         email
//         id
//         name
//     }
// }

// query($id:ID) {
//     user(id:$id){
//         id
//         email
//     }
// }

// {
//     "id": "1"
// }

// mutation($name:String,$email:String,$password:String ) {
//     signUp(name:$name,email:$email,password:$password ) {
//         name
//         email
//         password
//     }
// }

// {
//     "name":"test",
//     "email": "test@",
//     "password": "12345"
// }





