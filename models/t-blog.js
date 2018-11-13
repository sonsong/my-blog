const mongoose = require('mongoose');

//初始化blog集合的约束条件
var blogsSchema = mongoose.Schema({
    author: String,
    title: String,
    type: String,
    publishTime: String,
    mdContent: String,
    htmlContent: String
})

//建立约束与模型的映射关系
const tBlogs = mongoose.model('tBlog', blogsSchema);

module.exports = tBlogs;