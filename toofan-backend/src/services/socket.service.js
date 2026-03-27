// ─────────────────────────────────────────────────────────────
//  Socket.IO Service  —  Real-time layer
//  Handles:
//    • Driver location updates (every 10 sec)
//    • Order status broadcasts
//    • Driver job offer / accept / reject
//    • Customer order tracking
//    • In-app chat (customer ↔ driver)
// ─────────────────────────────────────────────────────────────

const { Server }  = require("socket.io");
const jwt         = require("jsonwebtoken");
const prisma      = require("../config/prisma");
const { logger }  = require("../utils/logger");

let io;

// ── INIT ──────────────────────────────────────────────────────
function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: [
        process.env.FRONTEND_URL || "http://localhost:3000",
        "http://localhost:19006",
      ],
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // ── AUTH MIDDLEWARE ─────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(" ")[1];
      if (!token) return next(new Error("No token"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      if (!user || !user.isActive) return next(new Error("Unauthorized"));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  // ── CONNECTION ───────────────────────────────────────────────
  io.on("connection", (socket) => {
    const { user } = socket;
    logger.info(`Socket connected: ${user.name} [${user.role}] — ${socket.id}`);

    // Join role-based rooms
    socket.join(`user:${user.id}`);

    if (user.role === "CUSTOMER") handleCustomer(socket, user);
    if (user.role === "DRIVER")   handleDriver(socket, user);
    if (user.role === "RESTAURANT_OWNER") handleRestaurant(socket, user);
    if (["SUPER_ADMIN","PARTNER_ADMIN"].includes(user.role)) handleAdmin(socket, user);

    socket.on("disconnect", () => {
      logger.info(`Socket disconnected: ${user.name}`);
      if (user.role === "DRIVER") onDriverDisconnect(user.id);
    });
  });

  logger.info("🔌 Socket.IO initialized");
  return io;
}

// ── CUSTOMER HANDLERS ─────────────────────────────────────────
function handleCustomer(socket, user) {
  // Join customer room for order updates
  socket.join(`customer:${user.id}`);

  // Track a specific order (join order room)
  socket.on("track_order", async ({ orderId }) => {
    try {
      const customer = await prisma.customer.findUnique({ where: { userId: user.id } });
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order || order.customerId !== customer?.id) return;
      socket.join(`order:${orderId}`);
      logger.info(`Customer ${user.id} tracking order ${orderId}`);
    } catch (e) {
      logger.error("track_order error:", e);
    }
  });

  socket.on("leave_order", ({ orderId }) => {
    socket.leave(`order:${orderId}`);
  });
}

// ── DRIVER HANDLERS ───────────────────────────────────────────
function handleDriver(socket, user) {
  socket.join(`driver:${user.id}`);

  // Driver goes online
  socket.on("driver_online", async () => {
    try {
      const driver = await prisma.driver.findUnique({ where: { userId: user.id } });
      if (!driver) return;
      await prisma.driver.update({
        where: { id: driver.id },
        data: { isOnline: true, status: "ONLINE" }
      });
      socket.join("drivers_online");
      // Notify admin
      io.to("admins").emit("driver_status_changed", { driverId: driver.id, status: "ONLINE" });
      logger.info(`Driver online: ${user.name}`);
    } catch (e) {
      logger.error("driver_online error:", e);
    }
  });

  // Driver goes offline
  socket.on("driver_offline", async () => {
    try {
      const driver = await prisma.driver.findUnique({ where: { userId: user.id } });
      if (!driver) return;
      await prisma.driver.update({
        where: { id: driver.id },
        data: { isOnline: false, status: "OFFLINE", currentLat: null, currentLng: null }
      });
      socket.leave("drivers_online");
      io.to("admins").emit("driver_status_changed", { driverId: driver.id, status: "OFFLINE" });
    } catch (e) {
      logger.error("driver_offline error:", e);
    }
  });

  // Driver updates location (every 10 seconds from app)
  socket.on("location_update", async ({ lat, lng, orderId }) => {
    try {
      const driver = await prisma.driver.findUnique({ where: { userId: user.id } });
      if (!driver) return;

      await prisma.driver.update({
        where: { id: driver.id },
        data: { currentLat: lat, currentLng: lng, lastLocationAt: new Date() }
      });

      // Broadcast location to customer tracking this order
      if (orderId) {
        io.to(`order:${orderId}`).emit("driver_location", {
          driverId: driver.id,
          lat, lng,
          timestamp: new Date().toISOString(),
        });
      }

      // Broadcast to admin dashboard
      io.to("admins").emit("driver_location_update", {
        driverId: driver.id,
        driverName: user.name,
        lat, lng,
        orderId: orderId || null,
      });
    } catch (e) {
      logger.error("location_update error:", e);
    }
  });

  // Driver accepts job offer
  socket.on("accept_job", async ({ orderId }) => {
    try {
      const driver = await prisma.driver.findUnique({ where: { userId: user.id } });
      if (!driver) return;

      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order || order.driverId) {
        socket.emit("job_taken", { orderId }); // Already taken by another driver
        return;
      }

      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: orderId },
          data: { driverId: driver.id }
        });
        await tx.driver.update({
          where: { id: driver.id },
          data: { status: "ON_DELIVERY" }
        });
        await tx.orderStatusHistory.create({
          data: { orderId, status: "CONFIRMED", note: `Driver ${user.name} assigned` }
        });
      });

      socket.emit("job_accepted", { orderId });
      socket.join(`order:${orderId}`);

      // Tell customer their driver is assigned
      io.to(`order:${orderId}`).emit("driver_assigned", {
        orderId,
        driver: { id: driver.id, name: user.name, phone: user.phone, rating: driver.rating, vehicleType: driver.vehicleType, vehicleName: driver.vehicleName },
      });

      logger.info(`Driver ${user.name} accepted order ${orderId}`);
    } catch (e) {
      logger.error("accept_job error:", e);
    }
  });

  // Driver rejects job offer
  socket.on("reject_job", async ({ orderId }) => {
    try {
      logger.info(`Driver ${user.name} rejected order ${orderId}`);
      socket.emit("job_rejected_ack", { orderId });
      // Dispatch continues to next driver (handled by timeout in order controller)
    } catch (e) {
      logger.error("reject_job error:", e);
    }
  });
}

