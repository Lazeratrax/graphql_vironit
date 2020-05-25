const express = require("express")
const graphqlHttp = require("express-graphql")

const schema = require("./schema")
const startDatabase = require("./database")

const expressPlayground = require("graphql-playground-middleware-express").default;

const isTokenValid = require("./validate")

// Create a context for holding contextual data
const context = async req => {
    const db = await startDatabase();
    const {authorization: token} = req.headers
    return {db, token}
}

// Provide resolver functions for your schema fields
const resolvers = {
    users: async (_, context) => {
        const {db, token} = await context();
        const {error} = isTokenValid(token);
        const users = db.collection('users').find();
        return !error
            ? users.toArray()
            : users.project({id: 1}).toArray()
    },
    user: async ({id}, context) => {
        const {db, token} = await context();
        const {error} = await isTokenValid(token);
        const user = await db.collection("users").findOne({id});
        return !error ? user : {...user, id: 1}
    },
    editUser: async ({id, firstName, secondName, email, password, tel, avatarUrl}, context) => {
        const {db, token} = await context();

        const {error} = await isTokenValid(token)

        if (error) {
            throw new Error(error)
        }

        return db
            .collection('events')
            .findOneAndUpdate(
                {id},
                {$set: {firstName, secondName, email, password, tel, avatarUrl}},
                {returnOriginal: false},
            )
            .then(resp => resp.value)
    }
}

const app = express()
app.use(
    '/graphql',
    graphqlHttp(async (req) => ({
        schema,
        rootValue: resolvers,
        context: () => context(req)
    })),
)

//запуск графического редактора в браузере
app.get('/playground', expressPlayground({endpoint: '/graphql'}));
app.listen(4000)

console.log("Server ready at http://localhost:4000/graphql")
