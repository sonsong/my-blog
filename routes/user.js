//用户模块
const router = require('koa-router')();
const blog_router = require('./blog');

//博客实体
const Blogs = require('../models/t-blog');


//进入首页
router.get('/', async(ctx, next) =>{
    let blogs = [];

    //加载数据库的所有文章
    await Blogs.find({}, '_id type title publishTime htmlContent', (err, docs) =>{
        if(!err){
            for (const item of docs) {
                let doc = {
                    _id: item._id.toString(),
                    type: item.type,
                    title: item.title,
                    publishTime: item.publishTime,
                    htmlContent: item.htmlContent
                }

                blogs.unshift(doc);
            }
        }
    });

    ctx.render('index', {blogs});
});

//写文章
router.get('editor', async(ctx, next) =>{
    ctx.render('editor');
});

//导入blog路由
router.use('blog/', blog_router.routes());

module.exports = router;
