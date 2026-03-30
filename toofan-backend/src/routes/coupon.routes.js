const router  = require("express").Router();
const prisma  = require("../config/prisma");
const { body } = require("express-validator");
const { authenticate } = require("../middleware/auth.middleware");
const { authorize }    = require("../middleware/authorize.middleware");
const { validate }     = require("../middleware/validate.middleware");
const { asyncHandler } = require("../utils/asyncHandler");
const { AppError }     = require("../utils/appError");

router.use(authenticate);

router.get("/validate/:code", asyncHandler(async (req, res) => {
  const coupon = await prisma.coupon.findFirst({
    where: { code: req.params.code.toUpperCase(), isActive: true, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
  });
  if (!coupon || coupon.usageCount >= coupon.usageLimit) throw new AppError("Invalid or expired coupon.", 400);
  res.json({ success: true, data: { code: coupon.code, type: coupon.type, value: coupon.value, maxDiscount: coupon.maxDiscount, description: coupon.description, minOrder: coupon.minOrderAmount } });
}));

router.get("/", authorize("SUPER_ADMIN", "PARTNER_ADMIN"), asyncHandler(async (req, res) => {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  res.json({ success: true, data: coupons });
}));

router.post("/",
  authorize("SUPER_ADMIN", "PARTNER_ADMIN"),
  [body("code").notEmpty().trim(), body("type").isIn(["pct", "flat"]), body("value").isFloat({ min: 1 }), body("description").notEmpty()],
  validate,
  asyncHandler(async (req, res) => {
    const { code, description, type, value, maxDiscount, usageLimit, minOrderAmount, expiresAt } = req.body;
    const coupon = await prisma.coupon.create({ data: { code: code.toUpperCase().trim(), description, type, value: parseFloat(value), maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null, usageLimit: parseInt(usageLimit) || 100, minOrderAmount: parseFloat(minOrderAmount) || 0, expiresAt: expiresAt ? new Date(expiresAt) : null } });
    res.status(201).json({ success: true, data: coupon });
  })
);

router.patch("/:id", authorize("SUPER_ADMIN"), asyncHandler(async (req, res) => {
  const { isActive, usageLimit, expiresAt } = req.body;
  const data = {};
  if (isActive !== undefined)   data.isActive = isActive;
  if (usageLimit !== undefined) data.usageLimit = parseInt(usageLimit);
  if (expiresAt !== undefined)  data.expiresAt = new Date(expiresAt);
  const coupon = await prisma.coupon.update({ where: { id: req.params.id }, data });
  res.json({ success: true, data: coupon });
}));

module.exports = router;
