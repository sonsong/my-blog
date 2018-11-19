//管理员模块模块
const router = require('koa-router')();

const blog_router = require('./admin/blog');

//进入首页
router.get('/', async(ctx, next) =>{
    ctx.render('admin/index');
});

router.use('/blog/', blog_router.routes());

module.exports = router;