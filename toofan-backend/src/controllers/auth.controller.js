// ─────────────────────────────────────────────────────────────
//  Auth Controller
// ─────────────────────────────────────────────────────────────

const bcrypt    = require("bcryptjs");
const jwt       = require("jsonwebtoken");
const { v4: uuid } = require("uuid");
const prisma    = require("../config/prisma");
const { sendSms }  = require("../services/sms.service");
const { sendPush } = require("../services/push.service");
const { AppError }  = require("../utils/appError");
const { asyncHandler } = require("../utils/asyncHandler");
const { logger }   = require("../utils/logger");

// ── Token generators ─────────────────────────────────────────
const generateTokens = (userId, role) => {
  const accessToken = jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d" }
  );
  return { accessToken, refreshToken };
};

// ── REGISTER ─────────────────────────────────────────────────
exports.register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role = "CUSTOMER" } = req.body;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { phone }] }
  });
  if (existing) throw new AppError("Phone or email already registered.", 409);

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.$transaction(async (tx) => {
    const u = await tx.user.create({
      data: { name, email, phone, passwordHash, role },
    });

    // Create role-specific profile
    if (role === "CUSTOMER") {
      await tx.customer.create({ data: { userId: u.id } });
    } else if (role === "DRIVER") {
      // Driver created separately via /drivers/apply
    }

    return u;
  });

  const { accessToken, refreshToken } = generateTokens(user.id, user.role);
  await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

  // Send welcome OTP for phone verification
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await prisma.otpCode.create({
    data: {
      userId: user.id,
      code: otp,
      purpose: "verify_phone",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min
    }
  });
  try {
    await sendSms(phone, `Welcome to TooFan! Your verification code is: ${otp}`);
  } catch (smsErr) {
    logger.warn(`SMS send failed (non-blocking): ${smsErr.message}`);
  }

  logger.info(`New user registered: ${phone} [${role}]`);

  // In dev/no-SMS mode, return OTP in response for testing
  const devOtp = process.env.NODE_ENV !== "production" ? { otp } : {};
  res.status(201).json({
    success: true,
    message: "Registered successfully. Check your phone for OTP.",
    data: {
      user: { id: user.id, name, phone, email, role, isVerified: false },
      accessToken,
      refreshToken,
      ...devOtp,
    },
  });
});

// ── LOGIN ─────────────────────────────────────────────────────
exports.login = asyncHandler(async (req, res) => {
  const { phone, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { phone },
    include: {
      customer: true,
      driver: true,
      partnerAdmin: { include: { partner: true } },
    }
  });
  if (!user) throw new AppError("Invalid phone or password.", 401);
  if (!user.isActive) throw new AppError("Account suspended. Contact support.", 403);

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) throw new AppError("Invalid phone or password.", 401);

  const { accessToken, refreshToken } = generateTokens(user.id, user.role);
  await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

  // Build role-specific profile
  let profile = null;
  if (user.customer) profile = { type: "customer", walletBalance: user.customer.walletBalance, coins: user.customer.coins };
  if (user.driver)   profile = { type: "driver", status: user.driver.status, isOnline: user.driver.isOnline };
  if (user.partnerAdmin) profile = { type: "partner_admin", partner: user.partnerAdmin.partner };

  logger.info(`User logged in: ${phone} [${user.role}]`);

  res.json({
    success: true,
    data: {
      user: { id: user.id, name: user.name, phone, email: user.email, role: user.role, isVerified: user.isVerified, avatarUrl: user.avatarUrl },
      profile,
      accessToken,
      refreshToken,
    },
  });
});

// ── SEND OTP ─────────────────────────────────────────────────
exports.sendOtp = asyncHandler(async (req, res) => {
  const { phone, purpose = "verify_phone" } = req.body;

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) throw new AppError("User not found.", 404);

  // Invalidate old OTPs
  await prisma.otpCode.updateMany({
    where: { userId: user.id, purpose, used: false },
    data: { used: true }
  });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await prisma.otpCode.create({
    data: { userId: user.id, code: otp, purpose, expiresAt: new Date(Date.now() + 10 * 60 * 1000) }
  });

  const messages = {
    verify_phone:   `Your TooFan verification code: ${otp}. Valid for 10 minutes.`,
    reset_password: `Your TooFan password reset code: ${otp}. Valid for 10 minutes.`,
    login:          `Your TooFan login OTP: ${otp}. Valid for 10 minutes.`,
  };
  try {
    await sendSms(phone, messages[purpose]);
  } catch (smsErr) {
    logger.warn(`SMS send failed (non-blocking): ${smsErr.message}`);
  }

  // In dev/no-SMS mode, return OTP in response for testing
  const devOtp = process.env.NODE_ENV !== "production" ? { otp } : {};
  res.json({ success: true, message: "OTP sent to your phone.", ...devOtp });
});

// ── VERIFY OTP ────────────────────────────────────────────────
exports.verifyOtp = asyncHandler(async (req, res) => {
  const { phone, code, purpose } = req.body;

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) throw new AppError("User not found.", 404);

  const otpRecord = await prisma.otpCode.findFirst({
    where: { userId: user.id, code, purpose, used: false, expiresAt: { gt: new Date() } }
  });
  if (!otpRecord) throw new AppError("Invalid or expired OTP.", 400);

  await prisma.otpCode.update({ where: { id: otpRecord.id }, data: { used: true } });

  if (purpose === "verify_phone") {
    await prisma.user.update({ where: { id: user.id }, data: { isVerified: true } });
  }

  res.json({ success: true, message: "OTP verified successfully." });
});

// ── REFRESH TOKEN ─────────────────────────────────────────────
exports.refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new AppError("Invalid or expired refresh token.", 401);
  }

  const user = await prisma.user.findFirst({
    where: { id: decoded.userId, refreshToken }
  });
  if (!user) throw new AppError("Session expired. Please login again.", 401);

  const tokens = generateTokens(user.id, user.role);
  await prisma.user.update({ where: { id: user.id }, data: { refreshToken: tokens.refreshToken } });

  res.json({ success: true, data: tokens });
});

// ── LOGOUT ────────────────────────────────────────────────────
exports.logout = asyncHandler(async (req, res) => {
  await prisma.user.update({
    where: { id: req.user.id },
    data: { refreshToken: null, fcmToken: null }
  });
  res.json({ success: true, message: "Logged out successfully." });
});

// ── RESET PASSWORD ────────────────────────────────────────────
exports.resetPassword = asyncHandler(async (req, res) => {
  const { phone, otp, newPassword } = req.body;

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) throw new AppError("User not found.", 404);

  const otpRecord = await prisma.otpCode.findFirst({
    where: { userId: user.id, code: otp, purpose: "reset_password", used: false, expiresAt: { gt: new Date() } }
  });
  if (!otpRecord) throw new AppError("Invalid or expired OTP.", 400);

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  await prisma.otpCode.update({ where: { id: otpRecord.id }, data: { used: true } });

  res.json({ success: true, message: "Password reset successfully." });
});

// ── GET ME ────────────────────────────────────────────────────
exports.getMe = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: {
      customer: { include: { addresses: { where: { isDefault: true } } } },
      driver: true,
      partnerAdmin: { include: { partner: true } },
    }
  });
  res.json({ success: true, data: user });
});

// ── UPDATE FCM TOKEN ──────────────────────────────────────────
exports.updateFcmToken = asyncHandler(async (req, res) => {
  await prisma.user.update({
    where: { id: req.user.id },
    data: { fcmToken: req.body.fcmToken }
  });
  res.json({ success: true, message: "FCM token updated." });
});
