//文章评论表
const mongoose = require('mongoose');

//初始化文章评论的约束条件
var blogCommentsSchema = mongoose.Schema({
    //评论人
    comment_name: String,
    //回复谁的评论
    reply_name:String,
    //评论人头像
    comment_pic_url: String,
    //评论人email
    comment_email: String,
    //评论时间
    comment_time: Date,
    //评论的文章编码
    artId: String,
    //评论内容
    comment: String,
    //评论的编码，指向文章评论表的主键
    blogComment: {type: mongoose.Schema.Types.ObjectId, ref: 'tBlogComment'},
})

//建立约束与模型的映射关系
const tBlogComments = mongoose.model('tBlogComment', blogCommentsSchema);

module.exports = tBlogComments;