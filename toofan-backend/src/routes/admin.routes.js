const router   = require("express").Router();
const prisma   = require("../config/prisma");
const { authenticate } = require("../middleware/auth.middleware");
const { authorize }    = require("../middleware/authorize.middleware");
const { asyncHandler } = require("../utils/asyncHandler");

router.use(authenticate, authorize("SUPER_ADMIN"));

// GET /admin/dashboard
router.get("/dashboard", asyncHandler(async (req, res) => {
  const today = new Date(); today.setHours(0,0,0,0);

  const [
    totalOrders, todayOrders, totalRevenue, todayRevenue,
    activeDrivers, totalRestaurants, totalCustomers,
    pendingDrivers, pendingPartners, recentOrders
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: today } } }),
    prisma.payment.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { status: "PAID", paidAt: { gte: today } }, _sum: { amount: true } }),
    prisma.driver.count({ where: { isOnline: true } }),
    prisma.restaurant.count({ where: { isActive: true } }),
    prisma.customer.count(),
    prisma.driver.count({ where: { status: "PENDING_APPROVAL" } }),
    prisma.partner.count({ where: { status: "PENDING" } }),
    prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { include: { user: { select: { name: true } } } },
        restaurant: { select: { name: true } },
      }
    }),
  ]);

  // Weekly revenue (last 7 days)
  const weeklyData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0);
    const e = new Date(d); e.setHours(23,59,59,999);
    const rev = await prisma.payment.aggregate({
      where: { status: "PAID", paidAt: { gte: d, lte: e } },
      _sum: { amount: true }
    });
    weeklyData.push({ date: d.toISOString().split("T")[0], revenue: rev._sum.amount || 0 });
  }

  res.json({
    success: true,
    data: {
      kpis: {
        totalOrders, todayOrders,
        totalRevenue:  totalRevenue._sum.amount || 0,
        todayRevenue:  todayRevenue._sum.amount || 0,
        activeDrivers, totalRestaurants, totalCustomers,
        pendingDrivers, pendingPartners,
      },
      weeklyRevenue: weeklyData,
      recentOrders,
    }
  });
}));

// GET /admin/orders
router.get("/orders", asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  let where = {};
  if (status) where.status = status;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        customer:   { include: { user: { select: { name: true, phone: true } } } },
        restaurant: { select: { name: true } },
        driver:     { include: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      skip:  (parseInt(page)-1) * parseInt(limit),
      take:  parseInt(limit),
    }),
    prisma.order.count({ where })
  ]);

  res.json({ success: true, data: { orders, total, page: parseInt(page) } });
}));

// GET /admin/config/:app
router.get("/config/:app", asyncHandler(async (req, res) => {
  const configs = await prisma.appConfig.findMany({ where: { app: req.params.app } });
  const obj = Object.fromEntries(configs.map(c => [c.key, c.value]));
  res.json({ success: true, data: obj });
}));

// PATCH /admin/config/:app
router.patch("/config/:app", asyncHandler(async (req, res) => {
  const updates = req.body;
  await Promise.all(
    Object.entries(updates).map(([key, value]) =>
      prisma.appConfig.upsert({
        where:  { app_key: { app: req.params.app, key } },
        update: { value: String(value) },
        create: { app: req.params.app, key, value: String(value) }
      })
    )
  );
  res.json({ success: true, message: "Config updated successfully." });
}));

// GET /admin/surge-zones
router.get("/surge-zones", asyncHandler(async (req, res) => {
  const zones = await prisma.surgeZone.findMany({ orderBy: { multiplier: "desc" } });
  res.json({ success: true, data: zones });
}));

// PATCH /admin/surge-zones/:id
router.patch("/surge-zones/:id", asyncHandler(async (req, res) => {
  const { multiplier, isActive, name } = req.body;
  const data = {};
  if (multiplier !== undefined) data.multiplier = parseFloat(multiplier);
  if (isActive !== undefined)   data.isActive = isActive;
  if (name !== undefined)       data.name = name;
  const zone = await prisma.surgeZone.update({ where: { id: req.params.id }, data });
  res.json({ success: true, data: zone });
}));

// GET /admin/drivers
router.get("/drivers", asyncHandler(async (req, res) => {
  const { status } = req.query;
  let where = {};
  if (status) where.status = status;
  const drivers = await prisma.driver.findMany({
    where,
    include: { user: { select: { name: true, phone: true, email: true } } },
    orderBy: { createdAt: "desc" }
  });
  res.json({ success: true, data: drivers });
}));

// GET /admin/partners
router.get("/partners", asyncHandler(async (req, res) => {
  const partners = await prisma.partner.findMany({
    include: { _count: { select: { restaurants: true, drivers: true } } },
    orderBy: { createdAt: "desc" }
  });
  res.json({ success: true, data: partners });
}));

// GET /admin/analytics
router.get("/analytics", asyncHandler(async (req, res) => {
  const [topRestaurants, topDrivers, paymentBreakdown] = await Promise.all([
    prisma.restaurant.findMany({
      where:   { isActive: true },
      orderBy: { totalOrders: "desc" },
      take:    5,
      select:  { name: true, totalOrders: true, rating: true }
    }),
    prisma.driver.findMany({
      orderBy: { totalTrips: "desc" },
      take:    5,
      include: { user: { select: { name: true } } }
    }),
    prisma.payment.groupBy({
      by:     ["method"],
      where:  { status: "PAID" },
      _sum:   { amount: true },
      _count: { id: true }
    }),
  ]);

  res.json({ success: true, data: { topRestaurants, topDrivers, paymentBreakdown } });
}));

module.exports = router;
