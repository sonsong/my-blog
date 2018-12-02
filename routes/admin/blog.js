const router = require('koa-router')();
//文件上传
const multer = require('koa-multer');

const Blogs = require('../../models/t-blog');

//配置上传图片的保存位置和文件名
var storage = multer.diskStorage({
    //文件保存路径
    destination(req, file, cb) {
        cb(null, 'static/upload/img/')
    },
    //修改文件名称
    filename(req, file, cb) {
        var fileName = (file.originalname).split(".");
        cb(null, `${fileName[0]}_${new Date().getTime()}.${fileName[1]}`);
    }
});
//配置上传文件存储的位置
const upload = multer({ storage });

//获取文章类型
router.get('getArtcleTypes', async(ctx) =>{
    let tags = [];
    await Blogs.aggregate([
        {
            //将tags数组拆分成单独的一项
            $unwind: '$tags'
        },
        {
            $group: {
                _id: '$tags',
            }
        }
    ], (err, docs) =>{
        if(!err){
            tags = docs;
        }
    })

    ctx.body = tags;
})

//图片上传
router.post('imgUpload', upload.single('editormd-image-file'), async(ctx) =>{
    ctx.body = {
        success: 1,        //0表示上传失败;1表示上传成功
        message: "上传成功",
        //文件名
        url: `/upload/img/${ctx.req.file.filename}`  //上传成功时才返回
    }
})
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

//获取文章列表
router.get('getAllArtcles', async(ctx, next) =>{

    let query = ctx.query;

    //当前页码
    let page = query.page === undefined ? 1 : parseInt(query.page);
    //每页显示数量
    let limit = query.limit === undefined ? 20 : parseInt(query.limit);

    //查询条件
    let params = {};
    delete query.page;
    delete query.limit;
    params = query;

    //判断是否有时间参数
    let publishTime = params.publishTime;
    if(publishTime){
        publishTime = publishTime.split(' - ');
        //设置查询参数 将时间转化成Date类型
        params.publishTime = {$gte: new Date((publishTime[0])), $lt: new Date((publishTime[1]))};
    }

    let blogs = [];
    //查询数据库中的所有文章
    await Blogs.find(params, '_id tags title publishTime', {skip: (page - 1) * limit, limit, sort: {'publishTime': 1}}, (err, docs) =>{
        if(!err){
            for (const item of docs) {
                let doc = {
                    _id        : item._id.toString(),
                    tags       : item.tags.toString(),
                    title      : item.title,
                    publishTime: ctx.moment(item.publishTime, ctx.moment.ISO_8601).format("YYYY-MM-DD HH:mm:ss")
                }
                
                blogs.push(doc);
            }
        }else{
            console.log(err)
        }
    });

    //查询数据库的总记录数
    let total = 0;
    await Blogs.countDocuments(params, (err, count) =>{
        if(!err){
            total = count;
        }
    });

    ctx.body = {
        code : 0,
        msg  : '查询成功',
        count: total,
        data : blogs
    };
});
//进入文章列表
router.get('artcle_list', async(ctx, next) =>{
    ctx.render('admin/artcle_list');
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
    ctx.render('admin/editor', {tags: blog.tags.toString(), title: blog.title, mdContent: blog.mdContent, id});
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

//删除指定的文章 del_artcle
router.get('del_artcle/:_ids', async(ctx) =>{
    //获取文章编码
    let ids = ctx.params._ids.split(',');

    //删除该文章
    try {
        await Blogs.deleteOne({_id: {$in: ids}}, (err) =>{
            if(!err){
                //查询所有的文章
                ctx.body = {message: '删除成功', code: '1'}
            }else{
                ctx.err_mess = '删除失败';
            }
        });
    } catch (error) {
        ctx.err_mess = '删除失败';
    }

    if(ctx.err_mess){
        ctx.body = {message: ctx.err_mess, code: '-1'};
    }
});

module.exports = router;