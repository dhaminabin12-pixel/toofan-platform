// ─────────────────────────────────────────────────────────────
//  Auth Routes  —  /api/v1/auth
// ─────────────────────────────────────────────────────────────

const router     = require("express").Router();
const { body }   = require("express-validator");
const controller = require("../controllers/auth.controller");
const { validate } = require("../middleware/validate.middleware");
const { authenticate } = require("../middleware/auth.middleware");

// POST /auth/register
router.post("/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("phone").matches(/^[9][6-9]\d{8}$/).withMessage("Valid Nepali phone required"),
    body("email").isEmail().withMessage("Valid email required"),
    body("password").isLength({ min: 6 }).withMessage("Password min 6 chars"),
    body("role").optional().isIn(["CUSTOMER","DRIVER","RESTAURANT_OWNER"]),
  ],
  validate,
  controller.register
);

// POST /auth/login
router.post("/login",
  [
    body("phone").notEmpty().withMessage("Phone required"),
    body("password").notEmpty().withMessage("Password required"),
  ],
  validate,
  controller.login
);

// POST /auth/send-otp
router.post("/send-otp",
  [body("phone").notEmpty()],
  validate,
  controller.sendOtp
);

// POST /auth/verify-otp
router.post("/verify-otp",
  [
    body("phone").notEmpty(),
    body("code").isLength({ min: 6, max: 6 }).withMessage("6-digit OTP required"),
    body("purpose").isIn(["verify_phone","reset_password","login"]),
  ],
  validate,
  controller.verifyOtp
);

// POST /auth/refresh-token
router.post("/refresh-token",
  [body("refreshToken").notEmpty()],
  validate,
  controller.refreshToken
);

// POST /auth/logout
router.post("/logout", authenticate, controller.logout);

// POST /auth/reset-password
router.post("/reset-password",
  [
    body("phone").notEmpty(),
    body("otp").notEmpty(),
    body("newPassword").isLength({ min: 6 }),
  ],
  validate,
  controller.resetPassword
);

// GET /auth/me
router.get("/me", authenticate, controller.getMe);

// PATCH /auth/fcm-token  (update Firebase push token)
router.patch("/fcm-token",
  authenticate,
  [body("fcmToken").notEmpty()],
  validate,
  controller.updateFcmToken
);

module.exports = router;
