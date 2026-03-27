// ─────────────────────────────────────────────────────────────
//  Remaining Routes
// ─────────────────────────────────────────────────────────────

// ── restaurant.routes.js ─────────────────────────────────────
const restaurantRouter = require("express").Router();
const { authenticate } = require("../middleware/auth.middleware");
const { authorize }    = require("../middleware/authorize.middleware");
const prisma   = require("../config/prisma");
const { asyncHandler } = require("../utils/asyncHandler");
const { calcDistance }  = require("../utils/geo");
const { AppError }      = require("../utils/appError");

// GET /restaurants  — list with optional lat/lng for distance sort
restaurantRouter.get("/", asyncHandler(async (req, res) => {
  const { lat, lng, cuisine, search, page = 1, limit = 20 } = req.query;
  let where = { isActive: true, isVerified: true };
  if (cuisine) where.cuisineType = cuisine;
  if (search)  where.name = { contains: search, mode: "insensitive" };

  const restaurants = await prisma.restaurant.findMany({
    where,
    select: { id:true, name:true, cuisineType:true, rating:true, totalRatings:true, imageUrl:true, prepTimeMin:true, discountPct:true, lat:true, lng:true, address:true, city:true, isActive:true },
    skip: (parseInt(page)-1)*parseInt(limit),
    take: parseInt(limit),
  });

  // Add distance if lat/lng provided
  const withDist = restaurants.map(r => ({
    ...r,
    distanceKm: lat && lng ? Math.round(calcDistance(parseFloat(lat), parseFloat(lng), r.lat, r.lng) * 10) / 10 : null
  }));

  if (lat && lng) withDist.sort((a,b) => a.distanceKm - b.distanceKm);

  res.json({ success: true, data: withDist });
}));

// GET /restaurants/:id
restaurantRouter.get("/:id", asyncHandler(async (req, res) => {
  const r = await prisma.restaurant.findUnique({
    where: { id: req.params.id },
    include: { menuCategories: { include: { items: { where: { isAvailable: true }, orderBy: { sortOrder: "asc" } } }, orderBy: { sortOrder: "asc" } } }
  });
  if (!r) throw new AppError("Restaurant not found.", 404);
  res.json({ success: true, data: r });
}));

// POST /restaurants  — create (owner/admin)
restaurantRouter.post("/", authenticate, authorize("RESTAURANT_OWNER","SUPER_ADMIN","PARTNER_ADMIN"), asyncHandler(async (req, res) => {
  const { name, description, cuisineType, address, city, lat, lng, phone, email, openingTime, closingTime, prepTimeMin } = req.body;
  const owner = await prisma.restaurantOwner.findUnique({ where: { userId: req.user.id } });
  if (!owner) throw new AppError("Restaurant owner profile not found.", 404);
  const r = await prisma.restaurant.create({ data: { ownerId: owner.id, name, description, cuisineType, address, city, lat: parseFloat(lat), lng: parseFloat(lng), phone, email, openingTime, closingTime, prepTimeMin: parseInt(prepTimeMin)||20 } });
  res.status(201).json({ success: true, data: r });
}));

// PATCH /restaurants/:id
restaurantRouter.patch("/:id", authenticate, authorize("RESTAURANT_OWNER","SUPER_ADMIN"), asyncHandler(async (req, res) => {
  const { name, description, cuisineType, prepTimeMin, discountPct, isActive } = req.body;
  const r = await prisma.restaurant.update({ where: { id: req.params.id }, data: { name, description, cuisineType, prepTimeMin: prepTimeMin?parseInt(prepTimeMin):undefined, discountPct: discountPct?parseInt(discountPct):undefined, isActive } });
  res.json({ success: true, data: r });
}));

