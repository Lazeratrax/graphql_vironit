require("dotenv").config()
// require('validator')
const bcrypt = require("bcryptjs")
const jwt = require('jsonwebtoken')
const isTokenValid = require("../validate")
//timestump - для постов (postID)
const {v1: uuidv4} = require('uuid');
const multer = require('multer')

const graphql = require('graphql')
//скалярные типы/ GraphQLNonNull - защита от перезаписи, или обязательные поля
const {GraphQLID, GraphQLInt, GraphQLString, GraphQLObjectType, GraphQLSchema, GraphQLList, GraphQLNonNull} = graphql

const Users = require('../models/User')
const Posts = require('../models/Post')

const userType = new GraphQLObjectType({
    name: "user",
    fields: () => ({
        id: {type: GraphQLID},
        name: {type: new GraphQLNonNull(GraphQLString)},
        email: {type: new GraphQLNonNull(GraphQLString)},
        avatar: {type: GraphQLString},
        password: {type: new GraphQLNonNull(GraphQLString)},
        posts: {
            type: new GraphQLList(postType),
            resolve(parent, args) {
                return Posts.find({userId: parent.id})
            }
        }
    })
})

const postType = new GraphQLObjectType({
    name: 'post',
    fields: () => ({
        postId: {type: GraphQLString},
        title: {type: new GraphQLNonNull(GraphQLString)},
        description: {type: new GraphQLNonNull(GraphQLString)}
        // authorId: {
        //     type: new GraphQLList(userType),
        //     resolve(parent, args) {
        //         return Users.find({userId: parent.id})
        //     }
        // }
    })
})

const Query = new GraphQLObjectType({
    name: 'Query',
    fields: () => ({
        user: {
            type: userType,
            args: {email: {type: new GraphQLNonNull(GraphQLString)}},
            async resolve(parent, args, context) {
                const email = args.email
                const {db} = await context();
                const user = await db.collection("users").findOne({email});
                return user
                // const {error} = await isTokenValid(token);
                // const user = Users.findById(args.id)
                // return Users.findById(args.id)
            }
        },
        users: {
            type: new GraphQLList(userType),
            async resolve(parent, args, context) {
                const {db} = await context();
                const users = db.collection('users').find();
                return users.toArray()
            }
        },
        me: {
            type: userType,
            async resolve(parent, args, context) {
                const {db, token} = await context()
                if (!token) {
                    throw new Error("инвалидный токен")
                }
                if (token) {
                    // const decoded = jwt.verify(token, `${process.env.API_IDENTIFIER}`)
                    const decoded = jwt.verify(token, `lazeratrax`)
                    if (!decoded) {
                        throw new Error('ошибка декодера токена')
                    }
                    if (decoded) {
                        const user = await db.collection('users').findOne({id: decoded.userId});
                        return user ? {id: user.id, email: user.email, name: user.name} : {id: 0, email: '', name: ''};
                    }
                }
            }
        },
        post: {
            type: postType,
            args: {title: {type: new GraphQLNonNull(GraphQLString)}},
            async resolve(parent, args, context) {
                const title = args.title
                const {db} = await context()
                const post = db.collection('posts').findOne({title})
                return post
                // return Posts.findById(args.id)
            }
        },
        //выборка поста по названию
        posts: {
            type: new GraphQLList(postType),
            async resolve(parent, args, context) {
                const {db} = await context()
                const posts = db.collection('posts').find()
                return posts.toArray()
                // return Posts.find({})
            }
        },
        //выборка всех постов по юзеру
        // postsOfUser: {
        //     type: new GraphQLList(postType),
        //     async resolve(parent, args, context) {
        //         const {db} = await context()
        //         const posts = db.collection('posts').find()
        //         return posts.toArray()
        //         // return Posts.find({})
        //     }
        // },
        // me: {
        //     type: new GraphQLList(),
        //
        // }
    })
})

