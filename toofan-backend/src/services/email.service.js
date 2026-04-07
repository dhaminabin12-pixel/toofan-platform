const nodemailer = require("nodemailer");
const { logger } = require("../utils/logger");

let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;
  _transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.mailgun.org",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_PORT === "465",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return _transporter;
}

const sendEmail = async (to, subject, text, html) => {
  if (process.env.NODE_ENV === "development" || !process.env.SMTP_USER) {
    logger.info("[EMAIL DEV] To: " + to + " | " + subject + " | " + text);
    return { success: true };
  }
  const info = await getTransporter().sendMail({
    from: process.env.EMAIL_FROM || '"TooFan" <noreply@toofan.com>',
    to, subject, text, ...(html ? { html } : {}),
  });
  logger.info("Email sent to " + to + ": " + info.messageId);
  return { success: true, messageId: info.messageId };
};

module.exports = { sendEmail };
