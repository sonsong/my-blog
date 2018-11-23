//用户路由
const router = require('koa-router')();
//密码加密
const SHA1 = require('sha1');

//用户实体
const Users = require('../../models/t-user');

//跳转到登陆页面
router.get('login', async(ctx, next) =>{
    ctx.render('admin/login');
});

//获取用户信息
router.get('getUserInfo', async(ctx) =>{

    // 获取jwt
    const token = ctx.cookies.get('authorization');

    console.log(token)

    let payload = {};
    if (token) {
        // 解密，获取payload
        payload = await ctx.verify(token.split(' ')[1], ctx.secret);
        //将payload存储到cookie中
        ctx.cookies.set('uname', payload.name, {
            //cookie有效时长，单位：毫秒数
            maxAge: 7 * 60 * 60 *1000,       
            //过期时间，unix时间戳   
            //expires:"0000000000",
            //cookie保存路径, 默认是'/，set时更改，get时同时修改，不然会保存不上，服务同时也获取不到        
            path:"/",
            //cookie可用域名，“.”开头支持顶级域名下的所有子域名                    
            //domain:".xxx.com",
            //默认false，设置成true表示只有https可以访问       
            secure: false,
            //true，客户端不可读取      
            httpOnly: false,
            //一个布尔值，表示是否覆盖以前设置的同名的 cookie (默认是 false). 
            //如果是 true, 在同一个请求中设置相同名称的所有 Cookie（不管路径或域）
            //是否在设置此Cookie 时从 Set-Cookie 标头中过滤掉
            overwrite: true
        });

        ctx.body = {message: 'ok', code: 1};
    } else {
        ctx.body = {message: '登陆已过期, 请重新登陆', code: 0};
    }
});

//用户登陆获取token
router.post('toLogin', async(ctx) =>{
    
    //获取用户名和密码
    let uname = ctx.request.body.uname;
    let passwd = ctx.request.body.passwd;

    //校验用户名和密码
    await Users.findOne({uname}, (err, doc) =>{
        if(!err){

            //验证密码是否正确
            if(SHA1(passwd) === doc.passwd){
                //载体
                let payload = {id: doc._id.toString(), name: uname};
                //生成token 设置过期时间为1小时
                let token = '';
                try {
                    token = ctx.JWT.sign(payload, ctx.secret, {expiresIn: '10m'});

                    ctx.cookies.set('token', `Bearer ${token}`, {
                        maxAge: 7 * 60 * 60 *1000,       
                        path:"/",
                        secure: false,
                        httpOnly: false,
                        overwrite: true
                    });

                    ctx.body = {message: 'ok', expiresIn: ctx.moment().format("YYYY-MM-DD HH:mm:ss"), code: 1};

                } catch (error) {
                    console.log(error);
                }
            }else{
                ctx.body = {message: '用户名或密码错误', code: 0};
            }
        }else{
            ctx.body = {message: '用户名或密码错误', code: 0};
        }
    });
});

module.exports = router;