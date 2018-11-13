//管理员模块模块
const router = require('koa-router')();

//进入首页
router.get('/', async(ctx, next) =>{
    ctx.render('admin/index');
});


module.exports = router;