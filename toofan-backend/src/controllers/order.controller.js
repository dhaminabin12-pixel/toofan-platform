// ─────────────────────────────────────────────────────────────
//  Order Controller  +  Smart Dispatch Engine
// ─────────────────────────────────────────────────────────────

const prisma   = require("../config/prisma");
const { AppError }  = require("../utils/appError");
const { asyncHandler } = require("../utils/asyncHandler");
const { sendPush }  = require("../services/push.service");
const { getIO }     = require("../services/socket.service");
const { calcDistance } = require("../utils/geo");
const { logger }    = require("../utils/logger");

const DISPATCH_RADIUS_KM      = parseFloat(process.env.DISPATCH_RADIUS_KM)      || 5;
const DISPATCH_OFFER_TIMEOUT  = parseInt(process.env.DISPATCH_OFFER_TIMEOUT_SEC) || 30;
const DISPATCH_MAX_RETRY      = parseInt(process.env.DISPATCH_MAX_RETRY)         || 3;
const COINS_PER_ORDER         = 20;

// ── PLACE ORDER ───────────────────────────────────────────────
exports.placeOrder = asyncHandler(async (req, res) => {
  const {
    restaurantId, items, paymentMethod, addressId,
    couponCode, scheduledFor, deliveryLat, deliveryLng, specialNote
  } = req.body;

  const customer = await prisma.customer.findUnique({ where: { userId: req.user.id } });
  if (!customer) throw new AppError("Customer profile not found.", 404);

  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
  if (!restaurant || !restaurant.isActive) throw new AppError("Restaurant not available.", 404);

  // Validate + price items
  const itemIds = items.map(i => i.itemId);
  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: itemIds }, isAvailable: true }
  });
  if (menuItems.length !== itemIds.length) throw new AppError("One or more items unavailable.", 400);

  const itemMap = Object.fromEntries(menuItems.map(i => [i.id, i]));
  let subtotal = 0;
  const orderItems = items.map(i => {
    const menu = itemMap[i.itemId];
    const lineTotal = menu.price * i.quantity;
    subtotal += lineTotal;
    return { itemId: i.itemId, name: menu.name, price: menu.price, quantity: i.quantity, subtotal: lineTotal };
  });

  // Apply coupon
  let discountAmount = 0;
  if (couponCode) {
    const coupon = await prisma.coupon.findFirst({
      where: {
        code: couponCode.toUpperCase(),
        isActive: true,
        usageCount: { lt: prisma.coupon.fields.usageLimit },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        minOrderAmount: { lte: subtotal },
      }
    });
    if (!coupon) throw new AppError("Invalid or expired coupon.", 400);
    if (coupon.type === "pct") {
      discountAmount = Math.min(subtotal * (coupon.value / 100), coupon.maxDiscount || 9999);
    } else {
      discountAmount = coupon.value;
    }
    discountAmount = Math.round(discountAmount);
    await prisma.coupon.update({ where: { id: coupon.id }, data: { usageCount: { increment: 1 } } });
  }

  // Wallet payment check
  const deliveryFee = 50, platformFee = 20;
  const total = subtotal + deliveryFee + platformFee - discountAmount;

  if (paymentMethod === "WALLET") {
    if (customer.walletBalance < total) throw new AppError("Insufficient wallet balance.", 400);
  }

  // Create order in transaction
  const order = await prisma.$transaction(async (tx) => {
    const o = await tx.order.create({
      data: {
        customerId:    customer.id,
        restaurantId,
        addressId:     addressId || null,
        status:        "CONFIRMED",
        subtotal,
        deliveryFee,
        platformFee,
        discountAmount,
        couponCode:    couponCode?.toUpperCase() || null,
        total,
        paymentMethod,
        paymentStatus: paymentMethod === "CASH" ? "PENDING" : "PENDING",
        scheduledFor:  scheduledFor ? new Date(scheduledFor) : null,
        specialNote:   specialNote || null,
        deliveryLat:   deliveryLat || null,
        deliveryLng:   deliveryLng || null,
        confirmedAt:   new Date(),
        coinsEarned:   COINS_PER_ORDER,
        items:         { create: orderItems },
      },
      include: { items: true }
    });

    // Add status history
    await tx.orderStatusHistory.create({
      data: { orderId: o.id, status: "CONFIRMED", note: "Order placed successfully" }
    });

    // Deduct wallet if used
    if (paymentMethod === "WALLET") {
      await tx.customer.update({
        where: { id: customer.id },
        data: { walletBalance: { decrement: total } }
      });
      await tx.walletTransaction.create({
        data: { customerId: customer.id, amount: -total, type: "debit", description: `Order ${o.orderNumber}` }
      });
      await tx.payment.create({
        data: { orderId: o.id, method: "WALLET", status: "PAID", amount: total, paidAt: new Date() }
      });
    } else {
      await tx.payment.create({
        data: { orderId: o.id, method: paymentMethod, status: "PENDING", amount: total }
      });
    }

    // Add coins to customer
    await tx.customer.update({
      where: { id: customer.id },
      data: { coins: { increment: COINS_PER_ORDER }, totalOrders: { increment: 1 } }
    });

    return o;
  });

  // Notify restaurant
  const io = getIO();
  io.to(`restaurant:${restaurantId}`).emit("new_order", { orderId: order.id });

  // Push notification to customer
  const customerUser = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (customerUser?.fcmToken) {
    await sendPush(customerUser.fcmToken, {
      title: "Order Confirmed! ✅",
      body: `Your order from ${restaurant.name} is confirmed.`,
      data: { orderId: order.id, type: "ORDER_CONFIRMED" }
    });
  }

  logger.info(`Order placed: ${order.orderNumber} by customer ${customer.id}`);

  // Trigger smart dispatch (non-blocking)
  if (!scheduledFor) {
    triggerDispatch(order.id).catch(err => logger.error("Dispatch error:", err));
  }

  res.status(201).json({ success: true, data: order });
});