// ── RESTAURANT HANDLERS ───────────────────────────────────────
function handleRestaurant(socket, user) {
  // Restaurant owner joins their restaurant room(s)
  prisma.restaurantOwner.findUnique({
    where: { userId: user.id },
    include: { restaurants: true }
  }).then(owner => {
    if (!owner) return;
    owner.restaurants.forEach(r => socket.join(`restaurant:${r.id}`));
    logger.info(`Restaurant owner ${user.name} joined ${owner.restaurants.length} room(s)`);
  });

  // Restaurant confirms it received the order
  socket.on("order_received", async ({ orderId }) => {
    try {
      await prisma.order.update({ where: { id: orderId }, data: { status: "CONFIRMED" } });
      io.to(`order:${orderId}`).emit("order_status_changed", { orderId, status: "CONFIRMED" });
    } catch (e) {
      logger.error("order_received error:", e);
    }
  });

  // Restaurant updates to preparing
  socket.on("order_preparing", async ({ orderId }) => {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.order.update({ where: { id: orderId }, data: { status: "PREPARING", preparedAt: new Date() } });
        await tx.orderStatusHistory.create({ data: { orderId, status: "PREPARING" } });
      });
      io.to(`order:${orderId}`).emit("order_status_changed", { orderId, status: "PREPARING" });
    } catch (e) {
      logger.error("order_preparing error:", e);
    }
  });

  // Restaurant marks ready for pickup
  socket.on("order_ready", async ({ orderId }) => {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.order.update({ where: { id: orderId }, data: { status: "READY_FOR_PICKUP" } });
        await tx.orderStatusHistory.create({ data: { orderId, status: "READY_FOR_PICKUP" } });
      });
      io.to(`order:${orderId}`).emit("order_status_changed", { orderId, status: "READY_FOR_PICKUP" });
      // Notify assigned driver
      const order = await prisma.order.findUnique({ where: { id: orderId }, include: { driver: { include: { user: true } } } });
      if (order?.driver?.id) {
        io.to(`driver:${order.driver.id}`).emit("order_ready_for_pickup", { orderId });
      }
    } catch (e) {
      logger.error("order_ready error:", e);
    }
  });
}

// ── ADMIN HANDLERS ────────────────────────────────────────────
function handleAdmin(socket, user) {
  socket.join("admins");
  logger.info(`Admin connected: ${user.name}`);
}

// ── DRIVER DISCONNECT ─────────────────────────────────────────
async function onDriverDisconnect(userId) {
  try {
    const driver = await prisma.driver.findUnique({ where: { userId } });
    if (!driver) return;
    await prisma.driver.update({
      where: { id: driver.id },
      data: { isOnline: false, status: "OFFLINE" }
    });
    io.to("admins").emit("driver_status_changed", { driverId: driver.id, status: "OFFLINE" });
  } catch (e) {
    logger.error("onDriverDisconnect error:", e);
  }
}

// ── EXPORT ────────────────────────────────────────────────────
function getIO() {
  if (!io) throw new Error("Socket.IO not initialized");
  return io;
}

module.exports = { initSocket, getIO };