const Mutation = new GraphQLObjectType({
    name: 'Mutation',
    fields: () => ({
        signUp: {
            type: userType,
            args: {
                id: {type: GraphQLID},
                name: {type: new GraphQLNonNull(GraphQLString)},
                email: {type: new GraphQLNonNull(GraphQLString)},
                avatar: {type: GraphQLString},
                password: {type: new GraphQLNonNull(GraphQLString)},
            },
            async resolve(parent, args, context) {
                const {db} = await context();
                const name = args.name
                const email = args.email
                const password = args.password
                const hashPassword = await bcrypt.hash(password, 12);
                const newUser = {name, email, password: hashPassword};
                console.log('New user: ', newUser)
                db.collection("users").insertOne(newUser);
                return newUser
                // const user = new Users({
                //     id: args.id,
                //     name: args.name,
                //     email: args.email,
                //     // avatar: args.avatar,
                //     password: args.password
                // })
                // return user.save()
            }
        },
        logIn: {
            type: userType,
            args: {
                email: {type: new GraphQLNonNull(GraphQLString)},
                password: {type: new GraphQLNonNull(GraphQLString)},
            },
            async resolve(parent, args, context) {
                const email = args.email
                const password = args.password
                const {db} = await context()
                const user = await db.collection('users').findOne({email})
                if (!user) {
                    console.log(`такого пользователя не существует`)
                    throw new Error("такого пользователя не существует")
                }
                if (user) {
                    const isMatch = await bcrypt.compare(password, user.password)
                    if (!isMatch) {
                        console.log(`Неверный пароль, попробуйте еще раз`)
                        throw new Error("Неверный пароль, попробуйте еще раз")
                    }
                    if (isMatch) {
                        console.log("user", user)
                        const token = jwt.sign(
                            {userId: user.id},
                            // `${process.env.API_IDENTIFIER}`,
                            `lazeratrax`,
                            {expiresIn: '2h'}
                        )
                        return {access_token: token}
                    }
                }
            }
        },
        //редактирую пароль, мыло неизменно
        editUser: {
            type: userType,
            args: {
                email: {type: new GraphQLNonNull(GraphQLString)},
                password: {type: GraphQLString},
            },
            async resolve(parent, args, context) {
                const {db, token} = await context()
                if (!token) {
                    throw new Error("инвалидный токен")
                    // return res.status(401).json({message: "token отсутствует"})
                }
                if (token) {
                    // // const decoded = jwt.verify(token,`${process.env.API_IDENTIFIER}`)
                    const decoded = jwt.verify(token, `lazeratrax`)
                    // //раскодированный токен ложим в объект req
                    if (!decoded) {
                        throw new Error('ошибка декодера токена')
                    }
                    if (decoded) {
                        const email = args.email
                        const password = args.password
                        let user = await db.collection('users').findOne({email})
                        if (!user) {
                            console.log(`такого пользователя не существует`)
                            throw new Error("такого пользователя не существует")
                        }
                        if (user) {
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
                    }
                }
            }
        },
        deleteUser: {
            type: userType,
            args: {
                email: {type: new GraphQLNonNull(GraphQLString)},
                password: {type: new GraphQLNonNull(GraphQLString)},
            },
            async resolve(parent, args, context) {
                const {db, token} = await context()
                if (!token) {
                    throw new Error("инвалидный токен")
                    // return res.status(401).json({message: "token отсутствует"})
                }
                if (token) {
                    const decoded = jwt.verify(token, `lazeratrax`)
                    if (!decoded) {
                        throw new Error('ошибка декодера токена')
                    }
                    if (decoded) {
                        const email = args.email
                        const password = args.password
                        const user = await db.collection('users').findOne({email})
                        if (!user) {
                            console.log(`такого пользователя не существует`)
                            throw new Error("такого пользователя не существует")
                        }
                        if (user) {
                            const isMatch = await bcrypt.compare(password, user.password)
                            if (!isMatch) {
                                console.log(`Неверный пароль, попробуйте еще раз`)
                                throw new Error("Неверный пароль, попробуйте еще раз")
                            }
                            if (isMatch) {
                                return db.collection('users')
                                    .findOneAndDelete({email})
                                    .then(resp => resp.value)
                            }
                        }
                    }
                }
            }
        },
        addPost: {
            type: postType,
            args: {
                title: {type: new GraphQLNonNull(GraphQLString)},
                description: {type: new GraphQLNonNull(GraphQLString)},
                authorId: {type: userType}
            },
            async resolve(parent, args, context) {
                const {db, token} = await context()
                if (!token) {
                    throw new Error("инвалидный токен")
                    // return res.status(401).json({message: "token отсутствует"})
                }
                if (token) {
                    const decoded = jwt.verify(token, `lazeratrax`)
                    if (!decoded) {
                        throw new Error('ошибка декодера токена')
                    }
                    if (decoded) {
                        const title = args.title
                        const description = args.description
                        const authorId = args.authorId
                        //временной уникальный штамп
                        const postID = uuidv4();
                        const newPost = {postID, title, description, authorId}
                        db.collection("users").insertOne(newPost);
                        return newPost
                    }
                }
            }
        },
        editPost: {
            type: postType,
            args: {
                title: {type: GraphQLString},
                description: {type: GraphQLString},
                postId: {type: GraphQLNonNull(GraphQLString)},
                // authorId: {type: userType}
            },
            async resolve(parent, args, context) {
                const {db, token} = await context()
                if (!token) {
                    throw new Error("инвалидный токен")
                    // return res.status(401).json({message: "token отсутствует"})
                }
                if (token) {
                    // // const decoded = jwt.verify(token,`${process.env.API_IDENTIFIER}`)
                    const decoded = jwt.verify(token, `lazeratrax`)
                    // //раскодированный токен ложим в объект req
                    if (!decoded) {
                        throw new Error('ошибка декодера токена')
                    }
                    if (decoded) {
                        const title = args.title
                        const description = args.description
                        const postId = args.postId
                        // const authorId = args.authorId
                        db.collection('posts').findOneAndUpdate(
                            {postId},
                            {description: description, title: title},
                            {returnOriginal: false}
                        )
                    }
                }
            }
        },
        //deletePost
        deletePost: {
            type: postType,
            args: {
                // title: {type: GraphQLString},
                postId: {type: GraphQLNonNull(GraphQLString)},
                // authorId: {type: userType}
            },
            async resolve(parent, args, context) {
                const {db, token} = await context();
                if (!token) {
                    throw new Error("инвалидный токен")
                }
                if (token) {
                    const decoded = jwt.verify(token, `lazeratrax`)
                    if (!decoded) {
                        throw new Error('ошибка декодера токена')
                    }
                    if (decoded) {
                        const postId = args.postId
                        const post = await db.collection('posts').findOne({postId})
                        if (!post) {
                            throw new Error("такого поста не существует")
                        }
                        if (post) {
                            return db.collection('posts')
                                .findOneAndDelete({postId})
                                .then(resp => resp.value)
                        }
                    }
                }
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

