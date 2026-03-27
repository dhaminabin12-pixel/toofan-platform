const { logger } = require("../utils/logger");

/**
 * Send SMS via Sparrow SMS (Nepal's most popular SMS gateway)
 * Docs: https://developers.sparrowsms.com/
 * @param {string} phone - Nepali phone number e.g. 9801234567
 * @param {string} message
 */
const sendSms = async (phone, message) => {
  // In development just log the OTP
  if (process.env.NODE_ENV === "development") {
    logger.info(`[SMS DEV] To: ${phone} | Message: ${message}`);
    return { success: true };
  }

  if (!process.env.SPARROW_SMS_TOKEN) {
    logger.warn("SPARROW_SMS_TOKEN not set — SMS skipped");
    return;
  }

  try {
    const response = await fetch("https://api.sparrowsms.com/v2/sms/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: process.env.SPARROW_SMS_TOKEN,
        from:  process.env.SPARROW_SMS_FROM || "TooFan",
        to:    phone,
        text:  message,
      }),
    });

    const data = await response.json();

    if (data.response_code !== 200) {
      throw new Error(`Sparrow SMS error: ${data.message}`);
    }

    logger.info(`SMS sent to ${phone}`);
    return { success: true };
  } catch (err) {
    logger.error(`SMS send failed to ${phone}: ${err.message}`);
  }
};

module.exports = { sendSms };
