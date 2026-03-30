// ─────────────────────────────────────────────────────────────
//  customer.routes.js
// ─────────────────────────────────────────────────────────────
const router  = require("express").Router();
const prisma  = require("../config/prisma");
const { authenticate } = require("../middleware/auth.middleware");
const { authorize }    = require("../middleware/authorize.middleware");
const { asyncHandler } = require("../utils/asyncHandler");
const { AppError }     = require("../utils/appError");

router.use(authenticate);

// GET /customers/me — get current customer profile
router.get("/me", authorize("CUSTOMER"), asyncHandler(async (req, res) => {
  const customer = await prisma.customer.findUnique({
    where:   { userId: req.user.id },
    include: { user: { select: { name: true, email: true, phone: true, avatarUrl: true } }, addresses: true },
  });
  if (!customer) throw new AppError("Customer profile not found.", 404);
  res.json({ success: true, data: customer });
}));

// GET /customers/me/addresses — list saved addresses
router.get("/me/addresses", authorize("CUSTOMER"), asyncHandler(async (req, res) => {
  const customer = await prisma.customer.findUnique({ where: { userId: req.user.id } });
  if (!customer) throw new AppError("Customer profile not found.", 404);
  const addresses = await prisma.address.findMany({ where: { customerId: customer.id }, orderBy: { isDefault: "desc" } });
  res.json({ success: true, data: addresses });
}));

// POST /customers/me/addresses — add address
router.post("/me/addresses", authorize("CUSTOMER"), asyncHandler(async (req, res) => {
  const customer = await prisma.customer.findUnique({ where: { userId: req.user.id } });
  if (!customer) throw new AppError("Customer profile not found.", 404);
  const { label, line1, line2, city, lat, lng, isDefault } = req.body;
  if (isDefault) {
    await prisma.address.updateMany({ where: { customerId: customer.id }, data: { isDefault: false } });
  }
  const address = await prisma.address.create({
    data: { customerId: customer.id, label, line1, line2, city, lat: parseFloat(lat), lng: parseFloat(lng), isDefault: isDefault || false },
  });
  res.status(201).json({ success: true, data: address });
}));

// DELETE /customers/me/addresses/:id — remove address
router.delete("/me/addresses/:id", authorize("CUSTOMER"), asyncHandler(async (req, res) => {
  await prisma.address.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: "Address removed." });
}));

// GET /customers/me/wallet — wallet balance & transactions
router.get("/me/wallet", authorize("CUSTOMER"), asyncHandler(async (req, res) => {
  const customer = await prisma.customer.findUnique({ where: { userId: req.user.id } });
  if (!customer) throw new AppError("Customer profile not found.", 404);
  const txns = await prisma.walletTransaction.findMany({
    where: { customerId: customer.id }, orderBy: { createdAt: "desc" }, take: 50,
  });
  res.json({ success: true, data: { balance: customer.walletBalance, transactions: txns } });
}));

// GET /customers — list all (admin only)
router.get("/", authorize("SUPER_ADMIN"), asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      include: { user: { select: { name: true, email: true, phone: true } } },
      orderBy: { createdAt: "desc" },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
    }),
    prisma.customer.count(),
  ]);
  res.json({ success: true, data: { customers, total } });
}));

module.exports = router;
