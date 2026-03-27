// ─────────────────────────────────────────────────────────────
//  Driver Routes  —  /api/v1/drivers
// ─────────────────────────────────────────────────────────────

const router     = require("express").Router();
const { body, param } = require("express-validator");
const controller = require("../controllers/driver.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authorize }    = require("../middleware/authorize.middleware");
const { validate }     = require("../middleware/validate.middleware");

router.use(authenticate);

// POST /drivers/apply  — New driver application
router.post("/apply",
  [
    body("vehicleType").isIn(["MOTORCYCLE","SCOOTER","BICYCLE","CAR"]),
    body("vehicleNumber").notEmpty(),
    body("licenseNumber").notEmpty(),
    body("licenseExpiry").isISO8601(),
    body("citizenshipNo").notEmpty(),
  ],
  validate,
  controller.applyAsDriver
);

// GET /drivers/me  — My driver profile
router.get("/me", authorize("DRIVER"), controller.getMyProfile);

// PATCH /drivers/me  — Update my profile
router.patch("/me", authorize("DRIVER"), controller.updateProfile);

// GET /drivers/me/earnings  — My earnings summary
router.get("/me/earnings", authorize("DRIVER"), controller.getEarnings);

// GET /drivers/me/trips  — My trip history
router.get("/me/trips", authorize("DRIVER"), controller.getTripHistory);

// GET /drivers/me/incentives  — Active bonuses & incentives
router.get("/me/incentives", authorize("DRIVER"), controller.getIncentives);

// GET /drivers/surge-zones  — Get current surge zones
router.get("/surge-zones", authorize("DRIVER"), controller.getSurgeZones);

// GET /drivers/nearby  — Get nearby drivers (admin/internal)
router.get("/nearby", authorize("SUPER_ADMIN","PARTNER_ADMIN"), controller.getNearbyDrivers);

// PATCH /drivers/:id/approve  — Admin approves driver
router.patch("/:id/approve",
  authorize("SUPER_ADMIN"),
  [param("id").notEmpty()],
  validate,
  controller.approveDriver
);

// PATCH /drivers/:id/suspend  — Admin suspends driver
router.patch("/:id/suspend",
  authorize("SUPER_ADMIN"),
  [param("id").notEmpty()],
  validate,
  controller.suspendDriver
);

// GET /drivers  — List all drivers (admin)
router.get("/", authorize("SUPER_ADMIN","PARTNER_ADMIN"), controller.listDrivers);

module.exports = router;