// GET /restaurants/:id/favourited  — toggle favourite
restaurantRouter.post("/:id/favourite", authenticate, authorize("CUSTOMER"), asyncHandler(async (req, res) => {
  const customer = await prisma.customer.findUnique({ where: { userId: req.user.id } });
  const existing = await prisma.favourite.findUnique({ where: { customerId_restaurantId: { customerId: customer.id, restaurantId: req.params.id } } });
  if (existing) {
    await prisma.favourite.delete({ where: { id: existing.id } });
    return res.json({ success: true, data: { favourited: false } });
  }
  await prisma.favourite.create({ data: { customerId: customer.id, restaurantId: req.params.id } });
  res.json({ success: true, data: { favourited: true } });
}));

// GET /restaurants/my/favourites
restaurantRouter.get("/my/favourites", authenticate, authorize("CUSTOMER"), asyncHandler(async (req, res) => {
  const customer = await prisma.customer.findUnique({ where: { userId: req.user.id } });
  const favs = await prisma.favourite.findMany({ where: { customerId: customer.id }, include: { restaurant: true } });
  res.json({ success: true, data: favs.map(f => f.restaurant) });
}));

module.exports.restaurantRouter = restaurantRouter;


// ── menu.routes.js ────────────────────────────────────────────
const menuRouter = require("express").Router();

menuRouter.get("/restaurant/:restaurantId", asyncHandler(async (req, res) => {
  const categories = await prisma.menuCategory.findMany({
    where: { restaurantId: req.params.restaurantId, isActive: true },
    include: { items: { where: { isAvailable: true }, orderBy: { sortOrder: "asc" } } },
    orderBy: { sortOrder: "asc" }
  });
  res.json({ success: true, data: categories });
}));

menuRouter.post("/categories", authenticate, authorize("RESTAURANT_OWNER","SUPER_ADMIN"), asyncHandler(async (req, res) => {
  const { restaurantId, name, sortOrder } = req.body;
  const cat = await prisma.menuCategory.create({ data: { restaurantId, name, sortOrder: sortOrder||0 } });
  res.status(201).json({ success: true, data: cat });
}));

menuRouter.post("/items", authenticate, authorize("RESTAURANT_OWNER","SUPER_ADMIN","PARTNER_ADMIN"), asyncHandler(async (req, res) => {
  const { categoryId, name, description, price, isVeg, calories } = req.body;
  const item = await prisma.menuItem.create({ data: { categoryId, name, description, price: parseFloat(price), isVeg: isVeg||false, calories: calories?parseInt(calories):null } });
  res.status(201).json({ success: true, data: item });
}));

menuRouter.patch("/items/:id", authenticate, authorize("RESTAURANT_OWNER","SUPER_ADMIN","PARTNER_ADMIN"), asyncHandler(async (req, res) => {
  const { name, description, price, isAvailable } = req.body;
  const item = await prisma.menuItem.update({ where: { id: req.params.id }, data: { name, description, price: price?parseFloat(price):undefined, isAvailable } });
  res.json({ success: true, data: item });
}));

menuRouter.delete("/items/:id", authenticate, authorize("RESTAURANT_OWNER","SUPER_ADMIN"), asyncHandler(async (req, res) => {
  await prisma.menuItem.update({ where: { id: req.params.id }, data: { isAvailable: false } });
  res.json({ success: true, message: "Item removed from menu." });
}));

module.exports.menuRouter = menuRouter;


// ── admin.routes.js ───────────────────────────────────────────
const adminRouter = require("express").Router();
adminRouter.use(authenticate, authorize("SUPER_ADMIN"));

