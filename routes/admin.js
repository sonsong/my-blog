//管理员模块模块
const router = require('koa-router')();

//博客路由
const blog_router = require('./admin/blog');
//用户路由
const user_router = require('./admin/user');

//进入首页
router.get('/', async(ctx, next) =>{
    ctx.render('admin/index');
});

router.use('/blog/', blog_router.routes());
router.use('/', user_router.routes());

module.exports = router;