//формирует двоичный файл mongod - тестовый сервер
const {MongoMemoryServer} = require("mongodb-memory-server")
const {MongoClient} = require("mongodb")
// коллекции
const usersCollection = require('./usersCollection')
const postsCollection = require('./postsCollection')

let database = null;

async function startDatabase() {
    if (database) {
        return database;
    }
//эмуляция сервера. формирует двоичный файл mongod
    const mongo = new MongoMemoryServer;
//эмуляция адреса
    const mongoDBURL = await mongo.getConnectionString();
//эмуляция коннекта
    const connection = await MongoClient.connect(mongoDBURL, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    database = connection.db();
    await database.collection("users").insertMany(usersCollection());
    await database.collection("posts").insertMany(postsCollection());
    await database.collection("posts").createIndex( { title: "text", description: "text" } )
    return database;
}

module.exports = startDatabase;