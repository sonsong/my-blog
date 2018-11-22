//用户路由
const router = require('koa-router')();

//用户实体
const Users = require('../../models/t-user');

//跳转到登陆页面
router.get('login', async(ctx, next) =>{
    ctx.render('admin/login');
});

//用户登陆
router.post('loginSubmit', async(ctx) =>{
    //获取用户名和密码
    let uname = ctx.request.body.uname;
    let passwd = ctx.request.body.passwd;

});

module.exports = router;