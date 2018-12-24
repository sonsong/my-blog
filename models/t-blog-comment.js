//文章评论表
const mongoose = require('mongoose');

//初始化文章评论的约束条件
var blogCommentsSchema = mongoose.Schema({
    //评论人
    comment_name: String,
    //评论时间
    comment_time: Date,
    //回复评论的人
    reply_name: String,
    //评论的文章编码
    artId: String,
    //评论内容
    content: String,
    //回复评论的编码，指向文章评论表的主键
    blogComment: {type: mongoose.Schema.Types.ObjectId, ref: 'tBlogComment'},
})

//建立约束与模型的映射关系
const tBlogComments = mongoose.model('tBlogComment', blogCommentsSchema);

module.exports = tBlogComments;