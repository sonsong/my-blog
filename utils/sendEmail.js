'use strict';
const nodemailer = require('nodemailer');

function sendEmail(template){
    //配置发送邮件的服务器
    let transporter = nodemailer.createTransport({
        host: 'smtp.163.com',
        port: 465,
        // true for 465, false for other ports
        secure: true,
        auth  : {
            user: '1731711250@163.com',
            pass: 'huangss12345'
        }
    });

    //发送的信息
    let mailOptions = {
        //发件人
        from: '1731711250@163.com',
        //收件人
        to: template.emails,
        //标题
        subject: `您评论的文章，有了新的回复`,
        text   : '',
        html   : `
                <p>${template.name}(${template.email})评论了您的<a href="${template.artURL}" target="_blank">文章</p>
                <p>评论内容: ${template.comment}</p>
        `
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

module.exports = sendEmail;