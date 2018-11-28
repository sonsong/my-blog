const router = require('koa-router')();
const URL = require('url');
const qs  = require('querystring');

const Blogs = require('../../models/t-blog');

//处理查询条件
router.post('handlerQuery', async(ctx, next) =>{
    let params = ctx.request.body;
    let query  = '';

    //参数过滤 空参数不要
    for (const key in params) {
        if (params.hasOwnProperty(key)) {
            if(params[key] !== ''){
                query += `${key}=${params[key]}&`
            }
        }
    }

    //去掉最后一个&
    query = query.substring(0, query.length-1);

    console.log(`query=${query}`)

    //重定向到文章列表页面
    ctx.redirect(`artcle_list?${query}`);
})
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

    //当前页码
    let pageCode = ctx.query.pageCode === undefined ? 1 : parseInt(ctx.query.pageCode);
    //每页显示数量
    let pageSize = ctx.query.pageSize === undefined ? 1 : parseInt(ctx.query.pageSize);

    //查询条件
    let condition = '';

    let search = URL.parse(ctx.url).search;

    //url 携带参数
    if(search !== null){
        if(search.indexOf("?pageCode") !== -1){
            //咩有其它多余的条件
            condition = '';
        }else{
            let index = search.indexOf("&pageCode") === -1 ? -1 : search.indexOf("&pageCode");
            if(index === -1){
                //去掉问好
                condition = search.substring(1);
            }else{
                condition = search.substring(1, index);
            }
        }
    }

    //判断是否有时间参数
    let _condition = qs.parse(condition);

    let publishTime = _condition.publishTime;
    if(publishTime){
        publishTime = publishTime.split(' - ');
        //设置查询参数 将时间转化成Date类型
        _condition.publishTime = {$gte: ctx.moment((publishTime[0])), $lt: ctx.moment((publishTime[1]))};
    }

    let blogs = [];
    //查询数据库中的所有文章
    await Blogs.find(_condition, '_id tags title publishTime')
            .skip((pageCode - 1) * pageSize)
            .limit(pageSize)
            .sort({'publishTime': 1})
            .exec((err, docs) =>{
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
    let totalPage = 0;
    await Blogs.countDocuments(_condition, (err, count) =>{
        if(!err){
            let total = count;

            totalPage = total % pageSize === 0 ?  total / pageSize : parseInt(total / pageSize) + 1;
        }
    });

    let params = '?';
    if(condition !== ''){
        params += condition + '&';
    }

    let pager = {
        pageCode,
        totalPage,
        params  
    };

    ctx.render('admin/artcle_list', {blogs, pager});
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

//删除指定的文章
router.get('del_artcle/:_id', async(ctx, next) =>{
    //获取文章编码
    let id = ctx.params._id;

    //删除该文章
    try {
        await Blogs.deleteOne({_id: id}, (err) =>{
            if(!err){
                ctx.body = {message: '删除成功', code: '1'}
            }else{
                ctx.err_message = '删除失败';
            }
        });
    } catch (error) {
        ctx.err_message = '删除失败';
    }

    if(ctx.err_message){
        ctx.body = {message: ctx.err_message, code: '-1'};
    }
});

module.exports = router;