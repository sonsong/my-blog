const mongoose = require('mongoose');

//初始化blog-img集合的约束条件
var blogImgsSchema = mongoose.Schema({
    //图片路径
    path: String,
    //谁上传的  外键，映射到tUser表的主键 ref 的值是mongoose.model('tUser', usersSchema);
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'tUser'},
    //上传时间
    createTime: Date
})

//建立约束与模型的映射关系
const tBlogImgs = mongoose.model('tBlogImg', blogImgsSchema);

module.exports = tBlogImgs;