const mongoose = require('mongoose');

//用户模块
const router = require('koa-router')();
const qs = require('qs');

//博客实体
const Blogs = require('../models/t-blog');


//进入首页
router.get('/', async(ctx, next) =>{
    ctx.render('index');
});

//写文章
router.get('editor', async(ctx, next) =>{
    ctx.render('user/editor');
});

//提交文章
router.post('publish', async(ctx, next) =>{

    let mdContent = ctx.request.body['editormd-markdown-doc'];
    let htmlContent = ctx.request.body['htmlContent'];

    //博客对象
    let blogs = {
        author: 'Huangss',
        title: '关于java的那些事',
        type: 'java',
        publishTime: ctx.moment,
        mdContent,
        htmlContent
    };

    await Blogs.create(blogs, (err) =>{});

    //跳转到文章列表页面
    ctx.redirect("/artcle_list");
});

//进入文章列表
router.get('artcle_list', async(ctx, next) =>{

    let blogArr = [];
    //查询数据库中的所有文章
    await Blogs.find({}, '_id type title publishTime', (err, docs) =>{
        if(!err){
            blogArr = docs;
        }
    });

    ctx.render('user/artcle_list', {blogArr});
});

//修改指定文章
router.get('updateArtcle', async(ctx, next) =>{
    //解析参数
    let id = mongoose.Types.ObjectId(ctx.query.id)
    //查询到的文章信息
    let blog = {};

    //查询该文章的所有信息
    await Blogs.findById({_id: id}, (err, doc) =>{
        if(!err){
            blog = doc;
        }
    });

    //回到编辑页面
    ctx.render('user/editor', {blog});
});

//跳转到预览页面
router.get('preViewArtcle', async(ctx, next) =>{
    //解析参数
    /* let id = mongoose.Types.ObjectId(ctx.query.id.toString());
    console.log(id); 
    return*/

    //查询到的文章信息
    let blog = {};

    //查询该文章的所有信息
    await Blogs.findById({_id: "5bea490075e0b54b84ab53fe"}, (err, doc) =>{
        if(!err){
            blog = doc;
        }
    });

    ctx.render('user/preViewArtcle', {htmlContent: blog.htmlContent});
});

//删除指定的文章
router.get('delArtcle', async(ctx, next) =>{
    //获取文章编码
    let id = mongoose.Types.ObjectId(ctx.query.id)

    //删除该文章
    Blogs.remove({_id: id}, (err) =>{
        if(!err){
            ctx.status = 200;
            ctx.body = {mess: '删除成功', status: 'ok'};
        }
    })
});

module.exports = router;