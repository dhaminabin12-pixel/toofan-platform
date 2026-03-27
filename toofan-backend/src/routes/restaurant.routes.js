const router   = require("express").Router();
const { body, param } = require("express-validator");
const prisma   = require("../config/prisma");
const { authenticate }  = require("../middleware/auth.middleware");
const { authorize }     = require("../middleware/authorize.middleware");
const { validate }      = require("../middleware/validate.middleware");
const { asyncHandler }  = require("../utils/asyncHandler");
const { calcDistance }  = require("../utils/geo");
const { AppError }      = require("../utils/appError");

// GET /restaurants  — list with distance sort if lat/lng given
router.get("/", asyncHandler(async (req, res) => {
  const { lat, lng, cuisine, search, city, page = 1, limit = 20 } = req.query;
  let where = { isActive: true, isVerified: true };
  if (cuisine) where.cuisineType = cuisine;
  if (city)    where.city = { contains: city, mode: "insensitive" };
  if (search)  where.name = { contains: search, mode: "insensitive" };

  const restaurants = await prisma.restaurant.findMany({
    where,
    select: {
      id:true, name:true, cuisineType:true, rating:true, totalRatings:true,
      imageUrl:true, prepTimeMin:true, discountPct:true,
      lat:true, lng:true, address:true, city:true, isActive:true
    },
    skip: (parseInt(page)-1) * parseInt(limit),
    take: parseInt(limit),
  });

  const withDist = restaurants.map(r => ({
    ...r,
    distanceKm: (lat && lng)
      ? Math.round(calcDistance(parseFloat(lat), parseFloat(lng), r.lat, r.lng) * 10) / 10
      : null
  }));

  if (lat && lng) withDist.sort((a,b) => (a.distanceKm||99) - (b.distanceKm||99));

  res.json({ success: true, data: withDist });
}));

// GET /restaurants/my/favourites
router.get("/my/favourites", authenticate, authorize("CUSTOMER"), asyncHandler(async (req, res) => {
  const customer = await prisma.customer.findUnique({ where: { userId: req.user.id } });
  const favs = await prisma.favourite.findMany({
    where: { customerId: customer.id },
    include: { restaurant: true }
  });
  res.json({ success: true, data: favs.map(f => f.restaurant) });
}));

// GET /restaurants/:id  — with full menu
router.get("/:id", asyncHandler(async (req, res) => {
  const r = await prisma.restaurant.findUnique({
    where: { id: req.params.id },
    include: {
      menuCategories: {
        where: { isActive: true },
        include: { items: { where: { isAvailable: true }, orderBy: { sortOrder: "asc" } } },
        orderBy: { sortOrder: "asc" }
      }
    }
  });
  if (!r) throw new AppError("Restaurant not found.", 404);
  res.json({ success: true, data: r });
}));

// POST /restaurants
router.post("/",
  authenticate, authorize("RESTAURANT_OWNER","SUPER_ADMIN","PARTNER_ADMIN"),
  [
    body("name").notEmpty(), body("cuisineType").notEmpty(),
    body("address").notEmpty(), body("city").notEmpty(),
    body("lat").isFloat(), body("lng").isFloat(),
    body("phone").notEmpty(),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { name, description, cuisineType, address, city, lat, lng, phone, email, openingTime, closingTime, prepTimeMin } = req.body;
    let ownerId;
    if (req.user.role === "RESTAURANT_OWNER") {
      const owner = await prisma.restaurantOwner.findUnique({ where: { userId: req.user.id } });
      if (!owner) {
        await prisma.restaurantOwner.create({ data: { userId: req.user.id } });
        const newOwner = await prisma.restaurantOwner.findUnique({ where: { userId: req.user.id } });
        ownerId = newOwner.id;
      } else {
        ownerId = owner.id;
      }
    } else {
      // Admin creates — use first owner or create a placeholder
      let owner = await prisma.restaurantOwner.findFirst();
      ownerId = owner?.id;
    }
    const r = await prisma.restaurant.create({
      data: { ownerId, name, description, cuisineType, address, city, lat: parseFloat(lat), lng: parseFloat(lng), phone, email, openingTime: openingTime||"08:00", closingTime: closingTime||"22:00", prepTimeMin: parseInt(prepTimeMin)||20 }
    });
    res.status(201).json({ success: true, data: r });
  })
);

// PATCH /restaurants/:id
router.patch("/:id",
  authenticate, authorize("RESTAURANT_OWNER","SUPER_ADMIN","PARTNER_ADMIN"),
  asyncHandler(async (req, res) => {
    const { name, description, cuisineType, prepTimeMin, discountPct, isActive } = req.body;
    const data = {};
    if (name !== undefined)        data.name = name;
    if (description !== undefined) data.description = description;
    if (cuisineType !== undefined) data.cuisineType = cuisineType;
    if (prepTimeMin !== undefined) data.prepTimeMin = parseInt(prepTimeMin);
    if (discountPct !== undefined) data.discountPct = parseInt(discountPct);
    if (isActive !== undefined)    data.isActive = isActive;
    const r = await prisma.restaurant.update({ where: { id: req.params.id }, data });
    res.json({ success: true, data: r });
  })
);

// POST /restaurants/:id/favourite  — toggle
router.post("/:id/favourite", authenticate, authorize("CUSTOMER"), asyncHandler(async (req, res) => {
  const customer = await prisma.customer.findUnique({ where: { userId: req.user.id } });
  const existing = await prisma.favourite.findUnique({
    where: { customerId_restaurantId: { customerId: customer.id, restaurantId: req.params.id } }
  });
  if (existing) {
    await prisma.favourite.delete({ where: { id: existing.id } });
    return res.json({ success: true, data: { favourited: false } });
  }
  await prisma.favourite.create({ data: { customerId: customer.id, restaurantId: req.params.id } });
  res.json({ success: true, data: { favourited: true } });
}));

module.exports = router;
