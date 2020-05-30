require("dotenv").config()
// require('validator')
const bcrypt = require("bcryptjs")
const jwt = require('jsonwebtoken')
const isTokenValid = require("./validate")
const startDatabase = require("./database")
// const crypto = require('crypto')


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
    createUser: async ({user: {id, name, password}}, context) => {
        const {db} = await context();
        const hashPassword = await bcrypt.hash(password, 12);
        const newUser = {id, name, password: hashPassword};
        console.log('New user: ', newUser)
        db.collection("users").insertOne(newUser);
        return newUser
    },
    // // createUser: async ({id, firstName, password}, context) => {
    // //     const {db} = await context();
    // //     // const errors = validationResult(req)
    // //     // if (!errors.isEmpty()) {
    // //     //     throw new Error('некрректные данные при регистрации')
    // //     // }
    // //     const hashPassword = await bcrypt.hash(password, 12);
    // //     const newUser = {id, firstName, password: hashPassword};
    // //     db.collection("users").insertOne(newUser);
    // //     return newUser
    // // },
    //
    loginUser: async ({input: {name, password}}, context) => {
        try {
            const {db} = await context();
            const user = await db.collection('users').findOne({name})
            if (!user) {
                console.log(`такого пользователя не существует`)
                throw new Error("такого пользователя не существует")
            }
            const isMatch = await bcrypt.compare(password, user.password)
            if (!isMatch) {
                console.log(`Неверный пароль, попробуйте еще раз`)
                throw new Error("Неверный пароль, попробуйте еще раз")
            }
            console.log("user", user)
            const token = jwt.sign(
                {userId: user.id},
                // `${process.env.API_IDENTIFIER}`,
                `lazeratrax`,
                {expiresIn: '24h'}
            )
            return {access_token: token}
        } catch (e) {
            console.log(e)
        }
    },
    me: async (_, context) => {
        try {
            const {db, token} = await context();
            // const decoded = jwt.verify(token,`${process.env.API_IDENTIFIER}`)
            const decoded = jwt.verify(token, `lazeratrax`)
            //раскодированный токен ложим в объект req
            if (!decoded) {
                throw new Error('ошибка декодера токена')
            }
            const user = await db.collection('users').findOne({id: decoded.userId});
            return user ? {id: user.id, name: user.name} : {id: 0, name: ''};

        } catch (e) {
            console.log(e)
        }
    }
    // deleteUser: async ({id, firstName, password, access_token}, context) => {
    //     try {
    //         const {db, token} = await context();
    //         if (!token) {
    //             console.log(`token отсутствует`)
    //             throw new Error("тtoken отсутствует")
    //         }
    //         //jwt.verify - раскодирование токена/ указываем токен и секретный ключ
    //         // const decoded = jwt.verify(token,`${process.env.API_IDENTIFIER}`)
    //         const decoded = jwt.verify(token, `lazeratrax`)
    //         //раскодированный токен ложим в объект req
    //         if (!decoded) {
    //             throw new Error('ошибка декодера токена')
    //         }
    //         return db.collection('users').findOneAndDelete({id}).then(resp => resp.value)
    //     } catch (e) {
    //         console.log(`ошибка удаления пользователя на сервере - ${e}`)
    //         throw new Error("id is required")
    //     }
    // },
    // editUser: async ({id, name}, context) => {
    //     try {
    //         const {db, token} = await context();
    //         // const {error} = await isTokenValid(token)
    //         // if (error) {
    //         //     throw new Error(error)
    //         // }
    //         if (!token) {
    //             return res.status(401).json({message: "token отсутствует"})
    //         }
    //         const candiate = await db.collection('users').findOne({id})
    //
    //         if (candiate) {
    //             //расшифровка и сравнения пароля
    //             const areSame = await bcrypt.compare(password, candiate.password)
    //             if (areSame) {
    //
    //             }
    //         }
    //
    //         return db
    //             .collection('users')
    //             .findOneAndUpdate(
    //                 {id},
    //                 {$set: {firstName}},
    //                 {returnOriginal: false},
    //             )
    //             .then(resp => resp.value)
    //     } catch (e) {
    //         // throw new Error(error)
    //         res.status(500).send({message: e.message});
    //         console.log(`ошибка редактироваия пользователя на сервере - ${e}`)
    //     }
    // }
    // ,
    // addPost: async ({id, name}, context) => {
    //
    // }
}

module.exports = resolvers;

// createTestUser: async ({user: {id, name, password}}, context) => {
//     const {db} = await context();
//     const user = {id, name, password};
//     db.collection("users").insertOne(user);
//     return user
// },