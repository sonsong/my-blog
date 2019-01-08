//用户模块
const router = require('koa-router')();
//axios 发送http 请求
const axios = require('axios');
const qs    = require('qs');

//博客实体
const Blogs = require('../models/t-blog');
//用户实体
const Users = require('../models/t-user');

//查询用户信息
router.use(async(ctx, next) =>{
    //查询admin信息
    await Users.findOne({uname: 'admin'}, '_id uname nname email motto introd picture resume').exec().then(doc =>{
        //没有内置账户 新增一个
        if(doc === null){
            Users.create({
                uname : 'admin',
                nname : '不专业的前端猿',
                passwd: '4a0cde71aee7158542d013fc0c9f5acfc735c612',
                role  : '0'
            }).then(res =>{
                ctx.user = {
                    _id    : res._id.toString(),
                    uname  : res.uname,
                    nname  : res.nname,
                    picture: res.picture
                };
            });
        }else{
            ctx.user = {
                _id       : doc._id.toString(),
                uname     : doc.uname,
                nname     : doc.nname,
                email     : doc.email,
                introd    : doc.introd,
                motto     : doc.motto,
                picture   : doc.picture,
                resumePath: doc.resume,
                resumeName: doc.resume && doc.resume.substring('/upload/file/'.length)
            };
        }
    }, e =>{
        console.log(e);
    })

    await next()
});

//根据关键字查询文章
router.get('searchArtcleByTag', async(ctx) =>{
    let param = ctx.query.search;

    let blogs = [];
    //查询正则 忽略大小写
    let reg = new RegExp(param, 'i');

    await Blogs.find({$or: [
        {tags: {$regex: reg}},
        {title: {$regex: reg}}
    ]}, '_id title', {sort: {'publishTime': -1}}).exec().then(docs =>{
        blogs = docs;
    }, e =>{
        console.log(e);
    })

    ctx.body = {blogs};
})
//进入首页
router.get('/', async(ctx, next) =>{
    let blogs = [];

    let ids      = ctx.query._id;
    let pageCode = ctx.query.pageCode === undefined ? 1 : parseInt(ctx.query.pageCode);
    let pageSize = 10;

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
        {skip: (pageCode - 1) * pageSize, limit: pageSize, sort: {'publishTime': -1}}).exec().then(docs => {
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
        }, e =>{
            console.log(e);
        });

    //查询数据库的总记录数
    let totalPage = 0;
    await Blogs.countDocuments(condition).then(count =>{
        let total     = count;
            totalPage = total % pageSize === 0 ?  total / pageSize : parseInt(total / pageSize) + 1;
    })
    //设置分页参数
    let pager = {
        pageCode,
        totalPage: totalPage,
        params
    };

    ctx.render('index', {blogs, pager, user: ctx.user});
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

    ctx.render('brief', {blogs: blogs, user: ctx.user});
});

//github第三方登陆
router.get('gitHub-login', async(ctx, next) =>{
    //github登陆后返回的编码
    let code = ctx.query.code;

    //github用户信息
    let gitHub_user = null;

    //进行登录操作
    let {client_id, client_secret} = ctx.gitHubInfo;
    let url                        = 'https://github.com/login/oauth/access_token';

    let access_token = '';

    await axios(url, {
        method : 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        data: {
            client_id,
            client_secret,
            code
        }
    }).then(res =>{
        //获取access_token
        access_token = qs.parse(res.data).access_token;
    }, e =>{
        console.log(e.message)   
    });

    //获取github的用户信息
    url = `https://api.github.com/user?access_token=${access_token}`;
    await axios.get(url).then(res =>{
        gitHub_user = res.data;
    }, e =>{
        console.log(e.message);
    });

    console.log(gitHub_user)

    let {login, name, avatar_url, email} = gitHub_user;
    let _name                            = name === null ? login : escape(name);

    //将获取到的用户信息存储到cookie中
    await ctx.cookies.set('gitHub_user', escape(JSON.stringify({_name, avatar_url, email})), {
        //cookie有效时长，单位：毫秒数 1小时
        maxAge   : 60 * 60 *1000,
        path     : "/",
        secure   : false,
        httpOnly : false,
        overwrite: true
    });

    let _artId = await ctx.cookies.get('artId');

    //重定向到文章预览页面
    ctx.redirect(`/preview?_id=${_artId}`);
})
//跳转到预览页面
router.get('preview', async(ctx, next) =>{
    //解析参数
    let id = ctx.query._id;

    //获取cookie中的文章编码，没有,保存，有，若是相同，跳过，不同覆盖
    let artId = ctx.cookies.get('artId');
    if(artId === undefined || id !== artId){
        await ctx.cookies.set('artId', id, {
            //cookie有效时长，单位：毫秒数 1小时
            maxAge   : 60 * 60 *1000,
            path     : "/",
            secure   : false,
            httpOnly : false,
            overwrite: true
        });
    }
    
    //查询到的文章信息
    let blog = {};

    //查询该文章的所有信息
    await Blogs.findById({_id: id}, '_id htmlContent title readNum').exec().then(doc => {
        blog = doc;

        //取出阅读次数，让其自增更新
        blog.updateOne({$set: {readNum: ++blog.readNum}}, (err, doc) =>{
            if(err){
                console.log(err);
            }
        });
    }, e =>{
        console.log(e);
    })

    //查询上一篇文章
    let preA = {};
    await Blogs.findOne({_id: {$lt: id}}, '_id title').exec().then(doc =>{
            if(doc === null){
                preA._id   = '';
                preA.title = '没有了^_^_^_^';
            }else{
                preA._id   = doc._id.toString();
                preA.title = doc.title;
            }
    })
    //查询下一篇文章
    let nextA = {};
    await Blogs.findOne({_id: {$gt: id}}, '_id title').exec().then(doc =>{
        if(doc === null){
            nextA._id   = '';
            nextA.title = '没有了^_^_^_^';
       }else{
           nextA._id   = doc._id.toString();
           nextA.title = doc.title;
       }
    })

    //告诉浏览器当前的运行环境
    let {client_id} = ctx.gitHubInfo;
    ctx.render('preview', {artId: id, htmlContent: blog.htmlContent, title: blog.title, preA, nextA, user: ctx.user, client_id});
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

    ctx.render("tags", {tags, user: ctx.user});
});

//关于我
router.get('about', async(ctx, next) =>{
    ctx.render('about', {user: ctx.user});
});

//导入文章评论路由
const blog_comment_router = require('./blog-comment');

router.use('', blog_comment_router.routes())

module.exports = router;