// ── SMART DISPATCH ENGINE ─────────────────────────────────────
// Finds nearest highest-scored available driver and offers the job
async function triggerDispatch(orderId, attempt = 1) {
  if (attempt > DISPATCH_MAX_RETRY) {
    logger.warn(`Dispatch failed after ${DISPATCH_MAX_RETRY} attempts for order ${orderId}`);
    await prisma.orderStatusHistory.create({
      data: { orderId, status: "PENDING", note: "No driver found. Retrying..." }
    });
    return;
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { restaurant: true }
  });
  if (!order || order.status === "CANCELLED") return;

  // Get all online available drivers within radius
  const drivers = await prisma.driver.findMany({
    where: {
      status: "ONLINE",
      isOnline: true,
      currentLat: { not: null },
      currentLng: { not: null },
    },
    include: { user: true }
  });

  // Score each driver: distance (60%) + rating (40%)
  const scored = drivers
    .map(driver => {
      const dist = calcDistance(
        order.restaurant.lat, order.restaurant.lng,
        driver.currentLat,    driver.currentLng
      );
      if (dist > DISPATCH_RADIUS_KM) return null;
      const distScore   = (1 - dist / DISPATCH_RADIUS_KM) * 60;
      const ratingScore = driver.totalRatings > 0 ? ((driver.rating - 1) / 4) * 40 : 20;
      return { driver, dist: Math.round(dist * 10) / 10, score: Math.round(distScore + ratingScore) };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    logger.warn(`No drivers found for order ${orderId}, attempt ${attempt}`);
    setTimeout(() => triggerDispatch(orderId, attempt + 1), 30000);
    return;
  }

  // Offer to top-ranked driver
  const { driver, dist } = scored[0];
  logger.info(`Offering order ${orderId} to driver ${driver.id} (score: ${scored[0].score}, dist: ${dist}km)`);

  const io = getIO();
  io.to(`driver:${driver.id}`).emit("job_offer", {
    orderId: order.id,
    orderNumber: order.orderNumber,
    restaurant: { name: order.restaurant.name, address: order.restaurant.address, lat: order.restaurant.lat, lng: order.restaurant.lng },
    deliveryLat: order.deliveryLat,
    deliveryLng: order.deliveryLng,
    items: order.items,
    total: order.total,
    earn: Math.round(order.deliveryFee * 0.8),
    distKm: dist,
    timeoutSec: DISPATCH_OFFER_TIMEOUT,
    queueInfo: scored.length > 1 ? `Next: ${scored[1]?.driver?.user?.name}` : null,
  });

  if (driver.user?.fcmToken) {
    await sendPush(driver.user.fcmToken, {
      title: "🔔 New Delivery Job!",
      body: `${order.restaurant.name} → ${dist} km away. Earn रू${Math.round(order.deliveryFee * 0.8)}`,
      data: { orderId: order.id, type: "JOB_OFFER" }
    });
  }

  // Set timeout — if driver doesn't respond, try next
  setTimeout(async () => {
    const fresh = await prisma.order.findUnique({ where: { id: orderId } });
    if (fresh && !fresh.driverId && fresh.status === "CONFIRMED") {
      logger.info(`Driver ${driver.id} didn't respond. Trying next...`);
      // Skip this driver and try again with remaining
      triggerNextDriver(orderId, scored.slice(1), attempt);
    }
  }, DISPATCH_OFFER_TIMEOUT * 1000);
}

