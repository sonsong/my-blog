const Koa = require('koa'),
        Router = require('koa-router'),
        static_server = require('koa-static'),
        render = require('koa-art-template'),
        path = require('path'),
        bodyParser = require('koa-bodyparser'),
        app = new Koa(),
        router = new Router(),
        moment = require('moment'),
        //生产token
        JWT = require('jsonwebtoken'),
        //解析token
        koaJWT = require('koa-jwt'),
        util = require('util');

const verify = util.promisify(JWT.verify);
//密钥
const secret = 'my-blog jwt';

//连接数据库
require('./utils/connection');

//用户模块相关路由
const user = require('./routes/user');
//管理员模块相关路由
const admin = require('./routes/admin');

app.use(async(ctx, next) =>{
    //设置时间
    ctx.moment = moment;

    ctx.verify = verify;
    ctx.secret = secret;
    ctx.JWT = JWT;

    await next();
});

//过滤不需要验证登陆的请求
app.use(koaJWT({secret, cookie:'token'}).unless({
    //数组中的路径不需要通过jwt验证
    path: [
        /^\/admin\/login|toLogin/, 
        /\w*.css|js|gif|png|ico$/, 
    ]
}));

//注册art-template模板解析器
render(app, {
    root: path.join(__dirname, 'views'),
    extname: '.html',
    debug: process.env.NODE_ENV !== 'production'
});

//处理post请求参数 formLimit 处理表单的数据最大限制  处理json数据的最大限制
app.use(bodyParser({formLimit: '50mb', jsonLimit: '50mb'}));

//处理静态文件
app.use(static_server(path.join(__dirname, 'static')));

router.use('/', user.routes());
router.use('/admin', admin.routes());


//注册路由
app.use(router.routes()).use(router.allowedMethods());

app.listen(3000);
console.log('node server is running at 3000 port...');