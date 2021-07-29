const nodemailer = require('nodemailer')

const mail = async (payload) => {
    const transport = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.SENDER_MAIL,
            pass: process.env.SENDER_PASSWORD,
        }
    })
    await transport.sendMail({
        from: process.env.SENDER_MAIL,
        to: payload.email,
        subject: payload.subject,
        html: payload.data
    })
    console.log('Email Send Successfully');
}

module.exports = { mail }