// Dashboard KPIs
adminRouter.get("/dashboard", asyncHandler(async (req, res) => {
  const today = new Date(); today.setHours(0,0,0,0);

  const [totalOrders, todayOrders, totalRevenue, todayRevenue, activeDrivers, totalRestaurants, totalCustomers, pendingDrivers, pendingPartners] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: today } } }),
    prisma.payment.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { status: "PAID", paidAt: { gte: today } }, _sum: { amount: true } }),
    prisma.driver.count({ where: { isOnline: true } }),
    prisma.restaurant.count({ where: { isActive: true } }),
    prisma.customer.count(),
    prisma.driver.count({ where: { status: "PENDING_APPROVAL" } }),
    prisma.partner.count({ where: { status: "PENDING" } }),
  ]);

  // Weekly revenue
  const weeklyRevenue = await prisma.$queryRaw`
    SELECT DATE(p."paidAt") as date, SUM(p.amount) as revenue
    FROM payments p
    WHERE p.status = 'PAID' AND p."paidAt" >= NOW() - INTERVAL '7 days'
    GROUP BY DATE(p."paidAt")
    ORDER BY date ASC
  `;

  res.json({ success: true, data: {
    totalOrders, todayOrders, totalRevenue: totalRevenue._sum.amount||0, todayRevenue: todayRevenue._sum.amount||0,
    activeDrivers, totalRestaurants, totalCustomers, pendingDrivers, pendingPartners, weeklyRevenue,
  }});
}));

// Orders list
adminRouter.get("/orders", asyncHandler(async (req, res) => {
  const { status, page=1, limit=20 } = req.query;
  let where = {}; if (status) where.status = status;
  const [orders, total] = await Promise.all([
    prisma.order.findMany({ where, include: { customer: { include: { user: { select: { name:true, phone:true } } } }, restaurant: { select: { name:true } }, driver: { include: { user: { select: { name:true } } } } }, orderBy: { createdAt: "desc" }, skip: (parseInt(page)-1)*parseInt(limit), take: parseInt(limit) }),
    prisma.order.count({ where })
  ]);
  res.json({ success: true, data: { orders, total } });
}));

// Config management
adminRouter.get("/config/:app", asyncHandler(async (req, res) => {
  const configs = await prisma.appConfig.findMany({ where: { app: req.params.app } });
  const obj = Object.fromEntries(configs.map(c => [c.key, c.value]));
  res.json({ success: true, data: obj });
}));

adminRouter.patch("/config/:app", asyncHandler(async (req, res) => {
  const updates = req.body;
  await Promise.all(
    Object.entries(updates).map(([key, value]) =>
      prisma.appConfig.upsert({
        where: { app_key: { app: req.params.app, key } },
        update: { value: String(value) },
        create: { app: req.params.app, key, value: String(value) }
      })
    )
  );
  res.json({ success: true, message: "Config updated." });
}));

// Surge zones
adminRouter.get("/surge-zones", asyncHandler(async (req, res) => {
  const zones = await prisma.surgeZone.findMany();
  res.json({ success: true, data: zones });
}));
adminRouter.patch("/surge-zones/:id", asyncHandler(async (req, res) => {
  const zone = await prisma.surgeZone.update({ where: { id: req.params.id }, data: req.body });
  res.json({ success: true, data: zone });
}));

module.exports.adminRouter = adminRouter;


// ── partner.routes.js ─────────────────────────────────────────
const partnerRouter = require("express").Router();
partnerRouter.use(authenticate);

partnerRouter.post("/register", asyncHandler(async (req, res) => {
  const { name, type, city, email, phone, description } = req.body;
  const existing = await prisma.partner.findUnique({ where: { email } });
  if (existing) throw new AppError("Email already registered.", 409);
  const partner = await prisma.partner.create({ data: { name, type, city, email, phone, description, trialEndsAt: new Date(Date.now() + 14*24*60*60*1000) } });
  // Create partner admin link
  const pa = await prisma.partnerAdmin.create({ data: { userId: req.user.id, partnerId: partner.id } });
  res.status(201).json({ success: true, data: partner });
}));

partnerRouter.get("/me", authorize("PARTNER_ADMIN"), asyncHandler(async (req, res) => {
  const pa = await prisma.partnerAdmin.findUnique({ where: { userId: req.user.id }, include: { partner: { include: { restaurants: true, drivers: true } } } });
  if (!pa) throw new AppError("Not found.", 404);
  res.json({ success: true, data: pa.partner });
}));

