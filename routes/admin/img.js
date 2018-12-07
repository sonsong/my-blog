const router = require('koa-router')();

//博客图片实体
const BlogImgs = require('../../models/t-blog-img');
const fs = require('fs');

//删除图片
router.get('delImg/:ids', async(ctx) =>{
    //图片编码
    let ids = ctx.params.ids;
    //图片路径
    let path = ctx.query.paths;

    await BlogImgs.deleteMany({_id: {$in: ids.split(',')}}, (err) =>{
        try {
            if(!err){
                //将服务器的图片同时删除
                path.split(',').forEach(path =>{
                    fs.unlinkSync(`static${path}`);
                })
                ctx.body = {message: '删除图片成功', code: 1}
            }else{
                ctx.err_mess = '删除图片失败';
            }
        } catch (e) {
            ctx.err_mess = '删除图片失败';
        }

        if(ctx.err_mess){
            ctx.throw(555, ctx.err_mess);
        }
    })
})
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
    Reflect.deleteProperty(query, 'page');
    Reflect.deleteProperty(query, 'limit');

    params = query;
    let where = {};

    //uname是用户的字段
    if(params.uname){
        where.uname = params.uname;
        Reflect.deleteProperty(params, 'uname');
    }
    //如果不是管理员， 只查自己的博客
    if(user.role !== '0'){
        params.user = user.id;
    }

    //处理时间查询
    if(params.createTime){
        let times = params.createTime.split(' - ');
        params.createTime = {$gte: new Date(times[0]), $lt: new Date(times[1])};
    }
    
    let imgs = [];
    //查询数据库中的所有图片
    /** 
    * path: 外键字段
    * math： 查询条件
    * select: 查询字段
    * options： limit、sort 等字段
    */
    await BlogImgs.find()
        .populate([{path: 'user', match: where, select: '_id uname'}])
        .where(params)
        .skip((page-1) * limit)
        .limit(limit)
        .sort({createTime: 1})
        .exec().then(res =>{
            if(res){
                //对数据处理
                for (const img of res) {
                    //关联表没有记录返回null 主表仍然返回数据
                    if(img.user !== null){
                        imgs.push(
                            {
                                _id: img._id.toString(),
                                uid: img.user._id.toString(),
                                uname: img.user.uname,
                                path: img.path,
                                createTime: ctx.moment(img.createTime, ctx.moment.ISO_8601).format("YYYY-MM-DD HH:mm:ss")
                            }
                        );
                    }
                }
            }
        }, e =>{
            ctx.body = ctx.result;
        })
    
    //统计总数
    await BlogImgs.countDocuments()
        .where(params)
        .populate([{path: 'user', match: where}])
        .exec().then(count =>{
            ctx.result.count = count;
            ctx.result.data = imgs;

            ctx.body = ctx.result;
        })
})
//跳转到图片管理页面
router.get('/', async(ctx) =>{
    ctx.render('admin/blog/blog_img_list');
})

module.exports = router;