async function triggerNextDriver(orderId, remaining, attempt) {
  if (remaining.length === 0) {
    return triggerDispatch(orderId, attempt + 1);
  }
  const { driver, dist } = remaining[0];
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { restaurant: true } });
  if (!order || order.driverId) return;

  const io = getIO();
  io.to(`driver:${driver.id}`).emit("job_offer", {
    orderId: order.id,
    orderNumber: order.orderNumber,
    restaurant: { name: order.restaurant.name, lat: order.restaurant.lat, lng: order.restaurant.lng },
    earn: Math.round(order.deliveryFee * 0.8),
    distKm: dist,
    timeoutSec: DISPATCH_OFFER_TIMEOUT,
  });

  setTimeout(async () => {
    const fresh = await prisma.order.findUnique({ where: { id: orderId } });
    if (fresh && !fresh.driverId) {
      triggerNextDriver(orderId, remaining.slice(1), attempt);
    }
  }, DISPATCH_OFFER_TIMEOUT * 1000);
}

// ── UPDATE ORDER STATUS ───────────────────────────────────────
exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;

  const order = await prisma.order.findUnique({ where: { id }, include: { customer: { include: { user: true } }, driver: { include: { user: true } } } });
  if (!order) throw new AppError("Order not found.", 404);

  const timestamps = {
    CONFIRMED:        { confirmedAt: new Date() },
    PREPARING:        { preparedAt: new Date() },
    PICKED_UP:        { pickedUpAt: new Date() },
    DELIVERED:        { deliveredAt: new Date() },
    CANCELLED:        { cancelledAt: new Date() },
  };

  const updated = await prisma.$transaction(async (tx) => {
    const o = await tx.order.update({
      where: { id },
      data: { status, ...(timestamps[status] || {}) }
    });
    await tx.orderStatusHistory.create({ data: { orderId: id, status, note } });

    // On delivery: credit driver earnings + coins to customer
    if (status === "DELIVERED") {
      const earn = Math.round(order.deliveryFee * 0.8);
      if (order.driverId) {
        await tx.driver.update({
          where: { id: order.driverId },
          data: { totalTrips: { increment: 1 }, totalEarnings: { increment: earn }, todayEarnings: { increment: earn } }
        });
        await tx.driverEarning.create({
          data: { driverId: order.driverId, amount: earn, type: "base", description: `Order ${order.orderNumber}`, orderId: id }
        });
        await tx.driverTrip.create({
          data: { driverId: order.driverId, orderId: id, distanceKm: 2.5, durationMin: 20, earnings: earn }
        });
      }
    }
    return o;
  });

  // Emit socket event
  const io = getIO();
  io.to(`order:${id}`).emit("order_status_changed", { orderId: id, status, note });
  io.to(`customer:${order.customerId}`).emit("order_update", { orderId: id, status });

  // Push to customer
  const customerFcm = order.customer?.user?.fcmToken;
  const pushMessages = {
    PREPARING:  { title: "🍳 Preparing your order", body: "Restaurant is cooking your food!" },
    PICKED_UP:  { title: "🛵 Driver picked up your order", body: "Your food is on the way!" },
    DELIVERED:  { title: "🎉 Order Delivered!", body: "Enjoy your meal. Don't forget to rate!" },
    CANCELLED:  { title: "❌ Order Cancelled", body: "Your order was cancelled." },
  };
  if (customerFcm && pushMessages[status]) {
    await sendPush(customerFcm, { ...pushMessages[status], data: { orderId: id, type: `ORDER_${status}` } });
  }

  res.json({ success: true, data: updated });
});

// ── LIST ORDERS ───────────────────────────────────────────────
exports.listOrders = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  let where = {};
  if (req.user.role === "CUSTOMER") {
    const customer = await prisma.customer.findUnique({ where: { userId: req.user.id } });
    where.customerId = customer.id;
  } else if (req.user.role === "DRIVER") {
    const driver = await prisma.driver.findUnique({ where: { userId: req.user.id } });
    where.driverId = driver.id;
  }
  if (status) where.status = status;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where, skip, take: parseInt(limit),
      include: { restaurant: { select: { name: true, imageUrl: true } }, items: true },
      orderBy: { createdAt: "desc" }
    }),
    prisma.order.count({ where })
  ]);

  res.json({ success: true, data: { orders, total, page: parseInt(page), totalPages: Math.ceil(total / limit) } });
});

// ── GET ORDER ─────────────────────────────────────────────────
exports.getOrder = asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      items: true,
      restaurant: true,
      driver: { include: { user: { select: { name: true, phone: true, avatarUrl: true } } } },
      statusHistory: { orderBy: { createdAt: "asc" } },
      payment: true,
    }
  });
  if (!order) throw new AppError("Order not found.", 404);
  res.json({ success: true, data: order });
});

