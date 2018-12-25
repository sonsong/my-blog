'use strict';
const nodemailer = require('nodemailer');

export default function sendEmail(){
    //配置发送邮件的服务器
    let transporter = nodemailer.createTransport({
        host: 'smtp.163.com',
        port: 465,
        // true for 465, false for other ports
        secure: true, 
        auth: {
            user: '1731711250@163.com', 
            pass: 'aaa11122' 
        }
    });

    //发送的信息
    let mailOptions = {
        //发件人
        from: '1731711250@163.com', 
        //收件人
        to: receiveList,
        //标题
        subject: `您评论的文章，有了新的回复`,
        text: '',
        html: `<p>${user.login}(${user.email})</p>`
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    });
}