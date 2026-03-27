// ─────────────────────────────────────────────────────────────
//  Payment Controller
//  eSewa & Khalti are the two main payment gateways in Nepal
// ─────────────────────────────────────────────────────────────

const prisma   = require("../config/prisma");
const { AppError }  = require("../utils/appError");
const { asyncHandler } = require("../utils/asyncHandler");
const { logger }    = require("../utils/logger");

// ── ESEWA ─────────────────────────────────────────────────────
// eSewa is Nepal's most popular payment gateway
// Docs: https://developer.esewa.com.np/

exports.initiateEsewa = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new AppError("Order not found.", 404);
  if (order.paymentStatus === "PAID") throw new AppError("Already paid.", 400);

  // eSewa requires these fields posted to their gateway
  const esewaParams = {
    amt:              order.total,
    psc:              0,           // service charge
    pdc:              0,           // delivery charge
    txAmt:            0,           // tax amount
    tAmt:             order.total, // total amount
    pid:              order.id,    // product/order ID
    scd:              process.env.ESEWA_MERCHANT_ID,
    su:               `${process.env.ESEWA_SUCCESS_URL}?orderId=${orderId}`,
    fu:               process.env.ESEWA_FAILURE_URL,
  };

  // In production: redirect user to eSewa form
  // For mobile app: return params and let frontend post to eSewa
  res.json({
    success: true,
    data: {
      gateway:    "esewa",
      actionUrl:  "https://uat.esewa.com.np/epay/main", // prod: https://esewa.com.np/epay/main
      params:     esewaParams,
      amount:     order.total,
    }
  });
});

exports.verifyEsewa = asyncHandler(async (req, res) => {
  const { orderId, refId } = req.body;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new AppError("Order not found.", 404);

  // Verify with eSewa's verification API
  const verifyUrl = `https://uat.esewa.com.np/epay/transrec`;
  // In production hit their verification endpoint:
  // POST to verifyUrl with: amt, scd, rid (refId), pid (orderId)
  // Response: <response>Success</response> if valid

  // For now, assume verification passed (implement actual HTTP call in production)
  const verified = true; // Replace with actual eSewa API call

  if (!verified) throw new AppError("eSewa payment verification failed.", 400);

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { orderId },
      data: { status: "PAID", gatewayRef: refId, paidAt: new Date() }
    });
    await tx.order.update({
      where: { id: orderId },
      data: { paymentStatus: "PAID" }
    });
  });

  logger.info(`eSewa payment verified for order ${orderId}, ref: ${refId}`);
  res.json({ success: true, message: "Payment verified successfully." });
});

// ── KHALTI ────────────────────────────────────────────────────
// Khalti is Nepal's second most popular wallet/payment gateway
// Docs: https://docs.khalti.com/

exports.initiateKhalti = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { customer: { include: { user: true } } }
  });
  if (!order) throw new AppError("Order not found.", 404);
  if (order.paymentStatus === "PAID") throw new AppError("Already paid.", 400);

  // Khalti v2 initiation payload
  const payload = {
    return_url:   `${process.env.ESEWA_SUCCESS_URL?.replace("esewa","khalti")}?orderId=${orderId}`,
    website_url:  process.env.FRONTEND_URL,
    amount:       order.total * 100, // Khalti uses paisa (1 NPR = 100 paisa)
    purchase_order_id: orderId,
    purchase_order_name: `TooFan Order #${order.orderNumber}`,
    customer_info: {
      name:  order.customer.user.name,
      email: order.customer.user.email,
      phone: order.customer.user.phone,
    },
  };

  // In production: POST to https://a.khalti.com/api/v2/epayment/initiate/
  // with Authorization: key YOUR_SECRET_KEY
  // Returns: { pidx, payment_url, expires_at }

  // Mock response for development
  const mockResponse = {
    pidx: `khalti_${Date.now()}`,
    payment_url: `https://test-pay.khalti.com/?pidx=mock_${orderId}`,
    expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  };

  res.json({
    success: true,
    data: {
      gateway:     "khalti",
      paymentUrl:  mockResponse.payment_url,
      pidx:        mockResponse.pidx,
      expiresAt:   mockResponse.expires_at,
      amount:      order.total,
    }
  });
});

exports.verifyKhalti = asyncHandler(async (req, res) => {
  const { orderId, token, pidx } = req.body;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new AppError("Order not found.", 404);

  // In production: POST to https://a.khalti.com/api/v2/epayment/lookup/
  // with { pidx } and Authorization: key YOUR_SECRET_KEY
  // Verify response.status === "Completed"

  const verified = true; // Replace with actual Khalti lookup

  if (!verified) throw new AppError("Khalti verification failed.", 400);

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { orderId },
      data: { status: "PAID", gatewayRef: pidx || token, paidAt: new Date() }
    });
    await tx.order.update({
      where: { id: orderId },
      data: { paymentStatus: "PAID" }
    });
  });

  logger.info(`Khalti payment verified for order ${orderId}`);
  res.json({ success: true, message: "Payment verified successfully." });
});

// ── WALLET ────────────────────────────────────────────────────
exports.topUpWallet = asyncHandler(async (req, res) => {
  const { amount } = req.body;

  const customer = await prisma.customer.findUnique({ where: { userId: req.user.id } });
  if (!customer) throw new AppError("Customer not found.", 404);

  // In production: integrate with eSewa/Khalti to actually charge the user
  // For now: directly credit the wallet (assumes payment already done)

  await prisma.$transaction(async (tx) => {
    await tx.customer.update({
      where: { id: customer.id },
      data: { walletBalance: { increment: parseFloat(amount) } }
    });
    await tx.walletTransaction.create({
      data: {
        customerId:  customer.id,
        amount:      parseFloat(amount),
        type:        "credit",
        description: `Wallet top-up`,
      }
    });
  });

  const updated = await prisma.customer.findUnique({ where: { id: customer.id } });
  res.json({ success: true, message: `रू${amount} added to wallet.`, data: { balance: updated.walletBalance } });
});

exports.getWalletBalance = asyncHandler(async (req, res) => {
  const customer = await prisma.customer.findUnique({ where: { userId: req.user.id } });
  if (!customer) throw new AppError("Not found.", 404);

  const recent = await prisma.walletTransaction.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  res.json({ success: true, data: { balance: customer.walletBalance, coins: customer.coins, transactions: recent } });
});

exports.getPaymentHistory = asyncHandler(async (req, res) => {
  const customer = await prisma.customer.findUnique({ where: { userId: req.user.id } });
  if (!customer) throw new AppError("Not found.", 404);

  const payments = await prisma.payment.findMany({
    where: { order: { customerId: customer.id } },
    include: { order: { select: { orderNumber: true, total: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  res.json({ success: true, data: payments });
});
