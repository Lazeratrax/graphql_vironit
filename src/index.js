const express = require("express")
const graphqlHttp = require("express-graphql")
const schema = require("./schema")
const resolvers = require("./resolver")

const expressPlayground = require("graphql-playground-middleware-express").default;

const context = require("./context")

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
app.listen(4000, () => console.log(`Server ready at http://localhost:4000/graphql
test - http://localhost:4000/playground`))


