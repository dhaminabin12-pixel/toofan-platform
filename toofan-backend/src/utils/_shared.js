// ─────────────────────────────────────────────────────────────
//  Shared Utilities, Middleware & Services
// ─────────────────────────────────────────────────────────────

// ════════════════════════════════════════════════
// src/config/prisma.js  —  Prisma client singleton
// ════════════════════════════════════════════════
// FILE: src/config/prisma.js
const { PrismaClient } = require("@prisma/client");
const globalPrisma = global;
const prisma = globalPrisma.prisma ?? new PrismaClient({ log: process.env.NODE_ENV === "development" ? ["query","error","warn"] : ["error"] });
if (process.env.NODE_ENV !== "production") globalPrisma.prisma = prisma;
module.exports = prisma;


// ════════════════════════════════════════════════
// src/utils/appError.js  —  Custom error class
// ════════════════════════════════════════════════
// FILE: src/utils/appError.js
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
// Usage: throw new AppError("Not found", 404)


// ════════════════════════════════════════════════
// src/utils/asyncHandler.js  —  Wraps async route handlers
// ════════════════════════════════════════════════
// FILE: src/utils/asyncHandler.js
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);


// ════════════════════════════════════════════════
// src/utils/geo.js  —  Haversine distance formula
// ════════════════════════════════════════════════
// FILE: src/utils/geo.js
function calcDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
// Returns distance in km


// ════════════════════════════════════════════════
// src/utils/logger.js  —  Winston logger
// ════════════════════════════════════════════════
// FILE: src/utils/logger.js
const { createLogger, format, transports } = require("winston");
const logger = createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.errors({ stack: true }),
    format.printf(({ timestamp, level, message, stack }) =>
      `${timestamp} [${level.toUpperCase()}] ${stack || message}`
    )
  ),
  transports: [
    new transports.Console({ format: format.combine(format.colorize(), format.simple()) }),
    new transports.File({ filename: "logs/error.log", level: "error" }),
    new transports.File({ filename: "logs/combined.log" }),
  ],
});


// ════════════════════════════════════════════════
// src/middleware/auth.middleware.js  —  JWT auth
// ════════════════════════════════════════════════
// FILE: src/middleware/auth.middleware.js
const jwt_mw = require("jsonwebtoken");
const prisma_mw = require("../config/prisma");
const { AppError: AE } = require("../utils/appError");

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) throw new AE("No token provided.", 401);
    const decoded = jwt_mw.verify(token, process.env.JWT_SECRET);
    const user = await prisma_mw.user.findUnique({ where: { id: decoded.userId } });
    if (!user || !user.isActive) throw new AE("Unauthorized.", 401);
    req.user = user;
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError") return next(new AE("Invalid token.", 401));
    if (err.name === "TokenExpiredError") return next(new AE("Token expired.", 401));
    next(err);
  }
};


// ════════════════════════════════════════════════
// src/middleware/authorize.middleware.js  —  Role check
// ════════════════════════════════════════════════
// FILE: src/middleware/authorize.middleware.js
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return next(new AE(`Access denied. Requires role: ${roles.join(" or ")}`, 403));
  }
  next();
};


// ════════════════════════════════════════════════
// src/middleware/validate.middleware.js  —  express-validator
// ════════════════════════════════════════════════
// FILE: src/middleware/validate.middleware.js
const { validationResult } = require("express-validator");
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array().map(e => ({ field: e.path, message: e.msg })) });
  }
  next();
};


// ════════════════════════════════════════════════
// src/middleware/error.middleware.js  —  Global error handler
// ════════════════════════════════════════════════
// FILE: src/middleware/error.middleware.js
const { logger: errorLogger } = require("../utils/logger");

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  if (process.env.NODE_ENV === "development") {
    errorLogger.error(err.stack);
    return res.status(err.statusCode).json({ success: false, message: err.message, stack: err.stack });
  }
  if (err.isOperational) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }
  errorLogger.error("UNEXPECTED ERROR:", err);
  res.status(500).json({ success: false, message: "Something went wrong. Please try again." });
};

const notFound = (req, res) => res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });


