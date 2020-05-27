require("dotenv").config()
const Router = require('express')
const bcrypt = require("bcryptjs")
const jwt = require('jsonwebtoken')
const isTokenValid = require("./validate")

// const crypto = require('crypto')
// const {validationResult} = require('express-validator')

const router = Router()
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
    createUser: async ({id, firstName, password}, context) => {
        const {db} = await context();
        //хэширование пароля
        const hashPassword = await bcrypt.hash(password, 12);
        const newUser = {id, firstName, password: hashPassword};
        db.collection("users").insertOne(newUser);
        return newUser
    },

    loginUser: async ({id, firstName, password}, context) => {
        try {
            const {db} = await context();
            //проверка, есть ли такой пользователь
            const user = await db.collection('users').findOne({id})
            if (!user) {
                // return res.status(400).json({
                //     message: "такого пользователя не существует"
                // })
            }
            const isMatch = await bcrypt.compare(password, user.password)
            console.log(isMatch)
            if (!isMatch) {
                // return res.status(400).json({message: "Неверный пароль, попробуйте еще раз"})
            }
            const token = jwt.sign(
                {userId: user.id},
                // `${process.env.API_IDENTIFIER}`,
                `lazeratrax`,
                {expiresIn: '1h'}
            )
            //если все хорошо, отдаем на фронт токен с id
            // res.json({token, userId: user.id})

            return (() => console.log(`пользователь залогинен`))
                .then(resp => resp.value)
            // .then(resp => resp.json({token, userId: user.id}))
        } catch (e) {
            console.log(e)
        }
    },
    deleteUser: async ({id, firstName, password}, context, req, res) => {
        try {
            const {db, token} = await context();
            if (!token) {
                return res.status(401).json({message: "token отсутствует"})
            }
            //jwt.verify - раскодирование токена/ указываем токен и секретный ключ
            // const decoded = jwt.verify(token,`${process.env.API_IDENTIFIER}`)
            const decoded = jwt.verify(token, `lazeratrax`)
            //раскодированный токен ложим в объект req
            req.user = decoded

            return db.collection('users').findOneAndDelete({id}).then(resp => resp.value)
        } catch (e) {
            console.log(`ошибка удаления пользователя на сервере - ${e}`)
            throw new Error("id is required")
        }
    },
    editUser: async ({id, firstName}, context, res) => {
        try {
            const {db, token} = await context();
            // const {error} = await isTokenValid(token)
            // if (error) {
            //     throw new Error(error)
            // }
            if (!token) {
                return res.status(401).json({message: "token отсутствует"})
            }
            const candiate = await db.collection('users').findOne({id})

            if (candiate) {
                //расшифровка и сравнения пароля
                const areSame = await bcrypyt.compare(password, candiate.password)
                if (areSame) {

                }
            }

            return db
                .collection('users')
                .findOneAndUpdate(
                    {id},
                    {$set: {firstName}},
                    {returnOriginal: false},
                )
                .then(resp => resp.value)
                .then(res.status(201).send({message: 'User was created'}))
        } catch (e) {
            // throw new Error(error)
            res.status(500).send({message: e.message});
            console.log(`ошибка редактироваия пользователя на сервере - ${e}`)
        }
    }
}

module.exports = resolvers;