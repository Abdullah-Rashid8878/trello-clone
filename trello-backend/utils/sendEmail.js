const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendInviteEmail = async (toEmail, boardTitle, inviterName, token) => {
    const inviteLink = `http://localhost:3000/invite/${token}`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: toEmail,
        subject: `${inviterName} invited you to a board on Trello Clone`,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>You've been invited!</h2>
                <p><strong>${inviterName}</strong> has invited you to collaborate on the board "<strong>${boardTitle}</strong>".</p>
                <a href="${inviteLink}" style="display: inline-block; padding: 10px 20px; background-color: #0079bf; color: white; text-decoration: none; border-radius: 4px;">
                    View Invitation
                </a>
            </div>
        `,
    };

    await transporter.sendMail(mailOptions);
};

module.exports = sendInviteEmail;