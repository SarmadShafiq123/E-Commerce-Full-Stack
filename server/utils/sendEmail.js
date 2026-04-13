import nodemailer from 'nodemailer';

const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email] Sent successfully to ${to} — MessageId: ${info.messageId}`);
  } catch (error) {
    console.error(`[Email] Failed to send to ${to}:`, error.message);
    // Email failure must never crash the caller — swallow the error
  }
};

export default sendEmail;
