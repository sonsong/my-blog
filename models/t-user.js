const mongoose = require('mongoose');

//初始化user集合的约束条件
var usersSchema = mongoose.Schema({
    //用户名
    uname: String,
    //密码
    passwd: String,
    //邮箱
    email: String,
    //座右铭
    motto: String,
    //简介
    introd: String,
    //头像
    picture: String,
    //创建时间
    createTime: Date,
    //角色
    role: Number
})

//建立约束与模型的映射关系
const tUsers = mongoose.model('tUser', usersSchema);

module.exports = tUsers;