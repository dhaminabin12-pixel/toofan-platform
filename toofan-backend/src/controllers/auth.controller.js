// ──────────────────────────────────────────────────────────────
// Auth Controller
// ──────────────────────────────────────────────────────────────
const bcrypt      = require("bcryptjs");
const jwt         = require("jsonwebtoken");
const { v4: uuid } = require("uuid");
const prisma      = require("../config/prisma");
const { sendSms } = require("../services/sms.service");
const { sendEmail } = require("../services/email.service");
const { sendPush } = require("../services/push.service");
const { AppError } = require("../utils/appError");
const { asyncHandler } = require("../utils/asyncHandler");
const { logger }  = require("../utils/logger");

// ── helpers ─────────────────────────────────────────────────
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

/**
 * Find a user by phone OR email.
 * @param {string} identifier - phone number or email address
 */
const findUserByIdentifier = (identifier) => {
  const isEmail = identifier.includes("@");
  return prisma.user.findUnique({
    where: isEmail ? { email: identifier } : { phone: identifier },
  });
};

/**
 * Dispatch an OTP via the correct channel (SMS for phone, email for email).
 * @param {string} identifier - phone or email
 * @param {string} message    - the full message text (for SMS)
 * @param {string} otp        - the 6-digit code (used in email subject/body)
 * @param {string} purpose    - OTP purpose label
 */
const dispatchOtp = async (identifier, message, otp, purpose) => {
  const isEmail = identifier.includes("@");
  if (isEmail) {
    const subject = "Your TooFan verification code";
    const text    = "Your TooFan OTP for " + purpose + " is: " + otp + ". Valid for 10 minutes. Do not share this code.";
    const html    = "<p>Your TooFan OTP for <strong>" + purpose + "</strong> is:</p><h2>" + otp + "</h2><p>Valid for 10 minutes. Do not share this code.</p>";
    await sendEmail(identifier, subject, text, html);
  } else {
    await sendSms(identifier, message);
  }
};

