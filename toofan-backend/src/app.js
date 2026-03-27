// ─────────────────────────────────────────────────────────────
//  TooFan Backend — Express App
// ─────────────────────────────────────────────────────────────

const express      = require("express");
const cors         = require("cors");
const helmet       = require("helmet");
const morgan       = require("morgan");
const rateLimit    = require("express-rate-limit");
const path         = require("path");

const { errorHandler, notFound } = require("./middleware/error.middleware");
const { logger } = require("./utils/logger");

// Route imports
const authRoutes        = require("./routes/auth.routes");
const customerRoutes    = require("./routes/customer.routes");
const restaurantRoutes  = require("./routes/restaurant.routes");
const menuRoutes        = require("./routes/menu.routes");
const orderRoutes       = require("./routes/order.routes");
const driverRoutes      = require("./routes/driver.routes");
const paymentRoutes     = require("./routes/payment.routes");
const partnerRoutes     = require("./routes/partner.routes");
const adminRoutes       = require("./routes/admin.routes");
const notificationRoutes = require("./routes/notification.routes");
const uploadRoutes      = require("./routes/upload.routes");
const couponRoutes      = require("./routes/coupon.routes");
const configRoutes      = require("./routes/config.routes");

const app = express();

// ── SECURITY HEADERS ─────────────────────────────────────────
app.use(helmet());

// ── CORS ─────────────────────────────────────────────────────
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || "http://localhost:3000",
    "http://localhost:3001",  // Admin panel
    "http://localhost:19006", // Expo React Native dev
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
}));

// ── REQUEST PARSING ───────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ── LOGGING ───────────────────────────────────────────────────
app.use(morgan("combined", {
  stream: { write: (msg) => logger.info(msg.trim()) },
  skip: (req) => req.url === "/health",
}));

// ── RATE LIMITING ─────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max:      parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message:  { success: false, message: "Too many requests, try again later." },
});
app.use("/api/", limiter);

// Stricter limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many login attempts." },
});

// ── STATIC FILES ──────────────────────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ── HEALTH CHECK ──────────────────────────────────────────────
app.get("/health", (req, res) => res.json({
  status: "ok",
  app: "TooFan API",
  version: "1.0.0",
  timestamp: new Date().toISOString(),
}));

// ── API ROUTES ────────────────────────────────────────────────
const API = "/api/v1";

app.use(`${API}/auth`,          authLimiter, authRoutes);
app.use(`${API}/customers`,     customerRoutes);
app.use(`${API}/restaurants`,   restaurantRoutes);
app.use(`${API}/menu`,          menuRoutes);
app.use(`${API}/orders`,        orderRoutes);
app.use(`${API}/drivers`,       driverRoutes);
app.use(`${API}/payments`,      paymentRoutes);
app.use(`${API}/partners`,      partnerRoutes);
app.use(`${API}/admin`,         adminRoutes);
app.use(`${API}/notifications`, notificationRoutes);
app.use(`${API}/uploads`,       uploadRoutes);
app.use(`${API}/coupons`,       couponRoutes);
app.use(`${API}/config`,        configRoutes);

// ── API DOCS (basic) ─────────────────────────────────────────
app.get("/api/docs", (req, res) => {
  res.json({
    name: "TooFan API",
    version: "1.0.0",
    company: "Bodh Software Company",
    base: `${req.protocol}://${req.get("host")}${API}`,
    endpoints: {
      auth:          `${API}/auth`,
      customers:     `${API}/customers`,
      restaurants:   `${API}/restaurants`,
      menu:          `${API}/menu`,
      orders:        `${API}/orders`,
      drivers:       `${API}/drivers`,
      payments:      `${API}/payments`,
      partners:      `${API}/partners`,
      admin:         `${API}/admin`,
      notifications: `${API}/notifications`,
      coupons:       `${API}/coupons`,
      config:        `${API}/config`,
    },
  });
});

// ── ERROR HANDLING ────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
