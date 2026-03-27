// ─────────────────────────────────────────────────────────────
//  notification.routes.js
// ─────────────────────────────────────────────────────────────
const notifRouter = require("express").Router();
const prisma   = require("../config/prisma");
const { authenticate } = require("../middleware/auth.middleware");
const { asyncHandler } = require("../utils/asyncHandler");

notifRouter.use(authenticate);

notifRouter.get("/", asyncHandler(async (req, res) => {
  const notifs = await prisma.notification.findMany({
    where:   { userId: req.user.id },
    orderBy: { sentAt: "desc" },
    take:    50,
  });
  const unreadCount = notifs.filter(n => !n.isRead).length;
  res.json({ success: true, data: { notifications: notifs, unreadCount } });
}));

notifRouter.patch("/:id/read", asyncHandler(async (req, res) => {
  await prisma.notification.update({ where: { id: req.params.id }, data: { isRead: true } });
  res.json({ success: true });
}));

notifRouter.patch("/read-all", asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user.id, isRead: false },
    data:  { isRead: true }
  });
  res.json({ success: true, message: "All notifications marked as read." });
}));

module.exports.notifRouter = notifRouter;


// ─────────────────────────────────────────────────────────────
//  coupon.routes.js
// ─────────────────────────────────────────────────────────────
const couponRouter = require("express").Router();
const { body }   = require("express-validator");
const { authorize }    = require("../middleware/authorize.middleware");
const { validate }     = require("../middleware/validate.middleware");
const { AppError }     = require("../utils/appError");

couponRouter.use(authenticate);

couponRouter.get("/validate/:code", asyncHandler(async (req, res) => {
  const coupon = await prisma.coupon.findFirst({
    where: {
      code:     req.params.code.toUpperCase(),
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    }
  });
  if (!coupon || coupon.usageCount >= coupon.usageLimit) {
    throw new AppError("Invalid or expired coupon.", 400);
  }
  res.json({
    success: true,
    data: {
      code:        coupon.code,
      type:        coupon.type,
      value:       coupon.value,
      maxDiscount: coupon.maxDiscount,
      description: coupon.description,
      minOrder:    coupon.minOrderAmount,
    }
  });
}));

couponRouter.get("/", authorize("SUPER_ADMIN","PARTNER_ADMIN"), asyncHandler(async (req, res) => {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  res.json({ success: true, data: coupons });
}));

couponRouter.post("/",
  authorize("SUPER_ADMIN","PARTNER_ADMIN"),
  [
    body("code").notEmpty().trim(),
    body("type").isIn(["pct","flat"]),
    body("value").isFloat({ min: 1 }),
    body("description").notEmpty(),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { code, description, type, value, maxDiscount, usageLimit, minOrderAmount, expiresAt } = req.body;
    const coupon = await prisma.coupon.create({
      data: {
        code:            code.toUpperCase().trim(),
        description,
        type,
        value:           parseFloat(value),
        maxDiscount:     maxDiscount ? parseFloat(maxDiscount) : null,
        usageLimit:      parseInt(usageLimit) || 100,
        minOrderAmount:  parseFloat(minOrderAmount) || 0,
        expiresAt:       expiresAt ? new Date(expiresAt) : null,
      }
    });
    res.status(201).json({ success: true, data: coupon });
  })
);

couponRouter.patch("/:id", authorize("SUPER_ADMIN"), asyncHandler(async (req, res) => {
  const { isActive, usageLimit, expiresAt } = req.body;
  const data = {};
  if (isActive !== undefined)   data.isActive = isActive;
  if (usageLimit !== undefined) data.usageLimit = parseInt(usageLimit);
  if (expiresAt !== undefined)  data.expiresAt = new Date(expiresAt);
  const coupon = await prisma.coupon.update({ where: { id: req.params.id }, data });
  res.json({ success: true, data: coupon });
}));

module.exports.couponRouter = couponRouter;


// ─────────────────────────────────────────────────────────────
//  config.routes.js  (public — used by apps to fetch runtime config)
// ─────────────────────────────────────────────────────────────
const configRouter = require("express").Router();

configRouter.get("/:app", asyncHandler(async (req, res) => {
  const configs = await prisma.appConfig.findMany({ where: { app: req.params.app } });
  const obj = Object.fromEntries(configs.map(c => [c.key, c.value]));
  res.json({ success: true, data: obj });
}));

module.exports.configRouter = configRouter;


// ─────────────────────────────────────────────────────────────
//  upload.routes.js
// ─────────────────────────────────────────────────────────────
const multer  = require("multer");
const path    = require("path");
const uploadRouter = require("express").Router();
const { AppError: AErr } = require("../utils/appError");

uploadRouter.use(authenticate);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename:    (req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new AErr("Only images allowed.", 400), false);
  }
});

uploadRouter.post("/image", upload.single("image"), (req, res, next) => {
  if (!req.file) return next(new AErr("No file uploaded.", 400));
  const url = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  res.json({ success: true, data: { url, filename: req.file.filename } });
});

module.exports.uploadRouter = uploadRouter;
