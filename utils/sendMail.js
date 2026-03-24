const nodemailer = require("nodemailer");
const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });

function getMailtrapCredentials() {
    const smtpUser = process.env.MAILTRAP_USER || process.env.MAILTRAP_USERNAME || "";
    const smtpPass = process.env.MAILTRAP_PASS || process.env.MAILTRAP_PASSWORD || "";

    if (!smtpUser || !smtpPass) {
        throw new Error("Thiếu MAILTRAP_USER/MAILTRAP_PASS. Hãy cấu hình biến môi trường trước khi gửi mail.");
    }

    return { smtpUser, smtpPass };
}

function getTransporter() {
    const { smtpUser, smtpPass } = getMailtrapCredentials();
    return nodemailer.createTransport({
        host: process.env.MAILTRAP_HOST || "sandbox.smtp.mailtrap.io",
        port: Number(process.env.MAILTRAP_PORT || 2525),
        secure: false, // Use true for port 465, false for port 587
        auth: {
            user: smtpUser,
            pass: smtpPass,
        },
    });
}

module.exports = {
    sendMail: async function (to, url) {
        const transporter = getTransporter();
        await transporter.sendMail({
            from: process.env.MAIL_FROM || 'user@123.com',
            to: to,
            subject: "reset password email",
            text: "click vao day de doi pass", // Plain-text version of the message
            html: "click vao <a href=" + url+ ">day</a> de doi pass", // HTML version of the message
        })
    },
    sendWelcomePasswordMail: async function (to, username, password) {
        const transporter = getTransporter();
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
