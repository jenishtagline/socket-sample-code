import * as nodemailer from "nodemailer";
export const mail = async (mail) => {
    const transport = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.SENDER_MAIL,
            pass: process.env.SENDER_PASSWORD,
        }
    })
    await transport.sendMail({
        from: process.env.SENDER_MAIL,
        to: mail.email,
        subject: mail.subject,
        html: mail.data
    })
    console.log('Email Send Successfully');
}