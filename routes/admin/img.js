const router = require('koa-router')();

//博客图片实体
const BlogImgs = require('../../models/t-blog-img');

//获取图片数据
router.get('getAllImgs', async(ctx) =>{
    let query = ctx.query;
    let user = ctx.state.user;

    //当前页码
    let page = query.page === undefined ? 1 : parseInt(query.page);
    //每页显示数量
    let limit = query.limit === undefined ? 20 : parseInt(query.limit);

    //查询条件
    let params = {};
    //删除分页属性
    Reflect.deleteProperty(query, page);
    Reflect.deleteProperty(query, limit);

    params = query;
    
    //如果不是管理员， 只查自己的博客
    if(user.role !== '0'){
        params._id = user.id;
    }

    let imgs = [];
    //查询数据库中的所有图片
    BlogImgs.find(params).populate('"userId"').exec((err, docs) =>{
        console.log(docs)
    })

    return;

    //查询数据库的总记录数
    let total = 0;
    await BlogImgs.countDocuments(params, (err, count) =>{
        if(!err){
            total = count;
        }
    });

    ctx.body = {
        code : 0,
        msg  : '查询成功',
        count: total,
        data : imgs
    };
})
//跳转到图片管理页面
router.get('/', async(ctx) =>{
    ctx.render('admin/blog_img_list');
})

module.exports = router;