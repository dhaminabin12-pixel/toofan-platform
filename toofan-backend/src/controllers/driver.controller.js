// ─────────────────────────────────────────────────────────────
//  Driver Controller
// ─────────────────────────────────────────────────────────────

const prisma   = require("../config/prisma");
const { AppError }  = require("../utils/appError");
const { asyncHandler } = require("../utils/asyncHandler");
const { calcDistance } = require("../utils/geo");

exports.applyAsDriver = asyncHandler(async (req, res) => {
  const { vehicleType, vehicleNumber, vehicleName, licenseNumber, licenseExpiry, citizenshipNo } = req.body;

  const existing = await prisma.driver.findUnique({ where: { userId: req.user.id } });
  if (existing) throw new AppError("Driver profile already exists.", 409);

  const driver = await prisma.driver.create({
    data: {
      userId: req.user.id,
      vehicleType, vehicleNumber, vehicleName,
      licenseNumber,
      licenseExpiry: new Date(licenseExpiry),
      citizenshipNo,
      status: "PENDING_APPROVAL",
    }
  });

  await prisma.user.update({ where: { id: req.user.id }, data: { role: "DRIVER" } });

  res.status(201).json({ success: true, message: "Application submitted. Await admin approval.", data: driver });
});

exports.getMyProfile = asyncHandler(async (req, res) => {
  const driver = await prisma.driver.findUnique({
    where: { userId: req.user.id },
    include: { user: { select: { name: true, phone: true, email: true, avatarUrl: true } } }
  });
  if (!driver) throw new AppError("Driver profile not found.", 404);
  res.json({ success: true, data: driver });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const { vehicleName, vehicleNumber } = req.body;
  const driver = await prisma.driver.findUnique({ where: { userId: req.user.id } });
  if (!driver) throw new AppError("Not found.", 404);

  const updated = await prisma.driver.update({
    where: { id: driver.id },
    data: { vehicleName, vehicleNumber }
  });
  res.json({ success: true, data: updated });
});

exports.getEarnings = asyncHandler(async (req, res) => {
  const driver = await prisma.driver.findUnique({ where: { userId: req.user.id } });
  if (!driver) throw new AppError("Not found.", 404);

  const today = new Date(); today.setHours(0,0,0,0);
  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);

  const [todayEarnings, weekEarnings, monthEarnings, recentEarnings] = await Promise.all([
    prisma.driverEarning.aggregate({ where: { driverId: driver.id, date: { gte: today } }, _sum: { amount: true } }),
    prisma.driverEarning.aggregate({ where: { driverId: driver.id, date: { gte: weekStart } }, _sum: { amount: true } }),
    prisma.driverEarning.aggregate({ where: { driverId: driver.id, date: { gte: monthStart } }, _sum: { amount: true } }),
    prisma.driverEarning.findMany({ where: { driverId: driver.id }, orderBy: { date: "desc" }, take: 10 }),
  ]);

  const todayTrips = await prisma.driverTrip.count({ where: { driverId: driver.id, completedAt: { gte: today } } });

  res.json({
    success: true,
    data: {
      today:     { amount: todayEarnings._sum.amount || 0, trips: todayTrips },
      week:      { amount: weekEarnings._sum.amount || 0 },
      month:     { amount: monthEarnings._sum.amount || 0 },
      total:     { amount: driver.totalEarnings, trips: driver.totalTrips },
      recent:    recentEarnings,
    }
  });
});

exports.getTripHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, date } = req.query;
  const driver = await prisma.driver.findUnique({ where: { userId: req.user.id } });
  if (!driver) throw new AppError("Not found.", 404);

  let where = { driverId: driver.id };
  if (date) {
    const start = new Date(date); start.setHours(0,0,0,0);
    const end   = new Date(date); end.setHours(23,59,59,999);
    where.completedAt = { gte: start, lte: end };
  }

  const [trips, total] = await Promise.all([
    prisma.driverTrip.findMany({
      where,
      include: { order: { include: { restaurant: { select: { name: true } } } } },
      orderBy: { completedAt: "desc" },
      skip: (parseInt(page)-1) * parseInt(limit),
      take: parseInt(limit),
    }),
    prisma.driverTrip.count({ where })
  ]);

  res.json({ success: true, data: { trips, total } });
});

exports.getIncentives = asyncHandler(async (req, res) => {
  const driver = await prisma.driver.findUnique({ where: { userId: req.user.id } });
  if (!driver) throw new AppError("Not found.", 404);

  const today = new Date(); today.setHours(0,0,0,0);
  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  const [todayTrips, weekEarnings] = await Promise.all([
    prisma.driverTrip.count({ where: { driverId: driver.id, completedAt: { gte: today } } }),
    prisma.driverEarning.aggregate({ where: { driverId: driver.id, date: { gte: weekStart } }, _sum: { amount: true } }),
  ]);

  // Static incentive config (in production, read from AppConfig table)
  const incentives = [
    { type: "rain_bonus",     title: "Rain Bonus",        desc: "1.5x earnings in heavy rain",     earn: "+50%",  status: "Active" },
    { type: "rush_hour",      title: "Rush Hour",          desc: "Extra रू20 per delivery 6–9 PM", earn: "+रू20", status: "Active" },
    { type: "streak_10",      title: "10-Trip Streak",     desc: "रू200 bonus for 10 trips today",  earn: "+रू200", status: `${todayTrips}/10` },
    { type: "long_pickup",    title: "Long Pickup Bonus",  desc: "रू30 extra for pickup > 3 km",   earn: "+रू30", status: "Active" },
  ];

  const weeklyTarget = 5000;
  const weeklyEarned = weekEarnings._sum.amount || 0;

  res.json({
    success: true,
    data: {
      incentives,
      weekly: { target: weeklyTarget, earned: weeklyEarned, bonus: 500 },
      todayTrips,
      cancellationRate: 4.2, // In production: calculate from actual data
    }
  });
});

exports.getSurgeZones = asyncHandler(async (req, res) => {
  const zones = await prisma.surgeZone.findMany({ where: { isActive: true } });
  res.json({ success: true, data: zones });
});

exports.getNearbyDrivers = asyncHandler(async (req, res) => {
  const { lat, lng, radius = 5 } = req.query;
  if (!lat || !lng) throw new AppError("lat and lng required", 400);

  const drivers = await prisma.driver.findMany({
    where: { isOnline: true, currentLat: { not: null } },
    include: { user: { select: { name: true, phone: true } } }
  });

  const nearby = drivers
    .map(d => ({ ...d, distKm: calcDistance(parseFloat(lat), parseFloat(lng), d.currentLat, d.currentLng) }))
    .filter(d => d.distKm <= parseFloat(radius))
    .sort((a,b) => a.distKm - b.distKm);

  res.json({ success: true, data: nearby });
});

exports.approveDriver = asyncHandler(async (req, res) => {
  const driver = await prisma.driver.update({
    where: { id: req.params.id },
    data: { status: "APPROVED" }
  });
  res.json({ success: true, data: driver });
});

exports.suspendDriver = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const driver = await prisma.driver.update({
    where: { id: req.params.id },
    data: { status: "SUSPENDED", isOnline: false }
  });
  res.json({ success: true, data: driver });
});

exports.listDrivers = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  let where = {};
  if (status) where.status = status;

  const [drivers, total] = await Promise.all([
    prisma.driver.findMany({
      where,
      include: { user: { select: { name: true, phone: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (parseInt(page)-1)*parseInt(limit),
      take: parseInt(limit),
    }),
    prisma.driver.count({ where })
  ]);

  res.json({ success: true, data: { drivers, total } });
});