// ── GET ACTIVE ORDER ──────────────────────────────────────────
exports.getActiveOrder = asyncHandler(async (req, res) => {
  const customer = await prisma.customer.findUnique({ where: { userId: req.user.id } });
  const order = await prisma.order.findFirst({
    where: {
      customerId: customer.id,
      status: { notIn: ["DELIVERED","CANCELLED","REFUNDED"] }
    },
    include: {
      items: true,
      restaurant: true,
      driver: { include: { user: { select: { name: true, phone: true, avatarUrl: true } } } },
      statusHistory: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" }
  });
  res.json({ success: true, data: order });
});

// ── CANCEL ORDER ──────────────────────────────────────────────
exports.cancelOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw new AppError("Order not found.", 404);

  const cancellable = ["PENDING","CONFIRMED","PREPARING"];
  if (!cancellable.includes(order.status)) throw new AppError("Order cannot be cancelled at this stage.", 400);

  await prisma.$transaction(async (tx) => {
    await tx.order.update({ where: { id }, data: { status: "CANCELLED", cancelledAt: new Date(), cancelReason: reason } });
    await tx.orderStatusHistory.create({ data: { orderId: id, status: "CANCELLED", note: reason } });

    // Refund wallet if paid via wallet
    if (order.paymentMethod === "WALLET" && order.paymentStatus === "PAID") {
      const customer = await tx.customer.findUnique({ where: { id: order.customerId } });
      await tx.customer.update({ where: { id: order.customerId }, data: { walletBalance: { increment: order.total } } });
      await tx.walletTransaction.create({
        data: { customerId: order.customerId, amount: order.total, type: "credit", description: `Refund for order ${order.orderNumber}` }
      });
    }
  });

  const io = getIO();
  io.to(`order:${id}`).emit("order_status_changed", { orderId: id, status: "CANCELLED" });

  res.json({ success: true, message: "Order cancelled successfully." });
});

// ── RATE ORDER ────────────────────────────────────────────────
exports.rateOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating, review, driverRating } = req.body;

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order || order.status !== "DELIVERED") throw new AppError("Can only rate delivered orders.", 400);

  await prisma.$transaction(async (tx) => {
    await tx.order.update({ where: { id }, data: { rating, review, driverRating } });

    // Update restaurant rating
    const rest = await tx.restaurant.findUnique({ where: { id: order.restaurantId } });
    const newTotal = rest.totalRatings + 1;
    const newRating = ((rest.rating * rest.totalRatings) + rating) / newTotal;
    await tx.restaurant.update({ where: { id: order.restaurantId }, data: { rating: newRating, totalRatings: newTotal } });

    // Update driver rating
    if (order.driverId && driverRating) {
      const driver = await tx.driver.findUnique({ where: { id: order.driverId } });
      const dNewTotal = driver.totalRatings + 1;
      const dNewRating = ((driver.rating * driver.totalRatings) + driverRating) / dNewTotal;
      await tx.driver.update({ where: { id: order.driverId }, data: { rating: dNewRating, totalRatings: dNewTotal } });
    }

    // Update driver trip
    if (order.driverId) {
      await tx.driverTrip.updateMany({ where: { orderId: id }, data: { rating: driverRating } });
    }
  });

  res.json({ success: true, message: "Thanks for your rating!" });
});

// ── TRACK ORDER ───────────────────────────────────────────────
exports.trackOrder = asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      driver: { select: { currentLat: true, currentLng: true, vehicleType: true, vehicleName: true, user: { select: { name: true, phone: true, avatarUrl: true } } } },
      restaurant: { select: { lat: true, lng: true, name: true } },
      statusHistory: { orderBy: { createdAt: "desc" }, take: 1 },
    }
  });
  if (!order) throw new AppError("Order not found.", 404);

  res.json({
    success: true,
    data: {
      status:      order.status,
      driver:      order.driver,
      restaurant:  order.restaurant,
      deliveryLat: order.deliveryLat,
      deliveryLng: order.deliveryLng,
    }
  });
});

// ── CHAT MESSAGES ─────────────────────────────────────────────
exports.getChatMessages = asyncHandler(async (req, res) => {
  const messages = await prisma.chatMessage.findMany({
    where: { orderId: req.params.id },
    orderBy: { createdAt: "asc" }
  });
  res.json({ success: true, data: messages });
});

exports.sendChatMessage = asyncHandler(async (req, res) => {
  const { message } = req.body;
  const { id: orderId } = req.params;

  const msg = await prisma.chatMessage.create({
    data: { orderId, senderId: req.user.id, senderRole: req.user.role === "DRIVER" ? "driver" : "customer", message }
  });

  const io = getIO();
  io.to(`order:${orderId}`).emit("chat_message", msg);

  res.status(201).json({ success: true, data: msg });
});