partnerRouter.get("/", authorize("SUPER_ADMIN"), asyncHandler(async (req, res) => {
  const { status } = req.query;
  let where = {}; if (status) where.status = status;
  const partners = await prisma.partner.findMany({ where, include: { _count: { select: { restaurants: true, drivers: true } } }, orderBy: { createdAt: "desc" } });
  res.json({ success: true, data: partners });
}));

partnerRouter.patch("/:id/approve", authorize("SUPER_ADMIN"), asyncHandler(async (req, res) => {
  const p = await prisma.partner.update({ where: { id: req.params.id }, data: { status: "ACTIVE" } });
  res.json({ success: true, data: p });
}));

module.exports.partnerRouter = partnerRouter;


// ── coupon.routes.js ──────────────────────────────────────────
const couponRouter = require("express").Router();
couponRouter.use(authenticate);

couponRouter.get("/validate/:code", asyncHandler(async (req, res) => {
  const coupon = await prisma.coupon.findFirst({
    where: { code: req.params.code.toUpperCase(), isActive: true, OR: [{ expiresAt: null },{ expiresAt:{ gt: new Date() } }] }
  });
  if (!coupon || coupon.usageCount >= coupon.usageLimit) throw new AppError("Invalid or expired coupon.", 400);
  res.json({ success: true, data: { code: coupon.code, type: coupon.type, value: coupon.value, maxDiscount: coupon.maxDiscount, description: coupon.description } });
}));

couponRouter.post("/", authorize("SUPER_ADMIN","PARTNER_ADMIN"), asyncHandler(async (req, res) => {
  const { code, description, type, value, maxDiscount, usageLimit, minOrderAmount, expiresAt } = req.body;
  const coupon = await prisma.coupon.create({ data: { code: code.toUpperCase(), description, type, value: parseFloat(value), maxDiscount: maxDiscount?parseFloat(maxDiscount):null, usageLimit: parseInt(usageLimit)||100, minOrderAmount: parseFloat(minOrderAmount)||0, expiresAt: expiresAt?new Date(expiresAt):null } });
  res.status(201).json({ success: true, data: coupon });
}));

couponRouter.get("/", authorize("SUPER_ADMIN"), asyncHandler(async (req, res) => {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  res.json({ success: true, data: coupons });
}));

module.exports.couponRouter = couponRouter;


// ── notification.routes.js ────────────────────────────────────
const notifRouter = require("express").Router();
notifRouter.use(authenticate);

notifRouter.get("/", asyncHandler(async (req, res) => {
  const notifs = await prisma.notification.findMany({ where: { userId: req.user.id }, orderBy: { sentAt: "desc" }, take: 50 });
  res.json({ success: true, data: notifs });
}));

notifRouter.patch("/:id/read", asyncHandler(async (req, res) => {
  await prisma.notification.update({ where: { id: req.params.id }, data: { isRead: true } });
  res.json({ success: true });
}));

notifRouter.patch("/read-all", asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({ where: { userId: req.user.id }, data: { isRead: true } });
  res.json({ success: true });
}));

module.exports.notifRouter = notifRouter;


// ── config.routes.js ──────────────────────────────────────────
const configRouter = require("express").Router();

configRouter.get("/:app", asyncHandler(async (req, res) => {
  const configs = await prisma.appConfig.findMany({ where: { app: req.params.app } });
  const obj = Object.fromEntries(configs.map(c => [c.key, c.value]));
  res.json({ success: true, data: obj });
}));

module.exports.configRouter = configRouter;


// ── upload.routes.js ──────────────────────────────────────────
const multer = require("multer");
const path   = require("path");
const uploadRouter = require("express").Router();
uploadRouter.use(authenticate);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "./uploads/"),
  filename:    (req, file, cb) => cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname)}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new AppError("Only images allowed.", 400), false);
  }
});

uploadRouter.post("/image", upload.single("image"), (req, res) => {
  if (!req.file) throw new AppError("No file uploaded.", 400);
  const url = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  res.json({ success: true, data: { url, filename: req.file.filename } });
});

module.exports.uploadRouter = uploadRouter;
