'use strict';
const nodemailer = require('nodemailer');

function sendEmail(template){
    //配置发送邮件的服务器
    let transporter = nodemailer.createTransport({
        host: 'smtp.163.com',
        port: 465,
        // true for 465, false for other ports 使用ssl连接
        secure: true,
        auth  : template.auth
    });

    //发送的信息
    let mailOptions = template.sendTemp;

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