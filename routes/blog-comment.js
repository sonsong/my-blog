//文章评论路由
const router = require('koa-router')();

const tBlogComment = require('../models/t-blog-comment');

//发送邮件方法
const sendEmail = require('../utils//sendEmail');

/** 
 * 新增文章评论
 *  有评论编码为回复评论
 *  评论成功，发送邮件告知对方，
 *      如果登陆的账号没有email 账号，提醒
*/
router.post('addComment', async(ctx, next) =>{
    //artId 文章编码 comment 评论 commentId 评论编码 增加回复评论时需要用到
    let {artId, comment, commentId, reply_name, emails} = ctx.request.body;

    //从cookie中获取登陆人的信息
    let {_name, avatar_url, email} = JSON.parse(unescape(ctx.cookies.get('gitHub_user')));
    
    //新增的评论
    let commentObj = {
        artId,
        comment,
        comment_name   : unescape(_name),
        comment_pic_url: avatar_url,
        comment_email  : email,
        comment_time   : new Date()
    }

    //回复评论
    if(commentId !== ''){
        Object.assign(commentObj, {
            blogComment: commentId,
            reply_name
        });
    }

    let mess = '';
    //新增
    await tBlogComment.create(commentObj).then(res =>{
        //发送邮件通知我，被回复的人
        let template = {};

        //发送给不同用户的模板
        let {sendTemplate_1, sendTemplate_2, auth} = ctx.email;
            sendTemplate_1.html                    = `
            <p>${unescape(_name)}(${email})评论了你的<a href="http://127.0.0.1:3000/preview?_id=${artId}">文章</a></p>
            <p>评论内容: </p>
            <p>${comment}</p>
        `;
        //发送给我的模板
        template = {
            sendTemp: sendTemplate_1,
            auth
        }
        sendEmail(template);

        //发送给被回复的人的模板
        if(emails !== undefined){
            sendTemplate_2.html = `
                <p>${unescape(_name)}(${email})回复了你评论的<a href="http://127.0.0.1:3000/preview?_id=${artId}">文章</a></p>
                <p>评论内容: </p>
                <p>${comment}</p>
            `;
            sendTemplate_2.to = emails.toString();
        }
        template.sendTemp = sendTemplate_2;
        sendEmail(template);

        mess = {code: 0, mess: "评论成功^_^_^_^"};
    }, e =>{
        mess = {code: -1, mess: `评论失败!!!, ${e.message}`};
    })

    ctx.body = mess;
})

//查询指定文章下的所有评论，分页显示 每页10条
router.get('getAllCommentByArtId/:artId', async(ctx, next) =>{
    //文章编码
    let artId = ctx.params.artId;

    //当前页码
    let page = ctx.query.page === undefined ? '1' : ctx.query.page;
    //每页显示条数
    let limit = 5;

    let comments = [];

    //查询该文章下的评论数
    await tBlogComment.find()
        .where({artId, blogComment: {$eq: undefined}})
        /* .skip((page-1) * limit)
        .limit(limit) */
        .sort({comment_time: -1})
        .exec().then(res =>{
            //数据加工
            res.forEach(data =>{
                let {_id, artId, comment, comment_name, comment_pic_url, comment_email, comment_time} = data;

                comments.push({
                    _id: _id.toString(),
                    artId,
                    comment,
                    comment_name,
                    comment_pic_url,
                    comment_email,
                    comment_time: ctx.moment(comment_time, ctx.moment.ISO_8601).format("YYYY-MM-DD HH:mm:ss")
                });
            })
        }, e =>{
            console.log(e);
        })
    
    //所有评论的回复
    for (const key in comments) {
        comments[key].replys = [];

        await tBlogComment.find({artId, blogComment: comments[key]._id}).exec().then(docs =>{
            //数据加工
            docs.forEach(data =>{
                let {_id, comment, comment_name, reply_name, comment_pic_url, comment_email, comment_time} = data;

                comments[key].replys.push({
                    _id: _id.toString(),
                    comment,
                    comment_name,
                    reply_name,
                    comment_pic_url,
                    comment_email,
                    comment_time: ctx.moment(comment_time, ctx.moment.ISO_8601).format("YYYY-MM-DD HH:mm:ss")
                });
            })
        }, e =>{
            console.log(e);
        });
    }

    //查询数据库的总记录数
    let total = 0;
    await tBlogComment.countDocuments({artId, blogComment: {$eq: undefined}}).then(res =>{
        total = res
    });

    let tPage = total % limit === 0 ?  total / limit : parseInt(total / limit) + 1;
    let pager = {
        page,
        tPage,
        total
    }
    
    ctx.body = {comments,pager};
})

module.exports = router;