// ─────────────────────────────────────────────────────────────
//  Payment Routes + Controller
//  Supports: eSewa, Khalti, Stripe, Wallet
// ─────────────────────────────────────────────────────────────

// ── ROUTES ────────────────────────────────────────────────────
const router     = require("express").Router();
const { body }   = require("express-validator");
const controller = require("../controllers/payment.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { validate }     = require("../middleware/validate.middleware");

router.use(authenticate);

router.post("/esewa/initiate",  [body("orderId").notEmpty()], validate, controller.initiateEsewa);
router.post("/esewa/verify",    [body("orderId").notEmpty(), body("refId").notEmpty()], validate, controller.verifyEsewa);
router.post("/khalti/initiate", [body("orderId").notEmpty()], validate, controller.initiateKhalti);
router.post("/khalti/verify",   [body("orderId").notEmpty(), body("token").notEmpty()], validate, controller.verifyKhalti);
router.post("/wallet/topup",    [body("amount").isFloat({ min: 100 })], validate, controller.topUpWallet);
router.get("/wallet/balance",   controller.getWalletBalance);
router.get("/history",          controller.getPaymentHistory);

module.exports = router;
