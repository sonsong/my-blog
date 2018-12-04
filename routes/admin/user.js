//用户路由
const router = require('koa-router')();

//用户实体
const Users = require('../../models/t-user');

//删除用户
router.get('del_user/:ids', async(ctx) =>{
    //获取文章编码
    let ids = ctx.params.ids.split(',');

    //删除该文章
    try {
        await Users.deleteMany({_id: {$in: ids}}, (err) =>{
            if(!err){
                //查询所有的文章
                ctx.body = {message: '删除成功', code: '1'}
            }else{
                ctx.err_mess = '删除失败';
            }
        });
    } catch (error) {
        ctx.err_mess = '删除失败';
    }

    if(ctx.err_mess){
        ctx.body = {message: ctx.err_mess, code: '-1'};
    }
})
//新增/编辑用户
router.post('addUser', async(ctx) =>{
    let user = ctx.request.body;

    //id 存在编辑不存在修改
    if(user._id !== ''){
        //保存数据
        await Users.updateOne({_id: user._id}, {$set: {nname: user.nname, email: user.email, motto: user.motto, introd: user.introd}}, async(err) =>{
            if(!err){
                ctx.body = {message: '修改用户成功', code: 0}
            }
        })
    }else{
        //删除id属性
        Reflect.deleteProperty(user, '_id');
        //判断登陆名是否已经被注册
        await Users.findOne({uname: user.uname}, (err, doc) =>{
            if(!err){
                if(doc !== null){
                    ctx.body = {message: '该用户名已经被注册了', code: -1}
                }
            }
        })

        //增加创建时间
        user.createTime = new Date();
        //新增
        await Users.create(user).then(res =>{
            ctx.body = {message: '新增用户成功', code: 0}
        })
    }
})
//校验用户名是否存在
router.get('verityUname', async(ctx) =>{
    let user = [];

    await Users.find({uname: ctx.query.uname}, '_id uname', (err, docs) =>{
        if(!err){
            user = docs;
        }
    })

    if(user.length === 0){
        ctx.body = {message: 'ok', code: 0};
    }else{
        ctx.body = {message: '该用户名已注册', code: -1};
    }
})
//查询所有用户
router.get('getAllUsers', async(ctx) =>{
    let query = ctx.query;

    //当前页码
    let page = query.page === undefined ? 1 : parseInt(query.page);
    //每页显示数量
    let limit = query.limit === undefined ? 10 : parseInt(query.limit);

    //查询条件
    let params = {};
    delete query.page;
    delete query.limit;
    params = query;

    let users = [];
    //查询数据库中的所有用户
    await Users.find(params, '_id uname nname email motto introd picture createTime role', { skip: ((page - 1) * limit), limit, sort: {'createTime': 1} }, (err, docs) =>{
        if(!err){
            for (const item of docs) {

                //只显示普通用户
                if(item.role === '1'){
                    let doc = {
                        _id       : item._id.toString(),
                        uname     : item.uname,
                        nname: item.nname,
                        email     : item.email,
                        motto     : item.motto,
                        introd    : item.introd,
                        picture   : item.picture,
                        createTime: ctx.moment(item.createTime, ctx.moment.ISO_8601).format("YYYY-MM-DD HH:mm:ss")
                    }
                    
                    users.push(doc);
                }
            }
        }else{
            console.log(err)
        }
    });

    //查询数据库的总记录数
    let total = 0;
    await Users.countDocuments(params, (err, count) =>{
        if(!err){
            total = count - 1;
        }
    });

    ctx.body = {
        code : 0,
        msg  : '查询成功',
        count: total,
        data : users
    };
})
//跳转到用户列表
router.get('user_list', async(ctx) =>{
    ctx.render('admin/user_list');
})
//修改密码
router.post('updatePasswd', async(ctx) =>{

    let {_id, passwd, newPasswd} = ctx.request.body;

    //简单做下后台校验
    await Users.findById({_id}, 'passwd', (err, doc) =>{
        if(!err){
            if(doc.passwd !== passwd){
                ctx.body = {message: '初始密码不正确', code: -1};
            }
            if(doc.passwd === newPasswd){
                ctx.body = {message: '新密码不能和初始密码相同', code: -1};
            }
        }else{
            ctx.body = {message: '该用户不存在', code: -1};
        }
    })

    //修改密码
    await Users.updateOne({_id}, {$set: {passwd: newPasswd}}, (err, doc) =>{
        if(!err){
            ctx.body = {message: '修改密码成功', code: 0};
        }else{
            ctx.body = {message: '修改密码失败', code: -1};
        }
    });
});
//校验初始密码
router.post('verifyInitPasswd', async(ctx) =>{
    //获取用户编码
    let {_id, passwd} = ctx.request.body;

    await Users.findById({_id}, 'passwd', (err, doc) =>{
        if(!err){
            if(passwd === doc.passwd){
                ctx.body = {message: 'ok', code: 0};
            }else{
                ctx.body = {message: '初始密码错误', code: -1};
            }
        }else{
            ctx.body = {message: '该用户不存在', code: -1};
        }
    })
})

//修改密码页面
router.get('safe_center', async(ctx) =>{
    //从cookie中获取用户
    ctx.render('admin/safe_center', {user: JSON.parse(decodeURI(ctx.cookies.get('user')))})
});

//获取用户信息
router.get('user_info', async(ctx) =>{
    //查询当前用户的信息
    await Users.findById({_id: JSON.parse(ctx.cookies.get('user')).id}, async(err, doc) =>{
        if(!err){
            user = doc;
        }
    }) 

    ctx.render('admin/user_info', {user});
});

//退出登录
router.get('exit', async(ctx) =>{
    //清空cookie
    ctx.cookies.set('token', '');

    //回到登陆页
    ctx.redirect('/admin/login');
});

//获取用户信息
router.get('getUserInfo', async(ctx) =>{

    // 获取jwt
    const token = ctx.cookies.get('token');

    let payload = {};
    if (token && token !== '') {
        // 解密，获取payload 以token形式解析 不要Bearer前缀
        payload = await ctx.verify(token, ctx.secret);
        
        //将payload存储到cookie中
        ctx.cookies.set('user', JSON.stringify(payload), {
            //cookie有效时长，单位：毫秒数
            maxAge: 7 * 60 * 60 *1000,
            //过期时间，unix时间戳   
            //expires:"0000000000",
            //cookie保存路径, 默认是'/，set时更改，get时同时修改，不然会保存不上，服务同时也获取不到        
            path: "/",
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
        ctx.throw(555, '登陆已过期, 请重新登陆');
    }
});

module.exports = router;