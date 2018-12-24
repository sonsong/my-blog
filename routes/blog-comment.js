//文章评论路由
const router = require('koa-router')();

const tBlogComment = require('./../models/t-blog-comment');

/** 
 * 新增文章评论
 *  有评论编码为心中回复评论
 *  评论成功，发送邮件告知对方，
 *      如果登陆的账号没有email 账号，提醒
*/
router.post('addComment', async(ctx, next) =>{


})

//查询指定文章下的所有评论，分页显示 每页10条
router.get('getAllCommentByArtId/:artId', async(ctx, next) =>{
    //文章编码
    let artId = ctx.params.artId;

    //当前页码
    let page = ctx.query.page === undefined ? '1' : ctx.query.page;
    //每页显示条数
    let limit = 10;

    let comments = [];

    //查询该文章下的评论数
    await tBlogComment.find()
        .populate([{path: 'tBlogComment'}])
        .where({_id: artId})
        .skip((page-1) * limit)
        .limit(limit)
        .sort({comment_time: 1})
        .exec().then(res =>{
            console.log(res);
        }, e =>{
            console.log(e);
        })

    ctx.body = {comments};
})

module.exports = router;