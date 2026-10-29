const nodemailer = require('nodemailer');

// Gmail এর SMTP সার্ভারের সাথে সংযোগ
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // 465 পোর্টে সবসময় এনক্রিপ্টেড সংযোগ
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
});

// সার্ভার চালু হওয়ার সময় একবার চেক করে সেটিং ঠিক আছে কিনা
transporter
    .verify()
    .then(() => console.log('Mail server ready'))
    .catch((err) => console.error('Mail config error:', err.message));

module.exports = transporter;