// ── REGISTER ────────────────────────────────────────────────
exports.register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role = "CUSTOMER" } = req.body;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { phone }] },
  });
  if (existing) throw new AppError("Phone or email already registered.", 409);

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.$transaction(async (tx) => {
    const u = await tx.user.create({
      data: { name, email, phone, passwordHash, role },
    });
    if (role === "CUSTOMER") {
      await tx.customer.create({ data: { userId: u.id } });
    }
    return u;
  });

  const { accessToken, refreshToken } = generateTokens(user.id, user.role);
  await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

  // Send welcome OTP for phone verification
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await prisma.otpCode.create({
    data: {
      userId:    user.id,
      code:      otp,
      purpose:   "verify_phone",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  try {
    await dispatchOtp(
      phone,
      "Welcome to TooFan! Your verification code is: " + otp,
      otp,
      "phone verification"
    );
  } catch (err) {
    logger.warn("OTP dispatch failed (non-blocking): " + err.message);
  }

  logger.info("New user registered: " + phone + " [" + role + "]");
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

// ── LOGIN ────────────────────────────────────────────────────
exports.login = asyncHandler(async (req, res) => {
  const { phone, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { phone },
    include: {
      customer:    true,
      driver:      true,
      partnerAdmin: { include: { partner: true } },
    },
  });
  if (!user)          throw new AppError("Invalid phone or password.", 401);
  if (!user.isActive) throw new AppError("Account suspended. Contact support.", 403);

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) throw new AppError("Invalid phone or password.", 401);

  const { accessToken, refreshToken } = generateTokens(user.id, user.role);
  await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

  let profile = null;
  if (user.customer)    profile = { type: "customer",      walletBalance: user.customer.walletBalance, coins: user.customer.coins };
  if (user.driver)      profile = { type: "driver",        status: user.driver.status, isOnline: user.driver.isOnline };
  if (user.partnerAdmin) profile = { type: "partner_admin", partner: user.partnerAdmin.partner };

  logger.info("User logged in: " + phone + " [" + user.role + "]");

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

// ── SEND OTP ────────────────────────────────────────────────
// Accepts either phone number or email address as the identifier.
exports.sendOtp = asyncHandler(async (req, res) => {
  const { identifier, purpose = "verify_phone" } = req.body;

  const user = await findUserByIdentifier(identifier);
  if (!user) throw new AppError("User not found.", 404);

  // Invalidate existing unused OTPs for this purpose
  await prisma.otpCode.updateMany({
    where: { userId: user.id, purpose, used: false },
    data:  { used: true },
  });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await prisma.otpCode.create({
    data: {
      userId:    user.id,
      code:      otp,
      purpose,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  const purposeLabel = {
    verify_phone:   "phone verification",
    reset_password: "password reset",
    login:          "login",
  }[purpose] || purpose;

  const smsMessages = {
    verify_phone:   "Your TooFan verification code: " + otp + ". Valid for 10 minutes.",
    reset_password: "Your TooFan password reset code: " + otp + ". Valid for 10 minutes.",
    login:          "Your TooFan login OTP: " + otp + ". Valid for 10 minutes.",
  };

  try {
    await dispatchOtp(identifier, smsMessages[purpose] || smsMessages.verify_phone, otp, purposeLabel);
  } catch (err) {
    logger.warn("OTP dispatch failed (non-blocking): " + err.message);
  }

  const devOtp = process.env.NODE_ENV !== "production" ? { otp } : {};
  const channel = identifier.includes("@") ? "email" : "phone";

  res.json({
    success: true,
    message: "OTP sent to your " + channel + ".",
    channel,
    ...devOtp,
  });
});

// ── VERIFY OTP ──────────────────────────────────────────────
// Accepts either phone number or email address as the identifier.
exports.verifyOtp = asyncHandler(async (req, res) => {
  const { identifier, code, purpose } = req.body;

  const user = await findUserByIdentifier(identifier);
  if (!user) throw new AppError("User not found.", 404);

  const otpRecord = await prisma.otpCode.findFirst({
    where: {
      userId:    user.id,
      code,
      purpose,
      used:      false,
      expiresAt: { gt: new Date() },
    },
  });
  if (!otpRecord) throw new AppError("Invalid or expired OTP.", 400);

  await prisma.otpCode.update({
    where: { id: otpRecord.id },
    data:  { used: true },
  });

  if (purpose === "verify_phone") {
    await prisma.user.update({
      where: { id: user.id },
      data:  { isVerified: true },
    });
  }

  res.json({ success: true, message: "OTP verified successfully." });
});

// ── REFRESH TOKEN ───────────────────────────────────────────
exports.refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new AppError("Invalid or expired refresh token.", 401);
  }

  const user = await prisma.user.findFirst({ where: { id: decoded.userId, refreshToken } });
  if (!user) throw new AppError("Session expired. Please login again.", 401);

  const tokens = generateTokens(user.id, user.role);
  await prisma.user.update({ where: { id: user.id }, data: { refreshToken: tokens.refreshToken } });

  res.json({ success: true, data: tokens });
});

// ── LOGOUT ──────────────────────────────────────────────────
exports.logout = asyncHandler(async (req, res) => {
  await prisma.user.update({
    where: { id: req.user.id },
    data:  { refreshToken: null, fcmToken: null },
  });
  res.json({ success: true, message: "Logged out successfully." });
});

// ── RESET PASSWORD ──────────────────────────────────────────
exports.resetPassword = asyncHandler(async (req, res) => {
  const { identifier, otp, newPassword } = req.body;

  const user = await findUserByIdentifier(identifier);
  if (!user) throw new AppError("User not found.", 404);

  const otpRecord = await prisma.otpCode.findFirst({
    where: {
      userId:    user.id,
      code:      otp,
      purpose:   "reset_password",
      used:      false,
      expiresAt: { gt: new Date() },
    },
  });
  if (!otpRecord) throw new AppError("Invalid or expired OTP.", 400);

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  await prisma.otpCode.update({ where: { id: otpRecord.id }, data: { used: true } });

  res.json({ success: true, message: "Password reset successfully." });
});

// ── GET ME ──────────────────────────────────────────────────
exports.getMe = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: {
      customer:    { include: { addresses: { where: { isDefault: true } } } },
      driver:      true,
      partnerAdmin: { include: { partner: true } },
    },
  });
  res.json({ success: true, data: user });
});

// ── UPDATE FCM TOKEN ────────────────────────────────────────
exports.updateFcmToken = asyncHandler(async (req, res) => {
  await prisma.user.update({
    where: { id: req.user.id },
    data:  { fcmToken: req.body.fcmToken },
  });
  res.json({ success: true, message: "FCM token updated." });
});
