//连接MongoDB数据库
const mongoose = require('mongoose');

mongoose.connect("mongodb://127.0.0.1:27017/my-blog", { useNewUrlParser: true});

mongoose.connection.once("open", ()=>{
    console.log("数据库连接成功~~~");
})
mongoose.connection.once("close", ()=>{
    console.log("关闭连接~~~");
});