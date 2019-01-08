//用户路由
const router = require('koa-router')();

//用户实体
const Users = require('../../models/t-user');

//操作文件工具
const fs = require('fs');

//文件上传工具
const multer = require('koa-multer');

//配置上传图片的保存位置和文件名
let img_storage = multer.diskStorage({
    //文件保存路径
    destination(req, file, cb) {
        cb(null, 'static/upload/user-img/')
    },
    //修改文件名称
    filename(req, file, cb) {
        var fileName = (file.originalname).split(".");
        cb(null, `${fileName[0]}_${new Date().getTime()}.${fileName[1]}`);
    }
});

//配置上传图片存储的位置
const img_upload = multer({ storage: img_storage });

//配置上传文件的保存位置和文件名
let file_storage = multer.diskStorage({
    //文件保存路径
    destination(req, file, cb) {
        cb(null, 'static/upload/file/')
    },
    //修改文件名称
    filename(req, file, cb) {
        var fileName = (file.originalname).split(".");
        cb(null, `${fileName[0]}_${new Date().getTime()}.${fileName[1]}`);
    }
});
//配置上传图片存储的位置
const file_upload = multer({ storage: file_storage });

//上传头像
router.post('uploadImg', img_upload.single('file'), async(ctx) =>{
    //注意： ctx.req(node 的request) !== ctx.request(koa 的request)   
    let img = ctx.req.file;

    //用户换新头像，需要将旧头像删除
    let user = {};
    //用户编码
    let _id = ctx.state.user.id;
    //查询用户信息
    await Users.findById({_id}).exec().then(doc =>{
        if(doc === null){
            ctx.err_mess = '查询用户信息失败';
        }else{
            user = doc;
        }
    }, e =>{
        ctx.err_mess = '查询用户信息失败';
    });

    //如果头像是初始头像，不管，否则删除
    if(user.picture !== '/img/user.gif'){
        await fs.unlink(`static/${user.picture}`, (err) =>{
            if(err){
               ctx.err_mess = '头像上传失败';
            }
        })
    }

    //将头像更新到用户信息中
    await Users.updateOne({_id}, {$set: {picture: `/upload/user-img/${img.filename}`}}, (err, doc) =>{
        try{
            if(!err){
                ctx.body = {message: '修改头像成功', code: 1}
            }else{
                ctx.err_mess = '修改头像失败';
            }
        }catch(e){
            console.log(e)
            ctx.err_mess = '修改头像失败';
        }
    });

    if(ctx.err_mess){
        ctx.throw(555, ctx.err_mess);
    }
})
//上传简历
router.post('uploadResume', file_upload.single('file'), async(ctx) =>{
    let file = ctx.req.file;

    let user = {};
    //用户id
    let _id = ctx.state.user.id;
    //获取用户信息，删除旧简历
    await Users.findById({_id}).exec().then(doc =>{
        if(doc !== null){
            user = doc;
        }else{
            ctx.err_mess = '查询用户信息失败';
        }
    }, e =>{
        console.log(e);
        ctx.err_mess = '查询用户信息失败';
    })

    //如果之前上传了简历，删除
    if(user.resume !== ''){
        await fs.unlink(`static/${user.resume}`, (err) =>{
            if(err){
                ctx.err_mess = '简历上传失败';
            }
        })
    }

    //修改用户的信息
    await Users.updateOne({_id}, {$set: {resume: `/upload/file/${file.filename}`}}, (err, doc) =>{
        try {
            if(!err){
                ctx.body = {message: '简历上传成功', code: 1}
            }
        } catch (e) {
            console.log(e);
            ctx.err_mess = '修改用户信息失败';
        }
    })

    if(ctx.err_mess){
        ctx.throw(555, ctx.err_mess);
    }

})
//修改用户信息
router.post('update', async(ctx) =>{
    let user = ctx.request.body;

    await Users.updateOne({_id: user._id}, {$set: {nname: user.nname, introd: user.introd, motto: user.motto, email: user.email}}, async(err) =>{
        try {
            if(!err){
                ctx.body = {message: '修改用户信息成功', code: 1}
            } else{
                ctx.err_mess = '修改用户信息失败';
            }
        } catch (e) {
            ctx.err_mess = '修改用户信息失败';
        }
    })

    if(ctx.err_mess){
        ctx.throw(555, ctx.err_mess);
    }
})
//删除用户
router.get('del_user/:ids', async(ctx) =>{
    //获取用户编码
    let ids = ctx.params.ids.split(',');

    //删除该用户
    try {
        await Users.deleteMany({_id: {$in: ids}}, (err) =>{
            if(!err){
                ctx.body = {message: '删除用户成功', code: 1}
            }else{
                ctx.err_mess = '删除用户失败';
            }
        });
    } catch (e) {
        console.log(e);
        ctx.err_mess = '删除用户失败';
    }

    if(ctx.err_mess){
        ctx.throw(555, ctx.err_mess);
    }
})
//新增/编辑用户
router.post('addUser', async(ctx) =>{
    let user = ctx.request.body;

    //id 存在编辑 不存在修改
    if(user._id !== ''){
        //保存数据
        await Users.updateOne({_id: user._id}, {$set: {nname: user.nname, role: user.role}}, async(err) =>{
            if(!err){
                ctx.body = {message: '修改用户成功', code: 1}
            }
        })
    }else{
        //删除id属性
        Reflect.deleteProperty(user, '_id');
        //判断登陆名是否已经被注册
        await Users.findOne({uname: user.uname}, (err, doc) =>{
            try {
                if(!err){
                    if(doc !== null){
                        ctx.err_mess = '该用户名已经被注册了';
                    }
                }
            } catch (e) {
                console.log(e);
                ctx.err_mess = '新增用户失败';
            }
            
        })

        if(ctx.err_mess){
            ctx.throw(555, ctx.err_mess);
        }

        //增加创建时间
        user.createTime = new Date();
        //新增
        await Users.create(user).then(res =>{
            ctx.body = {message: '新增用户成功', code: 1}
        })
    }
})
//校验用户名是否存在
router.get('verityUname', async(ctx) =>{
    let user = [];

    await Users.find({uname: ctx.query.uname}, '_id uname').exec().then(docs =>{
        if(docs === null){
            ctx.err_mess = '查询用户信息失败';
        }else{
            user = docs;
        }
    }, e =>{
        console.log(e);
        ctx.err_mess = '查询用户信息失败';
    })

    if(user.length === 0){
        ctx.body = {message: 'ok', code: 1};
    }else{
        ctx.body = {message: '该用户名已注册', code: 2};
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
    //删除分页属性
    Reflect.deleteProperty(query, 'page');
    Reflect.deleteProperty(query, 'limit');
    
    params = query;

    //只查询普通用户
    params.role = {$ne: '0'};

    let users = [];
    //查询数据库中的所有用户
    await Users.find(params, '_id uname nname email motto introd picture createTime role', 
        { skip: ((page - 1) * limit), limit, sort: {createTime: -1}}).exec().then(docs =>{
            if(docs !== null){
                for (const item of docs) {

                    let doc = {
                        _id       : item._id.toString(),
                        uname     : item.uname,
                        nname     : item.nname,
                        email     : item.email,
                        motto     : item.motto,
                        introd    : item.introd,
                        picture   : item.picture,
                        createTime: ctx.moment(item.createTime, ctx.moment.ISO_8601).format("YYYY-MM-DD HH:mm:ss")
                    }
                    
                    users.push(doc);
                }
            }else{
                ctx.body = ctx.result;
            }
    }, e =>{
        console.log(e)
        ctx.body = ctx.result;
    });

    //查询数据库的总记录数
    let total = 0;
    await Users.countDocuments(params).then(count =>{
        total = count - 1;
    });

    ctx.result.count = total;
    ctx.result.data  = users;

    ctx.body = ctx.result;
})
//跳转到用户列表
router.get('/', async(ctx) =>{
    ctx.render('admin/user/user_list');
})
//修改密码
router.post('updatePasswd', async(ctx) =>{

    let {_id, passwd, newPasswd} = ctx.request.body;

    //简单做下后台校验
    await Users.findById({_id}, 'passwd').exec().then(doc =>{
        if(doc !== null){
            if(doc.passwd !== passwd){
                ctx.body = {message: '初始密码不正确', code: 2};
            }
            if(doc.passwd === newPasswd){
                ctx.body = {message: '新密码不能和初始密码相同', code: 2};
            }
        }else{
            ctx.body = {message: '该用户不存在', code: 2};
        }
    }, e =>{
        ctx.body = {message: '该用户不存在', code: 2};
        console.log(e);
    });

    //修改密码
    await Users.updateOne({_id}, {$set: {passwd: newPasswd}}, (err, doc) =>{
        if(!err){
            ctx.body = {message: '修改密码成功', code: 1};
        }else{
            ctx.body = {message: '修改密码失败', code: 2};
        }
    });
});

//校验初始密码
router.post('verifyInitPasswd', async(ctx) =>{
    //获取用户编码
    let {_id, passwd} = ctx.request.body;

    await Users.findById({_id}, 'passwd', (err, doc) =>{
        try {
            if(!err){
                if(passwd === doc.passwd){
                    ctx.body = {message: 'ok', code: 1};
                }else{
                    ctx.err_mess = '初始密码输入错误';
                }
            }else{
                ctx.err_mess = '该用户不存在';
            }
        } catch (e) {
            ctx.err_mess = '初始密码输入错误';
        }
    })

    if(ctx.err_mess){
        ctx.throw(555, ctx.err_mess);
    }
})

//修改密码页面
router.get('safe_center', async(ctx) =>{
    //从cookie中获取用户
    ctx.render('admin/user/safe_center', {user: ctx.state.user})
});

//获取用户信息
router.get('user_info', async(ctx) =>{
    //查询当前用户的信息
    await Users.findById({_id: ctx.state.user.id}, async(err, doc) =>{
        if(!err){
            user = {
                _id    : doc._id.toString(),
                uname  : doc.uname,
                nname  : doc.nname,
                motto  : doc.motto,
                email  : doc.email,
                introd : doc.introd,
                picture: doc.picture,
                resume : doc.resume
            };
        }
    });

    let resumeName = '';
    if(user.resume){
        //计算简历的名字
        
        let index = user.resume.lastIndexOf('/') === 2 ? 2 : user.resume.lastIndexOf('/');
        if(index !== 2){
            resumeName = user.resume.substring(index + 1);
        }
    }

    ctx.render('admin/user/user_info', {user, resumeName});
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
            maxAge: 7 * 24 * 60 * 60 *1000,
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
        ctx.throw(401, '登陆已过期, 请重新登陆');
    }
});

module.exports = router;