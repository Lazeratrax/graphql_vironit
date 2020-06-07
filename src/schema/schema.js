// require("dotenv").config()
const bcrypt = require("bcryptjs")
const jwt = require('jsonwebtoken')
// const isTokenValid = require("../validate")
const { v1: uuidv4 } = require('uuid');
const multer = require('multer')
const graphql = require('graphql')
//скалярные типы/ GraphQLNonNull - защита от перезаписи, или обязательные поля
const { GraphQLID,
    GraphQLInt,
    GraphQLString,
    GraphQLObjectType,
    GraphQLInputObjectType,
    GraphQLSchema,
    GraphQLList,
    GraphQLBoolean,
    GraphQLNonNull } = graphql

const Users = require('../models/User')
const Posts = require('../models/Post')

const userType = new GraphQLObjectType({
    name: "user",
    fields: () => ({
        id: { type: GraphQLID },
        name: { type: new GraphQLNonNull(GraphQLString) },
        email: { type: new GraphQLNonNull(GraphQLString) },
        avatar: { type: GraphQLString },
        password: { type: new GraphQLNonNull(GraphQLString) },
        access_token: { type: GraphQLString },
        posts: {
            type: new GraphQLList(postType),
            resolve(parent, args) {
                return Posts.find({ userId: parent.id })
            }
        }
    })
})

const postType = new GraphQLObjectType({
    name: 'post',
    fields: () => ({
        id: { type: GraphQLString },
        title: { type: new GraphQLNonNull(GraphQLString) },
        description: { type: new GraphQLNonNull(GraphQLString) },
        authorId: { type: GraphQLString }
    })
})

const Query = new GraphQLObjectType({
    name: 'Query',
    fields: () => ({
        user: {
            type: userType,
            args: { email: { type: GraphQLNonNull(GraphQLString) } },
            async resolve(parent, args, context) {
                const email = args.email
                const { db } = await context();
                const user = await db.collection("users").findOne({ email });
                return user
            }
        },
        users: {
            type: new GraphQLList(userType),
            async resolve(parent, args, context) {
                const { db } = await context();
                const users = db.collection('users').find();
                return users.toArray()
            }
        },
        me: {
            type: userType,
            async resolve(parent, args, context) {
                const { db, token } = await context()
                if (!token) {
                    throw new Error("invalid token")
                }
                // const decoded = jwt.verify(token, `${process.env.API_IDENTIFIER}`)
                const decoded = jwt.verify(token, `lazeratrax`)
                if (!decoded) {
                    throw new Error('ошибка декодера токена')
                }
                const user = await db.collection('users').findOne({ id: decoded.userId });
                console.log('dss', decoded.userId)
                return user ? { id: user.id, email: user.email, name: user.name } : { id: 0, email: '', name: '' };
            }
        },
        post: {
            type: postType,
            args: { title: { type: GraphQLNonNull(GraphQLID) } },
            async resolve(parent, args, context) {
                const title = args.title
                const { db } = await context()
                const post = db.collection('posts').findOne({ title });
                return post
            }
        },
        posts: {
            type: new GraphQLList(postType),
            args: {
                input: {
                    type: new GraphQLInputObjectType({
                        name: 'PostInput',
                        fields: () => ({
                            query: { type: GraphQLString },
                        })
                    })
                }
            },
            async resolve(parent, { input: { query } }, context) {
                const { db } = await context()
                const posts = query ?
                    db.collection('posts').find({ $text: { $search: query } }) :
                    db.collection('posts').find()
                return posts.toArray()
            }
        }
    })
})

