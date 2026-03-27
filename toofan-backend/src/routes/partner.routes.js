const router   = require("express").Router();
const { body } = require("express-validator");
const prisma   = require("../config/prisma");
const { authenticate } = require("../middleware/auth.middleware");
const { authorize }    = require("../middleware/authorize.middleware");
const { validate }     = require("../middleware/validate.middleware");
const { asyncHandler } = require("../utils/asyncHandler");
const { AppError }     = require("../utils/appError");

router.use(authenticate);

// POST /partners/register  — Business onboarding
router.post("/register",
  [
    body("name").notEmpty().withMessage("Business name required"),
    body("type").isIn(["restaurant","fleet","franchise","hybrid"]),
    body("city").notEmpty(),
    body("email").isEmail(),
    body("phone").notEmpty(),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { name, type, city, email, phone, description, brandColor } = req.body;

    const existing = await prisma.partner.findUnique({ where: { email } });
    if (existing) throw new AppError("Email already registered as a partner.", 409);

    const partner = await prisma.partner.create({
      data: {
        name, type, city, email, phone,
        description: description || null,
        brandColor:  brandColor  || null,
        status:     "PENDING",
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      }
    });

    // Link current user as partner admin
    await prisma.partnerAdmin.create({
      data: { userId: req.user.id, partnerId: partner.id }
    });

    // Update user role
    await prisma.user.update({
      where: { id: req.user.id },
      data:  { role: "PARTNER_ADMIN" }
    });

    res.status(201).json({
      success: true,
      message: "Application submitted. Await admin approval (usually within 24 hours).",
      data: partner
    });
  })
);

// GET /partners/me  — My partner dashboard data
router.get("/me", authorize("PARTNER_ADMIN"), asyncHandler(async (req, res) => {
  const pa = await prisma.partnerAdmin.findUnique({
    where: { userId: req.user.id },
    include: {
      partner: {
        include: {
          restaurants: { include: { _count: { select: { orders: true } } } },
          drivers:     { include: { user: { select: { name: true } } } },
          _count:      { select: { restaurants: true, drivers: true } }
        }
      }
    }
  });
  if (!pa) throw new AppError("Partner profile not found.", 404);

  // Revenue stats
  const today = new Date(); today.setHours(0,0,0,0);
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);

  const restIds = pa.partner.restaurants.map(r => r.id);

  const [todayRevenue, monthRevenue, todayOrders, totalOrders] = await Promise.all([
    prisma.payment.aggregate({
      where:  { status: "PAID", paidAt: { gte: today }, order: { restaurantId: { in: restIds } } },
      _sum:   { amount: true }
    }),
    prisma.payment.aggregate({
      where:  { status: "PAID", paidAt: { gte: monthStart }, order: { restaurantId: { in: restIds } } },
      _sum:   { amount: true }
    }),
    prisma.order.count({ where: { restaurantId: { in: restIds }, createdAt: { gte: today } } }),
    prisma.order.count({ where: { restaurantId: { in: restIds } } }),
  ]);

  res.json({
    success: true,
    data: {
      partner:      pa.partner,
      stats: {
        todayRevenue:  todayRevenue._sum.amount || 0,
        monthRevenue:  monthRevenue._sum.amount || 0,
        todayOrders,
        totalOrders,
      }
    }
  });
}));

// GET /partners  — All partners (admin only)
router.get("/", authorize("SUPER_ADMIN"), asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  let where = {};
  if (status) where.status = status;

  const [partners, total] = await Promise.all([
    prisma.partner.findMany({
      where,
      include: { _count: { select: { restaurants: true, drivers: true } } },
      orderBy: { createdAt: "desc" },
      skip: (parseInt(page)-1) * parseInt(limit),
      take: parseInt(limit),
    }),
    prisma.partner.count({ where })
  ]);

  res.json({ success: true, data: { partners, total } });
}));

// PATCH /partners/:id/approve
router.patch("/:id/approve", authorize("SUPER_ADMIN"), asyncHandler(async (req, res) => {
  const p = await prisma.partner.update({
    where: { id: req.params.id },
    data:  { status: "ACTIVE" }
  });
  res.json({ success: true, message: "Partner approved.", data: p });
}));

// PATCH /partners/:id/suspend
router.patch("/:id/suspend", authorize("SUPER_ADMIN"), asyncHandler(async (req, res) => {
  const p = await prisma.partner.update({
    where: { id: req.params.id },
    data:  { status: "SUSPENDED" }
  });
  res.json({ success: true, message: "Partner suspended.", data: p });
}));

// PATCH /partners/:id  — Update partner info
router.patch("/:id", authorize("PARTNER_ADMIN","SUPER_ADMIN"), asyncHandler(async (req, res) => {
  const { name, description, brandColor, logoUrl } = req.body;
  const data = {};
  if (name !== undefined)        data.name = name;
  if (description !== undefined) data.description = description;
  if (brandColor !== undefined)  data.brandColor = brandColor;
  if (logoUrl !== undefined)     data.logoUrl = logoUrl;
  const p = await prisma.partner.update({ where: { id: req.params.id }, data });
  res.json({ success: true, data: p });
}));

module.exports = router;
