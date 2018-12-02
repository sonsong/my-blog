//管理员模块模块
const router = require('koa-router')();

//博客路由
const blog_router = require('./admin/blog');
//用户路由
const user_router = require('./admin/user');

const Users = require('../models/t-user');

//进入首页
router.get('/', async(ctx, next) =>{
    ctx.render('admin/index');
});

//跳转到登陆页面
router.get('/login', async(ctx, next) =>{
    ctx.render('admin/login');
});
//用户登陆获取token
router.post('/toLogin', async(ctx, next) =>{
    
    //获取用户名和密码
    let uname  = ctx.request.body.uname;
    let passwd = ctx.request.body.passwd;

    //校验用户名和密码
    //在回调函数中抛出的异常的外面无法被try..catch捕获的，不在同一个执行流中
    await Users.findOne({uname}, (err, doc) =>{
        try {
            if(!err){
                //验证密码是否正确
                if(passwd === doc.passwd){
                    //载体
                    let payload = {id: doc._id.toString(), name: doc.uname, picture: doc.picture};
                    let token   = '';
                    //生成token 设置过期时间为12个小时
                    token = ctx.JWT.sign(payload, ctx.secret, {expiresIn: 12 * 60 * 60 * 1000});
                    
                    //将token保存到cookie中
                    ctx.cookies.set('token', `${token}`, {
                        maxAge   : 12 * 60 * 60 * 1000,
                        path     : "/",
                        secure   : false,
                        httpOnly : false,
                        overwrite: true
                    });
    
                    //将登录时间保存到session中
                    ctx.session.expiresIn = new Date().getTime();
                    
                    ctx.body = {message: 'ok', code: 1};
                }else{
                    ctx.err_mess = '用户名或密码错误~~~';
                }
            }else{
                ctx.err_mess = '用户名或密码错误~~~';
            }
            
        } catch (error) {
            ctx.err_mess = '该用户不存在~~~';
        }
    })

    //处理异常
    if(ctx.err_mess){
        ctx.throw(555, ctx.err_mess);
    }
});

router.use('/blog/', blog_router.routes());
router.use('/user/', user_router.routes());

module.exports = router;