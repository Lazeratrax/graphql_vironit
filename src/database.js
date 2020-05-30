const {MongoMemoryServer} = require("mongodb-memory-server");
const {MongoClient} = require("mongodb")

let database = null;

async function startDatabase() {
    if (database) {
        return database;
    }

    //эмуляция сервера
    const mongo = new MongoMemoryServer;
//эмуляция адреса
    const mongoDBURL = await mongo.getConnectionString();
//эмуляция коннекта
    const connection = await MongoClient.connect(mongoDBURL, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    database = connection.db();

    await database.collection("users").insertMany([
        {
            id: 1,
            name: "Kirill",
            password: "12345",
            email: "lazeratrax@gmail.com",
            avatar: "https://econet.ru/uploads/pictures/456173/content_199820.jpg",
            timeZone: 10,
            isPasswordSet: false,
            isTeacherPreview: false,
            access_token: String,
            // isOnline: false
        },
        {
            id: 12,
            name: "Lenaa",
            password: "12345",
            // email: "lazeratrax@gmail.com",
            // avatar: "https://econet.ru/uploads/pictures/456173/content_199820.jpg",
            // timeZone: 10,
            // isPasswordSet: false,
            // isTeacherPreview: false,
            access_token: String,
            // isOnline: false
        }
    ]);
    await database.collection("articles").insertMany([
        {
            id: 1001,
            title: 'firstName',
            content: ' value',
            illustration: "https://econet.ru/uploads/pictures/456173/content_199820.jpg",
            author: 1
        },
        {
            id: 1002,
            title: 'Name',
            content: 'Invalid',
            illustration: "https://econet.ru/uploads/pictures/456173/content_199820.jpg",
            author: 12
        },
    ]);
    //для валидаций
    // await database.collection("Output").insertMany([
    //     {
    //         param: 'firstName',
    //         msg: 'Invalid value',
    //     },
    //     {
    //         param: 'password',
    //         msg: 'Invalid value',
    //     }
    // ])
    return database;
}


module.exports = startDatabase;