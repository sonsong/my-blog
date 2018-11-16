//用户模块
const router = require('koa-router')();

//博客实体
const Blogs = require('../models/t-blog');

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
            $sort:{"publishTime": -1}
        }
    ], (err, docs) =>{
        if(!err){
            blogs = docs;
        }
    });

    let _blogs = [];
    //进行数据处理
    for (const item of blogs) {
        let breif = {
            time: item._id,
            sum: item.sum,
            detail:[]
        };
        let _detail = [];
        let titles = item.titles;
        let ids = item.id;
        let publishTimes = item.publishTime;

        for (const index in titles) {
            _detail.push({
                _id: ids[index].toString(),
                publishTime: ctx.moment(publishTimes[index], ctx.moment.ISO_8601).format("YYYY-MM-DD HH:mm:ss"),
                title: titles[index]
            });
        }

        breif.detail = _detail;
        _blogs.push(breif);
    }

    ctx.render('brief', {blogs: _blogs});
});

//提交文章 如果参数中文章id = '' 表示新增, 否则为更新/
router.post('publish', async(ctx, next) =>{
    //所有的表单参数
    let params = ctx.request.body;

    //文章编码
    let id = params['id'];
    //文章标题
    let title = params['title'];
    //文章分类
    let tags = params['tags'].split(',');
    //通过set集合去重, 再转成数组
    tags = Array.from(new Set(tags));

    //作者
    let author = "huangss";
    //md格式的内容
    let mdContent = params['mdContent'];
    //html格式的内容
    let htmlContent = params['htmlContent'];    

    //博客对象
    let blog = {
        title,
        tags,
        mdContent,
        htmlContent
    };

    //生成时间函数
    let moment = ctx.moment;

    if(id === null || id === ''){
        //增加作者字段
        blog.author = author;
        //增加发表时间
        blog.publishTime = moment();
        //增加阅读次数
        blog.readNum = 0;

        //新增
        await Blogs.create(blog, (err) =>{
            if(!err){
                console.log("新增文章成功");
            }
        });
    }else{
        //增加更新时间
        blog.updateTime = moment();

        //修改文章
        await Blogs.updateOne({_id: id}, blog, (err) =>{
            if(!err){
                console.log("修改文章成功");
            }
        });
    }

    //跳转到文章列表页面
    ctx.redirect("artcle_list");
});

//进入文章列表
router.get('artcle_list', async(ctx, next) =>{

    let blogs = [];
    //查询数据库中的所有文章
    await Blogs.find({}, '_id tags title publishTime', (err, docs) =>{
        if(!err){
            for (const item of docs) {
                let doc = {
                    _id: item._id.toString(),
                    tags: item.tags.toString(),
                    title: item.title,
                    publishTime:  ctx.moment(item.publishTime, ctx.moment.ISO_8601).format("YYYY-MM-DD HH:mm:ss")
                }

                blogs.unshift(doc);
            }
        }
    });

    ctx.render('artcle_list', {blogs});
});

//跳转到预览页面
router.get('preview', async(ctx, next) =>{
    //解析参数
    let id = ctx.query.id;

    //查询到的文章信息
    let blog = {};

    //查询该文章的所有信息
    await Blogs.findById({_id: id}, (err, doc) =>{
        if(!err){
            blog = doc;

            //取出阅读次数，让其自增更新
            blog.updateOne({$set: {readNum: ++blog.readNum}}, (err) =>{});
        }
    });

    ctx.render('preview', {htmlContent: blog.htmlContent});
});

//删除指定的文章
router.get('delArtcle', async(ctx, next) =>{
    //获取文章编码
    let id = ctx.query.id;

    //删除该文章
    await Blogs.deleteOne({_id: id}, (err) =>{
        if(!err){
            console.log("删除文章成功");
        }
    });

    //回到文章列表
    ctx.redirect("artcle_list");
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
                id:{
                    $push: '$_id'
                },
                sum: {
                    $sum: 1
                }
             }
        }
    ], (err, docs) =>{
        if(!err){
            docs.forEach(ele => {
                let ids = ele.id.map(id => id.toString());
                tags.push({
                    tag: ele._id,
                    _ids: ids.toString(),
                    sum: ele.sum
                });
            });
        }
    })

    ctx.render("tags", {tags});
});

module.exports = router;