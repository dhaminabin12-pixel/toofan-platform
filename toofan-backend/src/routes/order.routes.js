// ─────────────────────────────────────────────────────────────
//  Order Routes  —  /api/v1/orders
// ─────────────────────────────────────────────────────────────

const router     = require("express").Router();
const { body, param, query } = require("express-validator");
const controller = require("../controllers/order.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authorize }    = require("../middleware/authorize.middleware");
const { validate }     = require("../middleware/validate.middleware");

// All order routes require authentication
router.use(authenticate);

// POST /orders  — Place a new order (customer)
router.post("/",
  authorize("CUSTOMER"),
  [
    body("restaurantId").notEmpty().withMessage("Restaurant required"),
    body("items").isArray({ min: 1 }).withMessage("At least 1 item required"),
    body("items.*.itemId").notEmpty(),
    body("items.*.quantity").isInt({ min: 1 }),
    body("paymentMethod").isIn(["CASH","ESEWA","KHALTI","WALLET"]),
    body("addressId").optional().isUUID(),
    body("couponCode").optional().trim(),
    body("scheduledFor").optional().isISO8601(),
    body("deliveryLat").optional().isFloat(),
    body("deliveryLng").optional().isFloat(),
    body("specialNote").optional().trim().isLength({ max: 300 }),
  ],
  validate,
  controller.placeOrder
);

// GET /orders  — List orders (customer: own, admin: all)
router.get("/", controller.listOrders);

// GET /orders/active  — Get active order for customer (for tracking)
router.get("/active", authorize("CUSTOMER"), controller.getActiveOrder);

// GET /orders/:id
router.get("/:id",
  [param("id").notEmpty()],
  validate,
  controller.getOrder
);

// PATCH /orders/:id/status  — Update order status
router.patch("/:id/status",
  [
    param("id").notEmpty(),
    body("status").isIn(["CONFIRMED","PREPARING","READY_FOR_PICKUP","PICKED_UP","ON_THE_WAY","DELIVERED","CANCELLED"]),
    body("note").optional().trim(),
  ],
  validate,
  controller.updateOrderStatus
);

// POST /orders/:id/cancel  — Customer cancels order
router.post("/:id/cancel",
  authorize("CUSTOMER"),
  [
    param("id").notEmpty(),
    body("reason").optional().trim(),
  ],
  validate,
  controller.cancelOrder
);

// POST /orders/:id/rate  — Customer rates order + driver
router.post("/:id/rate",
  authorize("CUSTOMER"),
  [
    param("id").notEmpty(),
    body("rating").isFloat({ min: 1, max: 5 }),
    body("review").optional().trim().isLength({ max: 500 }),
    body("driverRating").optional().isFloat({ min: 1, max: 5 }),
  ],
  validate,
  controller.rateOrder
);

// GET /orders/:id/chat  — Get chat messages for an order
router.get("/:id/chat", controller.getChatMessages);

// POST /orders/:id/chat  — Send a chat message
router.post("/:id/chat",
  [
    param("id").notEmpty(),
    body("message").trim().notEmpty().isLength({ max: 500 }),
  ],
  validate,
  controller.sendChatMessage
);

// GET /orders/:id/track  — Get live driver location for this order
router.get("/:id/track", authorize("CUSTOMER"), controller.trackOrder);

module.exports = router;
