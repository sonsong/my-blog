const constant = {
    email:{
        auth  : {
            user: '17317112520@163.com',
            pass: 'aaa111'
        },
        sendTemplate_1:{
            from: '17317112520@163.com',
            to: '770363228@qq.com',
            subject: `你的文章有了新的评论`,
            text   : '',
            html   : ''
        },
        sendTemplate_2:{
            from: '17317112520@163.com',
            to: '',
            subject: `您评论的文章，有了新的回复`,
            text   : '',
            html   : ''
        }
    },
    //生产环境
    gitHub_prod:{
        client_id     : '9b581d4805df0fb0af16',
        client_secret : '7e0edf390634e7d7c00dedabeedca277f5889660'
    },
    //开发环境
    gitHub_dev:{
        client_id     : 'e708d805bca65f1196a9',
        client_secret : '744d975bf9c78b9cbcc906a060c642cccb9a9212'
    },
}

module.exports = constant;