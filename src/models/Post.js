const mongoose = require('mongoose')
const Schema = mongoose.Schema

const postSchema = new Schema({
    postId: Number,
    title: String,
    description: String,
    authorId: Number
})

module.exports = mongoose.model('Post', postSchema, 'posts')