const Mutation = new GraphQLObjectType({
    name: 'Mutation',
    fields: () => ({
        signUp: {
            type: userType,
            args: {
                input: {
                    type: new GraphQLInputObjectType({
                        name: 'SignUpInput',
                        fields: () => ({
                            email: { type: GraphQLNonNull(GraphQLString) },
                            password: { type: GraphQLNonNull(GraphQLString) },
                        })
                    })
                },
            },
            async resolve(parent, { input: { email, password } }, context) {
                const { db } = await context();
                const hashPassword = await bcrypt.hash(password, 12);
                const newUser = { name, email, password: hashPassword };
                db.collection("users").insertOne(newUser);
                return newUser
            }
        },
        logIn: {
            type: userType,
            args: {
                input: {
                    type: new GraphQLInputObjectType({
                        name: 'LogInInput',
                        fields: () => ({
                            email: { type: GraphQLNonNull(GraphQLString) },
                            password: { type: GraphQLNonNull(GraphQLString) },
                        })
                    })
                },
            },
            async resolve(parent, { input: { email, password } }, context) {
                const { db } = await context()
                const user = await db.collection('users').findOne({ email })
                if (!user) {
                    console.log(`такого пользователя не существует`)
                    throw new Error("такого пользователя не существует")
                }
                const isMatch = await bcrypt.compare(password, user.password)
                if (!isMatch) {
                    console.log(`Неверный пароль, попробуйте еще раз`)
                    throw new Error("Неверный пароль, попробуйте еще раз")
                }
                const token = jwt.sign(
                    { userEmail: user.email },
                    // `${process.env.API_IDENTIFIER}`,
                    `lazeratrax`,
                    { expiresIn: '20h' }
                )
                return { access_token: token }
            }
        },
        //редактирую пароль, мыло неизменно
        editUser: {
            type: userType,
            args: {
                email: { type: GraphQLNonNull(GraphQLString) },
                password: { type: GraphQLString },
            },
            async resolve(parent, args, context) {
                const { db, token } = await context()
                if (!token) {
                    throw new Error("инвалидный токен")
                }
                // // const decoded = jwt.verify(token,`${process.env.API_IDENTIFIER}`)
                const decoded = jwt.verify(token, `lazeratrax`)
                if (!decoded) {
                    throw new Error('ошибка декодера токена')
                }
                const email = args.email
                const password = args.password
                let user = await db.collection('users').findOne({ email })
                if (!user) {
                    console.log(`такого пользователя не существует`)
                    throw new Error("такого пользователя не существует")
                }
                const areSame = await bcrypt.compare(password, user.password)
                if (!areSame) {
                    console.log(`что-то с паролем`)
                    throw new Error("что-то с паролем")
                }
                const hashPassword = await bcrypt.hash(password, 12)
                db.collection('users').findOneAndUpdate(
                    { email },
                    { password: hashPassword },
                    { returnOriginal: false }
                )
                return user
            }
        },
        // deleteUser: {
        //     type: userType,
        //     args: {
        //         email: { type: GraphQLNonNull(GraphQLString) },
        //         password: { type: GraphQLNonNull(GraphQLString) },
        //     },
        //     async resolve(parent, args, context) {
        //         const { db, token } = await context()
        //         if (!token) {
        //             throw new Error("инвалидный токен")
        //             // return res.status(401).json({message: "token отсутствует"})
        //         }
        //         const decoded = jwt.verify(token, `lazeratrax`)
        //         if (!decoded) {
        //             throw new Error('ошибка декодера токена')
        //         }
        //         const email = args.email
        //         const password = args.password
        //         const user = await db.collection('users').findOne({ email })
        //         if (!user) {
        //             console.log(`такого пользователя не существует`)
        //             throw new Error("такого пользователя не существует")
        //         }
        //         const isMatch = await bcrypt.compare(password, user.password)
        //         if (!isMatch) {
        //             console.log(`Неверный пароль, попробуйте еще раз`)
        //             throw new Error("Неверный пароль, попробуйте еще раз")
        //         }
        //         if (isMatch) {
        //             return db.collection('users')
        //                 .findOneAndDelete({ email })
        //                 .then(resp => resp.value)
        //         }
        //     }
        // },
        addPost: {
            type: postType,
            args: {
                input: {
                    type: new GraphQLInputObjectType({
                        name: 'AddPostInput',
                        fields: () => ({
                            title: { type: new GraphQLNonNull(GraphQLString) },
                            description: { type: new GraphQLNonNull(GraphQLString) },
                            authorId: { type: new GraphQLNonNull(GraphQLString) }
                        })
                    })
                }
            },
            async resolve(parent, { input }, context) {
                const { db, token } = await context()
                if (!token) {
                    throw new Error("инвалидный токен")
                    // return res.status(401).json({message: "token отсутствует"})
                }
                const decoded = jwt.verify(token, `lazeratrax`)
                if (!decoded) {
                    throw new Error('ошибка декодера токена')
                }
                const newPost = { id: uuidv4(), ...input }
                db.collection("posts").insertOne(newPost);
                return newPost
            }
        },
        editPost: {
            type: postType,
            args: {
                input: {
                    type: new GraphQLInputObjectType({
                        name: "editPostInput",
                        fields: () => ({
                            id: { type: GraphQLID },
                            title: { type: GraphQLString },
                            description: { type: GraphQLString },
                        })
                    })
                }
            },
            async resolve(parent, { input: { id, title, description } }, context) {
                const { db, token } = await context()
                if (!token) {
                    throw new Error("инвалидный токен")
                }
                // // const decoded = jwt.verify(token,`${process.env.API_IDENTIFIER}`)
                const decoded = jwt.verify(token, `lazeratrax`)
                if (!decoded) {
                    throw new Error('ошибка декодера токена')
                }
                const post = await db.collection('posts').findOne({ id })
                if (!post) {
                    console.log(`такого поста не существует`)
                    throw new Error("такого поста не существует")
                }
                const { value } = db.collection('posts').updateOne(
                    { id },
                    { $set: { description, title } },
                    // { returnOriginal: true }
                    { upsert: true }
                )
                // .then(resp => resp.value);
                return value
            }
        },
        deletePost: {
            type: GraphQLBoolean,
            args: {
                id: { type: GraphQLNonNull(GraphQLString) },
            },
            async resolve(parent, { id }, context) {
                const { db, token } = await context();
                if (!token) {
                    throw new Error("инвалидный токен")
                }
                const decoded = jwt.verify(token, `lazeratrax`)
                if (!decoded) {
                    throw new Error('ошибка декодера токена')
                }
                const post = await db.collection('posts').findOne({ postId })
                if (!post) {
                    throw new Error("такого поста не существует")
                }
                await db.collection('posts').deleteOne({ id })
                // .findOneAndDelete({ postId })
                // .then(resp => resp.value)
                return true 
            }
        }
    })
})

module.exports = new GraphQLSchema({
    query: Query,
    mutation: Mutation
})


//ЗАПРОСЫ
// query {
//     users{
//         email
//     }
// }

