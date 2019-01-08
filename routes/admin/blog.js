const router = require('koa-router')();
//文件上传
const multer = require('koa-multer');

const fs     = require('fs');
const moment = require('moment');

//博客实体
const Blogs = require('../../models/t-blog');
//博客图片实体
const BlogImgs = require('../../models/t-blog-img');

//配置上传图片的保存位置和文件名
var storage = multer.diskStorage({
    //文件保存路径
    async destination(req, file, cb) {
        let root = 'static/upload/blog-img/';
        let dir  = moment().format('YYYY-MM-DD');

        //图片保存的位置
        let path = root + dir;

        //判断dir目录是否存在
        await fs.stat(path, (err, stats) =>{
            if(err){
                //不存在 创建文件夹
                fs.mkdirSync(path);
            }
        })

        cb(null, path);
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

//图片上传 单文件上传
router.post('imgUpload', upload.single('editormd-image-file'), async(ctx) =>{
    //上传图片信息
    let img = ctx.req.file;

    //上传路径
    let path = `/upload/blog-img/${moment().format('YYYY-MM-DD')}/${img.filename}`;

    //将写文章上传的图片跟用户管理，方便与图片管理
    await BlogImgs.create({
        user: ctx.state.user.id,
        path,
        createTime: new Date()
    }).then(res =>{
        if(res){
            ctx.body = {
                success: 1,        //0表示上传失败;1表示上传成功
                message: "上传成功",
                //文件名
                url: path  //上传成功时才返回
            }
        }else{
            ctx.body = {
                success: 0,
                message: '图片路径含有非法字符'
            }
        }
    })
})

//写文章
router.get('editor', async(ctx, next) =>{
    ctx.render('admin/blog/editor');
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
    ctx.redirect('/admin/blog/');
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
    //删除分页属性
    Reflect.deleteProperty(query, 'page');
    Reflect.deleteProperty(query, 'limit');
    
    params = query;

    //判断是否有时间参数
    let publishTime = params.publishTime;
    if(publishTime){
        publishTime = publishTime.split(' - ');
        //设置查询参数 将时间转化成Date类型
        params.publishTime = {$gte: new Date(publishTime[0]), $lt: new Date(publishTime[1])};
    }

    let blogs = [];

    //查询数据库中的所有文章
    await Blogs.find(params, '_id tags title publishTime', {skip: (page - 1) * limit, limit, sort: {'publishTime': -1}}, (err, docs) =>{
        try {
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
                ctx.body = ctx.result;
            }
        } catch (e) {
            ctx.body = ctx.result;
        }
    });

    //查询数据库的总记录数
    let total = 0;
    await Blogs.countDocuments(params).then(count =>{
        total = count;
    });

    ctx.result.count = total;
    ctx.result.data  = blogs;

    ctx.body = ctx.result;
});
//进入文章列表
router.get('/', async(ctx, next) =>{
    ctx.render('admin/blog/artcle_list');
});

//跳转到修改文章页面
router.get('update_artcle', async(ctx) =>{
    //解析参数
    let id = ctx.query._id;
    //查询到的文章信息
    let blog = {};

    //查询该文章的所有信息
    await Blogs.findOne({_id: id}, 'tags title mdContent').exec().then(res =>{
        blog = res;
    })

    //回到编辑页面
    ctx.render('admin/blog/editor', {tags: (blog.tags).toString(), title: blog.title, mdContent: blog.mdContent, id});
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

    ctx.render('admin/blog/preview', {htmlContent: blog.htmlContent});
});

//删除指定的文章 del_artcle
router.get('del_artcle/:ids', async(ctx) =>{
    //获取文章编码
    let ids = ctx.params.ids.split(',');

    //删除该文章
    try {
        await Blogs.deleteMany({_id: {$in: ids}}, (err) =>{
            if(!err){
                //查询所有的文章
                ctx.body = {message: '删除文章成功', code: 1}
            }else{
                ctx.err_mess = '删除文章失败';
            }
        });
    } catch (e) {
        ctx.err_mess = '删除文章失败';
    }

    if(ctx.err_mess){
        ctx.throw(555, ctx.err_mess);
    }
});

//导入博客图片路由
let img_router = require('./img');
router.use('img/', img_router.routes());

module.exports = router;