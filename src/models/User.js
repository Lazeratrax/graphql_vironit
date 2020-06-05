const mongoose = require('mongoose')
const Schema = mongoose.Schema

const userSchema = new Schema({
    id: Number,
    name: String,
    email: String,
    avatar: String,
    password: String
})

//обязательно явно указывать коллекцию! без - не работвет
module.exports = mongoose.model('User', userSchema, 'users')
