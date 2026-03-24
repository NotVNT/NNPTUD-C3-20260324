const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.MAILTRAP_HOST || "sandbox.smtp.mailtrap.io",
    port: Number(process.env.MAILTRAP_PORT || 2525),
    secure: false, // Use true for port 465, false for port 587
    auth: {
        user: process.env.MAILTRAP_USER || process.env.MAILTRAP_USERNAME || "",
        pass: process.env.MAILTRAP_PASS || process.env.MAILTRAP_PASSWORD || process.env.tokemailtrap || "",
    },
});

module.exports = {
    sendMail: async function (to, url) {
        await transporter.sendMail({
            from: process.env.MAIL_FROM || 'user@123.com',
            to: to,
            subject: "reset password email",
            text: "click vao day de doi pass", // Plain-text version of the message
            html: "click vao <a href=" + url+ ">day</a> de doi pass", // HTML version of the message
        })
    },
    sendWelcomePasswordMail: async function (to, username, password) {
        await transporter.sendMail({
            from: process.env.MAIL_FROM || 'user@123.com',
            to: to,
            subject: 'Tai khoan cua ban da duoc tao',
            text: `Xin chao ${username}, mat khau dang nhap cua ban la: ${password}`,
            html: `
                <p>Xin chao <b>${username}</b>,</p>
                <p>Tai khoan cua ban da duoc tao thanh cong.</p>
                <p>Mat khau tam thoi: <b>${password}</b></p>
                <p>Vui long dang nhap va doi mat khau som nhat.</p>
            `,
        })
    }
}

// Send an email using async/await
