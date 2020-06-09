require("dotenv").config()
// require('validator')
const bcrypt = require("bcryptjs")
const jwt = require('jsonwebtoken')
const isTokenValid = require("./validate")
const uniqid = require('uniqid');
// const startDatabase = require("./database")
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
    user: async ({email}, context) => {
        const {db} = await context();
        // const {error} = await isTokenValid(token);
        const user = await db.collection("users").findOne({email});
        return user
        // return !error ? user : {...user, id: 1}
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
            return user ? {id: user.id, email: user.email, name: user.name} : {id: 0, email: '', name: ''};

        } catch (e) {
            console.log(e)
        }
    },
    signUp: async ({User__signUp: {id, name, email, password}}, context) => {
        const {db} = await context();
        const hashPassword = await bcrypt.hash(password, 12);
        const newUser = {name, email, password: hashPassword};
        console.log('New user: ', newUser)
        db.collection("users").insertOne(newUser);
        return newUser
    },
    logIn: async ({User__logIn: {id, email, password}}, context) => {
        try {
            const {db} = await context();
            const user = await db.collection('users').findOne({email})
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
    editUser: async ({User__editUser: {id, email, password}}, context) => {
        try {
            const {db, token} = await context();
            if (!token) {
                throw new Error("инвалидный токен")
                // return res.status(401).json({message: "token отсутствует"})
            }
            let user = await db.collection('users').findOne({email})
            if (!user) {
                console.log(`такого пользователя не существует`)
                throw new Error("такого пользователя не существует")
            }
            if (user) {
                //расшифровка и сравнения пароля
                const areSame = await bcrypt.compare(password, user.password)
                if (areSame) {
                    const hashPassword = await bcrypt.hash(password, 12)
                    db.collection('users').findOneAndUpdate(
                        {email},
                        {password: hashPassword},
                        {returnOriginal: false}
                    )
                }
            }
            return user
        } catch (e) {
            console.log(e)
        }
    },
    deleteUser: async ({User__deleteUser: {id, email, password}}, context) => {
        try {
            const {db, token} = await context();
            const user = await db.collection('users').findOne({email})
            if (!user) {
                console.log(`такого пользователя не существует`)
                throw new Error("такого пользователя не существует")
            }
            const isMatch = await bcrypt.compare(password, user.password)
            if (!isMatch) {
                console.log(`Неверный пароль, попробуйте еще раз`)
                throw new Error("Неверный пароль, попробуйте еще раз")
            }
            //jwt.verify - раскодирование токена/ указываем токен и секретный ключ
            // const decoded = jwt.verify(token,`${process.env.API_IDENTIFIER}`)
            const decoded = jwt.verify(token, `lazeratrax`)
            //раскодированный токен ложим в объект req
            if (!decoded) {
                throw new Error('ошибка декодера токена')
            }
            return db.collection('users').findOneAndDelete({email}).then(resp => resp.value)
        } catch (e) {
            console.log(e)
        }
    },
    addPost: async ({Post__addPost: {title, description}}, context) => {
        try {
            const {db} = await context();
            const candidatePost = await db.collection('posts').findOne({title})
            if (candidatePost) {
                console.log(`статья с таким названием уже существует!`)
                throw new Error("статья с таким названием уже существует!")
            }
            const newPost = {title, description, id: uniqid()}
            await db.collection('posts').insertOne(newPost);
            return newPost
        } catch (e) {
            console.log(e)
        }
    },
    editPost: async ({Post__editPost: {title, description}}, context) => {
        try {
            const {db} = await context();
            const candidatePost = await db.collection('posts').findOne({title})
            if (!candidatePost) {
                console.log(`такой статьи не существует!`)
                throw new Error("такой статьи не существует!")
            }

            return
        } catch (e) {
            console.log(e)
        }
    },
    deletePost: async ({Post__deletePost: {title, description, postId}}, context) => {
        try {
            const {db, token} = await context();
            const posts = await db.collection('posts').find({title})
            if (!posts) {
                console.log(`такой статьи не существует`)
                throw new Error("такой статьи не существует")
            }
            await posts[0].destroy()
            return true
        } catch (e) {
            console.log(e)
        }
    },
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
//
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
