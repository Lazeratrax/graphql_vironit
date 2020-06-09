require("dotenv").config()
// require('validator')
const bcrypt = require("bcryptjs")
const jwt = require('jsonwebtoken')
const isTokenValid = require("../validate")
//timestump - для постов (postID)
const { v1: uuidv4 } = require('uuid');
const multer = require('multer')
const graphql = require('graphql')
//скалярные типы/ GraphQLNonNull - защита от перезаписи, или обязательные поля
const { GraphQLID, GraphQLInputObjectType, GraphQLInt, GraphQLString, GraphQLBoolean, GraphQLObjectType, GraphQLSchema, GraphQLList, GraphQLNonNull } = graphql

const Users = require('../models/User')
const Posts = require('../models/Post')

const LIMIT = 10

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
            args: { email: { type: GraphQLString} },
            async resolve(parent, args, context) {
                const email = args.email
                const { db } = await context();
                return db.collection("users").findOne({ email });
            }
        },
        me: {
            type: userType,
            async resolve(parent, args, context) {
                const { db, token } = await context()
                if (!token) {
                    throw new Error("Невалидный токен")
                }
                // const decoded = jwt.verify(token, `${process.env.API_IDENTIFIER}`)
                const decoded = jwt.verify(token, `lazeratrax`)
                if (!decoded) {
                    throw new Error('ошибка декодера токена')
                }
                const user = await db.collection('users').findOne({ id: decoded.userId });
                return user ? 
                    { id: user.id, email: user.email, name: user.name } :
                    { id: 0, email: '', name: '', password:'' };
            }
        },
        post: {
            type: postType,
            args: { id: { type: new GraphQLNonNull(GraphQLID) } },
            async resolve(parent, args, context) {
                const { db } = await context()
                return db.collection('posts').findOne({ id })
            }
        },
    
        posts: {
            type: new GraphQLObjectType({
                name: 'PostsType',
                fields: {
                    data: { type: new GraphQLList(postType) },
                    page: { type: GraphQLInt },
                    perPage: { type: GraphQLInt },
                    total: { type: GraphQLInt },
                }
            }),
            args: { 
                input: {
                    type: new GraphQLInputObjectType({
                        name: 'PostsInput',
                        fields: () => ({
                            query: { type: GraphQLString },
                            page: { type: GraphQLInt },
                        })
                    })
                }
             },
            async resolve(parent, { input: { query, page = 1 } }, context) {
                const { db } = await context()
                const skip = (page - 1) * LIMIT;
                // ToDo: Исправить обработку фильтра (total, search)
                const posts = query ?
                    await db.collection('posts').find({ $text: { $search: query } })
                    .skip(skip).limit(LIMIT) :
                    await db.collection('posts').find().skip(skip).limit(LIMIT);
                const total = await db.collection('posts').countDocuments();
                return { data: posts.toArray(), perPage: LIMIT, total, page };
            }
        },
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
                            name: { type: GraphQLString },
                            password: { type: GraphQLNonNull(GraphQLString) },
                        })
                    })
                }
            },
            async resolve(parent, { input: {name, email, password } }, context) {
                const { db } = await context();
                const hashPassword = await bcrypt.hash(password, 12);
                const newUser = { id: uuidv4(), name: name || email, email, password: hashPassword };
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
                }
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
                    `lazeratrax`,
                    { expiresIn: '20h' }
                )
                return { access_token: token }
            }
        },
        editUser: {
            type: userType,
            args: {
                email: { type: GraphQLNonNull(GraphQLString) },
                password: { type: GraphQLString },
            },
            async resolve(parent, { email, password }, context) {
                const { db, token } = await context()
                if (!token) {
                    throw new Error("Invalid token")
                }
                const decoded = jwt.verify(token, `lazeratrax`)
                // раскодированный токен ложим в объект req
                if (!decoded) {
                    throw new Error('ошибка декодера токена')
                }
                let user = await db.collection('users').findOne({ email })
                if (!user) {
                    console.log(`такого пользователя не существует`)
                    throw new Error("такого пользователя не существует")
                }
                const areSame = await bcrypt.compare(password, user.password)
                if (areSame) {
                    const hashPassword = await bcrypt.hash(password, 12)
                    db.collection('users').findOneAndUpdate(
                        { email },
                        { password: hashPassword },
                        { returnOriginal: false }
                    )
                }
                return user
            }
        },
        addPost: {
            type: postType,
            args: {
                input: {
                    type: new GraphQLInputObjectType({
                        name: 'AddPostInput',
                        fields: () => ({
                            title: { type: new GraphQLNonNull(GraphQLString) },
                            description: { type: new GraphQLNonNull(GraphQLString) },
                            authorId: {type: new GraphQLNonNull(GraphQLString)}
                        })
                    })
                }
            },
            async resolve(parent, { input }, context) {
                const { db, token } = await context()
                if (!token) {
                    throw new Error("Invalid token")
                }
                if (token) {
                    const decoded = jwt.verify(token, `lazeratrax`)
                    if (!decoded) {
                        throw new Error('ошибка декодера токена')
                    }
                    const newPost = { id: uuidv4(), ...input }
                    db.collection('posts').insertOne(newPost);
                    return newPost
                }
            }
        },
        // 
        editPost: {
            type: postType,
            args: {
                input: {
                    type: new GraphQLInputObjectType({
                        name: 'EditPostInput',
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
                const decoded = jwt.verify(token, `lazeratrax`)
                if (!decoded) {
                    throw new Error('ошибка декодера токена')
                }
                const post = await db.collection('posts').findOne({ id })
                if (!post) {
                    console.log(`такого поста не существует`)
                    throw new Error("такого поста не существует")
                }
                const { value } = await db.collection('posts').updateOne(
                    { id },
                    { $set: { description, title } },
                    { upsert: true }
                );
                return value
            }
        },
        deletePost: {
            type: GraphQLBoolean,
            args: {
                id: { type: GraphQLNonNull(GraphQLID) },
            },
            async resolve(parent, { id }, context) {
                const { db, token } = await context();
                if (!token) {
                    throw new Error("Invalid token")
                }
                const decoded = jwt.verify(token, `lazeratrax`)
                if (!decoded) {
                    throw new Error('ошибка декодера токена')
                }
                const post = await db.collection('posts').findOne({ id })
                if (!post) {
                    throw new Error("такого поста не существует")
                }
                await db.collection('posts').deleteOne({ id })
                return true
            }
        }

    })
})

module.exports = new GraphQLSchema({
    query: Query,
    mutation: Mutation
})
