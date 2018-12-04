const Koa = require('koa'),
        Router        = require('koa-router'),
        static_server = require('koa-static'),
        render        = require('koa-art-template'),
        path          = require('path'),
        bodyParser    = require('koa-bodyparser'),
        session       = require('koa-session'),
        router        = new Router(),
        moment        = require('moment'),
        //生产token
        JWT = require('jsonwebtoken'),
        //解析token
        koaJWT = require('koa-jwt'),
        util   = require('util');

const app = new Koa();

//解析token,得到payload
const verify = util.promisify(JWT.verify);
//密钥
const secret = 'my-blog jwt';

//连接数据库
require('./utils/connection');

//注册session
app.keys = ['some secret hurr'];

const config   = {
    //cookie key (default is koa:sess)
    key: 'koa:sess',
    // cookie的过期时间 maxAge in ms (default is 1 days)
    maxAge: 12 * 60 * 60 * 1000,
    //是否可以overwrite    (默认default true)
    overwrite: true,
    //cookie是否只有服务器端可以访问 httpOnly or not (default true)
    httpOnly: false,
    //签名默认true
    signed: true,
    //在每次请求时强行设置cookie，这将重置cookie过期时间（默认：false）
    rolling: false,
     //(boolean) renew session when session is nearly expired,
    renew: false,
};
app.use(session(config, app));

app.use(async(ctx, next) =>{
    //判断登陆是否超时,获取session中的登陆时间
    let loginTime = ctx.session.expiresIn;
    
    if(loginTime !== undefined){

        if(new Date().getTime() - loginTime > 12 * 60 * 60 * 1000){
            //超时了，重新登陆
            ctx.cookies.set('token', '');
            //清空session
            ctx.session.expiresIn = undefined;
        }
    }
    
    //设置时间
    ctx.moment = moment;

    ctx.verify = verify;
    ctx.secret = secret;
    ctx.JWT    = JWT;

    try {
        await next();
    } catch (err) {
        console.log(err)
        
        //统一处理异常, 回到登陆页面，清空session、cookie中的token
        ctx.cookies.set('token', '');
        ctx.session.expiresIn = undefined;

        if(err.status === 555){
            ctx.body = ({message: err.message, code: -1});
        }else if(err.status === 401){
            ctx.render('admin/login', {message: '登陆已超时，请重新登陆'});
        } /* else{
            ctx.render('admin/login', {message: err.message});
        } */ 
    }
    
    //处理异常
    if(ctx.status === 404){
        ctx.render('errors/404');
    }
    else if(ctx.status === 500){
        ctx.render('errors/500', {message: '服务器内部错误'});
    }
});

//过滤不需要验证登陆的请求
app.use(koaJWT({secret, cookie:'token'}).unless({
    //数组中的路径不需要通过jwt验证
    path: [
        //过滤不是/admin的路径
        /^(?!\/admin)/, 
        //登陆和取token请求不验证
        /^\/admin\/login|toLogin/, 
        //以**结尾
        /* /\w*.css|js|gif|png|ico$/,  */
    ]
}));

//注册art-template模板解析器
render(app, {
    root   : path.join(__dirname, 'views'),
    extname: '.html',
    debug  : process.env.NODE_ENV !== 'production'
});

//处理post请求参数 formLimit 处理表单的数据最大限制  处理json数据的最大限制
app.use(bodyParser({formLimit: '50mb', jsonLimit: '50mb'}));

//处理静态文件
app.use(static_server(path.join(__dirname, 'static')));


//用户模块相关路由
const user = require('./routes/user');
//管理员模块相关路由
const admin = require('./routes/admin');

router.use('/', user.routes());
router.use('/admin', admin.routes());

//注册路由
app.use(router.routes()).use(router.allowedMethods());

app.listen(3000);
console.log('server is running at 3000 port...');