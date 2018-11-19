const router = require('koa-router')();

const Blogs = require('../../models/t-blog');

//写文章
router.get('editor', async(ctx, next) =>{
    ctx.render('admin/editor');
});

//提交文章 如果参数中文章id = '' 表示新增, 否则为更新
router.post('publish', async(ctx, next) =>{
    //所有的表单参数
    let params = ctx.request.body;

    //文章编码
    let id = params['_id'];
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

    ctx.render('admin/artcle_list', {blogs});
});

//跳转到修改文章页面
router.get('update_artcle', async(ctx, next) =>{
    //解析参数
    let id = ctx.query._id;
    //查询到的文章信息
    let blog = {};

    //查询该文章的所有信息
    await Blogs.findById({_id: id}, 'tags title mdContent', (err, doc) =>{
        if(!err){
            blog = doc;
        }
    });

    //回到编辑页面
    ctx.render('admin/editor', {tags: blog.tags.toString().replace(',', ' '), title: blog.title, mdContent: blog.mdContent, id});
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
        }
    });

    ctx.render('admin/preview', {htmlContent: blog.htmlContent});
});

//删除指定的文章
router.get('del_artcle', async(ctx, next) =>{
    //获取文章编码
    let id = ctx.query._id;

    //删除该文章
    await Blogs.deleteOne({_id: id}, (err) =>{
        if(!err){
            console.log("删除文章成功");
        }
    });

    //回到文章列表
    ctx.redirect("artcle_list");
});

module.exports = router;