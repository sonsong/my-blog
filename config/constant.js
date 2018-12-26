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
    gitHub:{
        client_id     : '9b581d4805df0fb0af16',
        client_secret : '7e0edf390634e7d7c00dedabeedca277f5889660'
    }
}

module.exports = constant;