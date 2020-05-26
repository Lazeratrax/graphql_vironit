const express = require("express")
const graphqlHttp = require("express-graphql")
const schema = require("./schema")
const startDatabase = require("./database")
const isTokenValid = require("./validate")
// const bcrypyt = require("./bcryptjs")
// const crypto = require('crypto')
// const {validationResult} = require('express-validator')

const expressPlayground = require("graphql-playground-middleware-express").default;

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
    //мутации
    createUser: async ({id, firstName}, context) => {
        const {db, token} = await context();
        console.log(db)
        // const {error} = isTokenValid(token);
        //хэширование пароля
        // const hashPassword = await bcrypyt.hash(password, 10)
        const newUser = {id, firstName};
        db.collection("users").insert(newUser);
        return newUser
    },
    editUser: async ({id, firstName}, context) => {
        try {
            const {db, token} = await context();
            const {error} = await isTokenValid(token)
            if (error) {
                throw new Error(error)
            }
            return db
                .collection('users')
                .findOneAndUpdate(
                    {id},
                    {$set: {firstName}},
                    {returnOriginal: false},
                )
                .then(resp => resp.value)
        } catch (e) {
            throw new Error(error)
            console.log(`что-то пошло не так ${e}`)
        }
    },
    deleteUser: async ({id}, context) => {
        try {
            // const {db} = await context();
            // const userDelete = await db.findOne({
            //     where: {id}
            // })
            // await userDelete[0].destroy()
            // return true
            const {db} = await context();
            // const {error} = await isTokenValid(token)
            // if (error) {
            //     throw new Error(error)
            // }
            return db.collection('users').findOneAndDelete({id}).then(resp => resp.value)
        } catch (e) {
            throw new Error("id is required")
        }
    },
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
app.listen(4000, () => console.log("Server ready at http://localhost:4000/graphql"))


