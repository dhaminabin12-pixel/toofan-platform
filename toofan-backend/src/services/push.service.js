const { logger } = require("../utils/logger");

let firebaseAdmin = null;

// Initialize Firebase Admin SDK
try {
  const admin = require("firebase-admin");
  if (!admin.apps.length && process.env.FIREBASE_PROJECT_ID) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId:   process.env.FIREBASE_PROJECT_ID,
        privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
    firebaseAdmin = admin;
    logger.info("🔔 Firebase Admin initialized");
  }
} catch (e) {
  logger.warn("Firebase not configured — push notifications disabled");
}

/**
 * Send push notification to a single device
 * @param {string} fcmToken - Firebase Cloud Messaging token
 * @param {{ title: string, body: string, data?: object }} notification
 */
const sendPush = async (fcmToken, { title, body, data = {} }) => {
  if (!firebaseAdmin || !fcmToken) return;

  try {
    await firebaseAdmin.messaging().send({
      token: fcmToken,
      notification: { title, body },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
      android: { priority: "high", notification: { sound: "default", channelId: "toofan_orders" } },
      apns:    { payload: { aps: { sound: "default", badge: 1 } } },
    });
  } catch (err) {
    logger.error(`Push notification failed for token ${fcmToken?.slice(0, 20)}...: ${err.message}`);
  }
};

/**
 * Send push to multiple devices
 * @param {string[]} tokens
 * @param notification
 */
const sendPushToMultiple = async (tokens, notification) => {
  if (!tokens?.length) return;
  await Promise.allSettled(tokens.map(t => sendPush(t, notification)));
};

module.exports = { sendPush, sendPushToMultiple };
