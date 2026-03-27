const router   = require("express").Router();
const { body } = require("express-validator");
const prisma   = require("../config/prisma");
const { authenticate } = require("../middleware/auth.middleware");
const { authorize }    = require("../middleware/authorize.middleware");
const { validate }     = require("../middleware/validate.middleware");
const { asyncHandler } = require("../utils/asyncHandler");

// GET /menu/restaurant/:restaurantId
router.get("/restaurant/:restaurantId", asyncHandler(async (req, res) => {
  const categories = await prisma.menuCategory.findMany({
    where:   { restaurantId: req.params.restaurantId, isActive: true },
    include: { items: { where: { isAvailable: true }, orderBy: { sortOrder: "asc" } } },
    orderBy: { sortOrder: "asc" }
  });
  res.json({ success: true, data: categories });
}));

// POST /menu/categories
router.post("/categories",
  authenticate, authorize("RESTAURANT_OWNER","SUPER_ADMIN","PARTNER_ADMIN"),
  [body("restaurantId").notEmpty(), body("name").notEmpty()],
  validate,
  asyncHandler(async (req, res) => {
    const { restaurantId, name, sortOrder } = req.body;
    const cat = await prisma.menuCategory.create({
      data: { restaurantId, name, sortOrder: sortOrder || 0 }
    });
    res.status(201).json({ success: true, data: cat });
  })
);

// POST /menu/items
router.post("/items",
  authenticate, authorize("RESTAURANT_OWNER","SUPER_ADMIN","PARTNER_ADMIN"),
  [body("categoryId").notEmpty(), body("name").notEmpty(), body("price").isFloat({ min: 0 })],
  validate,
  asyncHandler(async (req, res) => {
    const { categoryId, name, description, price, isVeg, calories, imageUrl } = req.body;
    const item = await prisma.menuItem.create({
      data: {
        categoryId, name, description,
        price:    parseFloat(price),
        isVeg:    isVeg || false,
        calories: calories ? parseInt(calories) : null,
        imageUrl: imageUrl || null,
      }
    });
    res.status(201).json({ success: true, data: item });
  })
);

// PATCH /menu/items/:id
router.patch("/items/:id",
  authenticate, authorize("RESTAURANT_OWNER","SUPER_ADMIN","PARTNER_ADMIN"),
  asyncHandler(async (req, res) => {
    const { name, description, price, isAvailable, isVeg, imageUrl } = req.body;
    const data = {};
    if (name !== undefined)        data.name = name;
    if (description !== undefined) data.description = description;
    if (price !== undefined)       data.price = parseFloat(price);
    if (isAvailable !== undefined) data.isAvailable = isAvailable;
    if (isVeg !== undefined)       data.isVeg = isVeg;
    if (imageUrl !== undefined)    data.imageUrl = imageUrl;
    const item = await prisma.menuItem.update({ where: { id: req.params.id }, data });
    res.json({ success: true, data: item });
  })
);

// DELETE /menu/items/:id  (soft delete)
router.delete("/items/:id",
  authenticate, authorize("RESTAURANT_OWNER","SUPER_ADMIN"),
  asyncHandler(async (req, res) => {
    await prisma.menuItem.update({
      where: { id: req.params.id },
      data:  { isAvailable: false }
    });
    res.json({ success: true, message: "Item removed from menu." });
  })
);

module.exports = router;
