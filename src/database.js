const {MongoMemoryServer} = require("mongodb-memory-server");
const {MongoClient} = require("mongodb")

let database = null;

async function startDatabase() {
    //эмуляция сервера
    const mongo = new MongoMemoryServer;
//эмуляция адреса
    const mongoDBURL = await mongo.getConnectionString();
//эмуляция коннекта
    const connection = await MongoClient.connect(mongoDBURL,{
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    if (!database) {
        database = connection.db();

        await database.collection("users").insertMany([
                {
                    id: 1,
                    firstName: "Kirill"
                    // secondName: "Lazarev",
                    // email: "lazeratrax@gmail.com",
                    // password: "1234567Q",
                    // tel: 375447610553,
                    // avatarUrl: "https://econet.ru/uploads/pictures/456173/content_199820.jpg",
                    // isOnline: false
                },
                {
                    id: 12,
                    firstName: "Lena"
                    // secondName: "Lazareva",
                    // email: "kate@gmail.com",
                    // password: "1234567Q",
                    // tel: 375298887777,
                    // avatarUrl: "https://cs11.livemaster.ru/storage/topicavatar/600x450/04/66/4078a444edc286bd35b0a0a67c680cc42204sw.jpg?h=AH8vAuYPoFKwWsdzxggafA",
                    // isOnline: false
                }
            ]
        )
    }
    return database
}


module.exports = startDatabase;