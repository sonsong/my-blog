const mongoose = require('mongoose');

//初始化blog集合的约束条件
var blogsSchema = mongoose.Schema({
    //作者
    author: String,
    //文章标题
    title: String,
    //文章类型
    tags: Array,
    //发表时间
    publishTime: Date,
    //更新时间
    updateTime: Date,
    //md内容
    mdContent: String,
    //html内容
    htmlContent: String,
    //浏览次数
    readNum: Number
})

//建立约束与模型的映射关系
const tBlogs = mongoose.model('tBlog', blogsSchema);

module.exports = tBlogs;