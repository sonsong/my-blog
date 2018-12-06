//用户模块
const router = require('koa-router')();

//博客实体
const Blogs = require('../models/t-blog');
//用户实体
const Users = require('../models/t-user');

//获取用户信息
router.get('getUserInfo', async(ctx) =>{
    let user = {};
    await Users.findOne({uname: 'admin'}, (err, doc) =>{
        if(!err){
            user = doc;
        }
    })

    ctx.body = {user};
})
//根据关键字查询文章
router.get('searchArtcleByTag', async(ctx) =>{
    let tag = ctx.query.search;

    let blogs = [];
    await Blogs.find({tags: tag}, (err, docs) =>{
        if(!err){
            blogs = docs;
        }
    })

    ctx.body = {blogs};
})
//进入首页
router.get('/', async(ctx, next) =>{
    let blogs = [];

    let ids      = ctx.query._id;
    let pageCode = ctx.query.pageCode === undefined ? 1 : parseInt(ctx.query.pageCode);
    let pageSize = 5;

    //查询条件
    let condition = {};
    let params    = '?';

    if(ids !== undefined){
        params = `?_id=${ids}&`;
        
        ids       = ids.split(',');
        condition = {_id: {$in: ids}};
    }

    //加载数据库的文章, 进行分页， 每页显示10条 -1升序 1降序
    await Blogs.find(condition, '_id tags title publishTime htmlContent readNum', 
        {skip: (pageCode - 1) * pageSize, limit: pageSize, sort: {'publishTime': -1}}, 
        (err, docs) =>{
            if(!err){
                for (const item of docs) {
                    let doc = {
                        _id  : item._id.toString(),
                        tags : item.tags,
                        title: item.title,
                        //moment()的第二个参数，指定时间的类型
                        publishTime: ctx.moment(item.publishTime, ctx.moment.ISO_8601).format("YYYY-MM-DD HH:mm:ss"),
                        htmlContent: item.htmlContent,
                        readNum    : item.readNum
                    }

                    blogs.push(doc);
                }
            }
    })

    //查询数据库的总记录数
    let totalPage = 0;
    await Blogs.countDocuments(condition, (err, count) =>{
        if(!err){
            let total     = count;
                totalPage = total % pageSize === 0 ?  total / pageSize : parseInt(total / pageSize) + 1;
        }
    });

    //设置分页参数
    let pager = {
        pageCode,
        totalPage: totalPage,
        params
    };

    ctx.render('index', {blogs, pager});
});

//进入文章简史
router.get('brief', async(ctx, next) =>{
    //查询每个月所有文章
    let blogs = [];
    await Blogs.aggregate([
        {
            $group: {
                _id: {
                    $dateToString: {format: '%Y-%m', date: '$publishTime'}
                },
                titles:{
                    $push: '$title'
                },
                id:{
                    $push: '$_id'
                },
                publishTime:{
                    $push: '$publishTime'
                },
                sum: {
                    $sum: 1
                }
            }
        },
        {
            $sort: {"publishTime": -1}
        }
    ]).then(docs =>{
        //进行数据处理
        for (const item of docs) {
            let breif = {
                time  : item._id,
                sum   : item.sum,
                detail: []
            };
            let _detail      = [];
            let titles       = item.titles;
            let ids          = item.id;
            let publishTimes = item.publishTime;

            for (const index in titles) {
                _detail.push({
                    _id        : ids[index].toString(),
                    publishTime: ctx.moment(publishTimes[index], ctx.moment.ISO_8601).format("YYYY-MM-DD HH:mm:ss"),
                    title      : titles[index]
                });
            }

            breif.detail = _detail;
            blogs.push(breif);
        }
    })

    ctx.render('brief', {blogs: blogs});
});

//跳转到预览页面
router.get('preview', async(ctx, next) =>{
    //解析参数
    let id = ctx.query._id;

    //查询到的文章信息
    let blog = {};

    //查询该文章的所有信息
    await Blogs.findById({_id: id}, '_id, htmlContent', (err, doc) =>{
        if(!err){
            blog = doc;

            //取出阅读次数，让其自增更新
            blog.updateOne({$set: {readNum: ++blog.readNum}}, (err) =>{});
        }
    });

    //查询上一篇文章
    let preA = {};
    await Blogs.findOne({_id: {$lt: id}}, '_id title', (err, doc) =>{
        if(!err){
            if(doc === null){
                preA._id   = '';
                preA.title = '没有了^_^_^_^';
            }else{
                preA._id   = doc._id.toString();
                preA.title = doc.title;
            }
         }
    });
    //查询下一篇文章
    let nextA = {};
    await Blogs.findOne({_id: {$gt: id}}, '_id title', (err, doc) =>{
        if(!err){
           if(doc === null){
                nextA._id   = '';
                nextA.title = '没有了^_^_^_^';
           }else{
               nextA._id   = doc._id.toString();
               nextA.title = doc.title;
           }
        }
    });

    ctx.render('preview', {htmlContent: blog.htmlContent, preA, nextA});
});

//进入标签页
router.get('tags', async(ctx, next) =>{
    let tags = [];

    //查询文章中出现的所有标签, 
    await Blogs.aggregate([
        {
            //将tags数组拆分成单独的一项
            $unwind: '$tags'
        },
        {
            $group: {
                _id: '$tags',
                id : {
                    $push: '$_id'
                },
                sum: {
                    $sum: 1
                }
             }
        }
    ]).then(docs =>{
        docs.forEach(ele => {
            let ids = ele.id.map(id => id.toString());
            tags.push({
                tag : ele._id,
                _ids: ids.toString(),
                sum : ele.sum
            });
        });
    })

    ctx.render("tags", {tags});
});

//关于我
router.get('about', async(ctx, next) =>{
    ctx.render('about');
});

module.exports = router;