// ════════════════════════════════════════════════
// src/services/push.service.js  —  Firebase push notifications
// ════════════════════════════════════════════════
// FILE: src/services/push.service.js
let firebaseAdmin;
try {
  const admin = require("firebase-admin");
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId:    process.env.FIREBASE_PROJECT_ID,
        privateKey:   process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        clientEmail:  process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
  }
  firebaseAdmin = admin;
} catch (e) {
  // Firebase not configured — push notifications disabled
}

const sendPush = async (fcmToken, { title, body, data = {} }) => {
  if (!firebaseAdmin || !fcmToken) return;
  try {
    await firebaseAdmin.messaging().send({
      token: fcmToken,
      notification: { title, body },
      data: Object.fromEntries(Object.entries(data).map(([k,v]) => [k, String(v)])),
      android: { priority: "high" },
      apns: { payload: { aps: { sound: "default", badge: 1 } } },
    });
  } catch (err) {
    require("../utils/logger").logger.error("Push notification failed:", err.message);
  }
};

const sendPushToMultiple = async (tokens, notification) => {
  await Promise.allSettled(tokens.map(t => sendPush(t, notification)));
};


// ════════════════════════════════════════════════
// src/services/sms.service.js  —  Sparrow SMS Nepal
// ════════════════════════════════════════════════
// FILE: src/services/sms.service.js
// Sparrow SMS is the most popular SMS gateway in Nepal
// Docs: https://developers.sparrowsms.com/

const sendSms = async (phone, message) => {
  if (process.env.NODE_ENV === "development") {
    require("../utils/logger").logger.info(`[SMS DEV] To: ${phone} | Message: ${message}`);
    return;
  }
  try {
    const fetch = require("node-fetch");
    const response = await fetch("https://api.sparrowsms.com/v2/sms/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token:   process.env.SPARROW_SMS_TOKEN,
        from:    process.env.SPARROW_SMS_FROM || "TooFan",
        to:      phone,
        text:    message,
      }),
    });
    const data = await response.json();
    if (data.response_code !== 200) throw new Error(`SMS failed: ${data.message}`);
  } catch (err) {
    require("../utils/logger").logger.error("SMS error:", err.message);
  }
};


// ════════════════════════════════════════════════
// src/services/cron.service.js  —  Scheduled jobs
// ════════════════════════════════════════════════
// FILE: src/services/cron.service.js
const cron = require("node-cron");

const start = () => {
  // Reset today's driver earnings at midnight
  cron.schedule("0 0 * * *", async () => {
    const prisma_cron = require("../config/prisma");
    await prisma_cron.driver.updateMany({}, { data: { todayEarnings: 0 } });
    require("../utils/logger").logger.info("Daily driver earnings reset.");
  });

  // Update surge zones every 5 minutes based on order density
  cron.schedule("*/5 * * * *", async () => {
    const prisma_cron = require("../config/prisma");
    // In production: analyze order density per zone and auto-set multiplier
    // For now: just log
    require("../utils/logger").logger.debug("Surge zone check ran.");
  });

  // Cancel unassigned orders older than 15 minutes
  cron.schedule("*/5 * * * *", async () => {
    const prisma_cron = require("../config/prisma");
    const cutoff = new Date(Date.now() - 15 * 60 * 1000);
    const stale = await prisma_cron.order.findMany({
      where: { status: "CONFIRMED", driverId: null, createdAt: { lt: cutoff } }
    });
    for (const order of stale) {
      await prisma_cron.order.update({ where: { id: order.id }, data: { status: "CANCELLED", cancelReason: "No driver available" } });
      require("../utils/logger").logger.warn(`Auto-cancelled stale order: ${order.orderNumber}`);
    }
  });

  require("../utils/logger").logger.info("⏰ Cron jobs started.");
};

// Export all modules (in production each goes in its own file)
module.exports = {
  // Prisma
  prismaConfig: { code: "see src/config/prisma.js above" },
  // Utilities
  AppError, asyncHandler, calcDistance, logger,
  // Middleware
  authenticate, authorize, validate, errorHandler, notFound,
  // Services
  sendPush, sendPushToMultiple, sendSms,
  cron: { start },
};
