//用户模块
const router = require('koa-router')();
const blog_router = require('./blog');

//博客实体
const Blogs = require('../models/t-blog');

//进入首页
router.get('/', async(ctx, next) =>{
    let blogs = [];

    let ids = ctx.query._id;

    //查询条件
    let condition = {};
    if(ids !== undefined){
        ids = ids.split(',');
        condition = {_id: {$in: ids}};
    }

    //加载数据库的所有文章, 只显示10条
    await Blogs.find(condition, '_id tags title publishTime htmlContent readNum', {limit: 10},(err, docs) =>{
        if(!err){
            for (const item of docs) {
                let doc = {
                    _id: item._id.toString(),
                    tags: item.tags,
                    title: item.title,
                    //moment()的第二个参数，指定时间的类型
                    publishTime: ctx.moment(item.publishTime, ctx.moment.ISO_8601).format("YYYY-MM-DD HH:mm:ss"),
                    htmlContent: item.htmlContent,
                    readNum: item.readNum
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

//跳转到修改文章页面
router.get('updateArtcle', async(ctx, next) =>{
    //解析参数
    let id = ctx.query.id;
    //查询到的文章信息
    let blog = {};

    //查询该文章的所有信息
    await Blogs.findById({_id: id}, 'tags title mdContent', (err, doc) =>{
        if(!err){
            blog = doc;
        }
    });

    //回到编辑页面
    ctx.render('editor', {tags: blog.tags.toString().replace(',', ' '), title: blog.title, mdContent: blog.mdContent, id});
});

//关于我
router.get('about', async(ctx, next) =>{
    ctx.render('about');
});

//导入blog路由
router.use('blog/', blog_router.routes());

module.exports = router;
