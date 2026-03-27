// ─────────────────────────────────────────────────────────────
//  TooFan Database Seed
//  Run: node prisma/seed.js
//  Seeds dev data: admin, restaurants, menu items, drivers, coupons
// ─────────────────────────────────────────────────────────────

require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding TooFan database...\n");

  // ── SUPER ADMIN ────────────────────────────────────────────
  const adminHash = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { phone: "9800000000" },
    update: {},
    create: {
      name: "Nabin Sharma", email: "nabin@toofan.com",
      phone: "9800000000", passwordHash: adminHash,
      role: "SUPER_ADMIN", isVerified: true,
    }
  });
  console.log("✅ Super admin created:", admin.phone);

  // ── RESTAURANT OWNER ──────────────────────────────────────
  const ownerHash = await bcrypt.hash("owner123", 12);
  const ownerUser = await prisma.user.upsert({
    where: { phone: "9801111111" },
    update: {},
    create: { name: "Ram Shrestha", email: "ram@momo.com", phone: "9801111111", passwordHash: ownerHash, role: "RESTAURANT_OWNER", isVerified: true }
  });
  const owner = await prisma.restaurantOwner.upsert({
    where: { userId: ownerUser.id }, update: {}, create: { userId: ownerUser.id }
  });
  console.log("✅ Restaurant owner:", ownerUser.phone);

  // ── RESTAURANTS ───────────────────────────────────────────
  const restaurants = [
    { name: "Momo House",      cuisineType: "Nepali",     address: "Thamel, Kathmandu",   city: "Kathmandu", lat: 27.7152, lng: 85.3123, phone: "01-4444001", discountPct: 20, prepTimeMin: 20, rating: 4.8 },
    { name: "Dal Bhat Palace", cuisineType: "Traditional",address: "Lazimpat, Kathmandu",  city: "Kathmandu", lat: 27.7235, lng: 85.3128, phone: "01-4444002", discountPct: 0,  prepTimeMin: 25, rating: 4.6 },
    { name: "Tandoor Express", cuisineType: "Indian",     address: "Baneshwor, Kathmandu", city: "Kathmandu", lat: 27.6941, lng: 85.3385, phone: "01-4444003", discountPct: 15, prepTimeMin: 30, rating: 4.5 },
    { name: "Chiya & Snacks",  cuisineType: "Cafe",       address: "Putalisadak, KTM",     city: "Kathmandu", lat: 27.7024, lng: 85.3196, phone: "01-4444004", discountPct: 0,  prepTimeMin: 10, rating: 4.9 },
    { name: "Pizza Adda",      cuisineType: "Fast Food",  address: "New Baneshwor",        city: "Kathmandu", lat: 27.6921, lng: 85.3401, phone: "01-4444005", discountPct: 30, prepTimeMin: 25, rating: 4.3 },
    { name: "Biryani Hub",     cuisineType: "Mughlai",    address: "Kamaladi, Kathmandu",  city: "Kathmandu", lat: 27.7041, lng: 85.3157, phone: "01-4444006", discountPct: 0,  prepTimeMin: 35, rating: 4.7 },
  ];

  for (const rData of restaurants) {
    const r = await prisma.restaurant.upsert({
      where: { phone: rData.phone },
      update: {},
      create: { ...rData, ownerId: owner.id, isActive: true, isVerified: true, totalRatings: Math.floor(Math.random()*200)+50 }
    });

    // Create menu for Momo House
    if (r.name === "Momo House") {
      const cat = await prisma.menuCategory.upsert({
        where: { id: `cat_momo_starters` },
        update: {},
        create: { id: `cat_momo_starters`, restaurantId: r.id, name: "Momos", sortOrder: 1 }
      }).catch(() => prisma.menuCategory.create({ data: { restaurantId: r.id, name: "Momos", sortOrder: 1 } }));

      const items = [
        { name: "Veg Momo (8 pcs)", price: 150, isVeg: true },
        { name: "Chicken Momo (8 pcs)", price: 200, isVeg: false },
        { name: "Jhol Momo", price: 250, isVeg: false },
        { name: "Fried Momo", price: 220, isVeg: false },
        { name: "Steam C Momo", price: 180, isVeg: false },
      ];
      for (const item of items) {
        await prisma.menuItem.create({ data: { categoryId: cat.id, ...item } }).catch(() => {});
      }
    }
    console.log("✅ Restaurant:", r.name);
  }

  // ── DRIVERS ───────────────────────────────────────────────
  const driversData = [
    { name: "Bikash Tamang",   phone: "9801234567", vehicle: "MOTORCYCLE", plate: "Ba 12 Pa 3456", rating: 4.9, lat: 27.7160, lng: 85.3140 },
    { name: "Sanjay KC",       phone: "9807654321", vehicle: "MOTORCYCLE", plate: "Ba 2 Pa 7890",  rating: 4.7, lat: 27.7090, lng: 85.3160 },
    { name: "Ritu Shrestha",   phone: "9812345678", vehicle: "SCOOTER",    plate: "Ba 15 Pa 1234", rating: 4.5, lat: 27.7200, lng: 85.3100 },
    { name: "Naresh Maharjan", phone: "9845678901", vehicle: "MOTORCYCLE", plate: "Ba 5 Pa 5678",  rating: 4.8, lat: 27.7050, lng: 85.3200 },
  ];

  for (const d of driversData) {
    const hash = await bcrypt.hash("driver123", 12);
    const u = await prisma.user.upsert({
      where: { phone: d.phone }, update: {},
      create: { name: d.name, email: `${d.phone}@toofan.com`, phone: d.phone, passwordHash: hash, role: "DRIVER", isVerified: true }
    });
    await prisma.driver.upsert({
      where: { userId: u.id }, update: {},
      create: {
        userId: u.id, status: "APPROVED", isOnline: true,
        vehicleType: d.vehicle, vehicleNumber: d.plate,
        licenseNumber: `LIC${d.phone.slice(-6)}`, licenseExpiry: new Date("2027-01-01"),
        citizenshipNo: `CIT${d.phone.slice(-6)}`,
        currentLat: d.lat, currentLng: d.lng,
        rating: d.rating, totalRatings: 80, totalTrips: 100, totalEarnings: 50000,
      }
    });
    console.log("✅ Driver:", d.name);
  }

  // ── TEST CUSTOMER ─────────────────────────────────────────
  const custHash = await bcrypt.hash("customer123", 12);
  const custUser = await prisma.user.upsert({
    where: { phone: "9888888888" }, update: {},
    create: { name: "Test Customer", email: "customer@test.com", phone: "9888888888", passwordHash: custHash, role: "CUSTOMER", isVerified: true }
  });
  const customer = await prisma.customer.upsert({
    where: { userId: custUser.id }, update: {},
    create: { userId: custUser.id, walletBalance: 500, coins: 340 }
  });
  await prisma.address.create({
    data: { customerId: customer.id, label: "Home", line1: "Thamel, Kathmandu", city: "Kathmandu", lat: 27.7152, lng: 85.3123, isDefault: true }
  }).catch(() => {});
  console.log("✅ Test customer: 9888888888 / customer123");

  // ── COUPONS ───────────────────────────────────────────────
  const coupons = [
    { code: "TOOFAN50", description: "50% off first order (max रू200)", type: "pct", value: 50, maxDiscount: 200, usageLimit: 500 },
    { code: "FLAT100",  description: "रू100 flat off",                   type: "flat", value: 100, usageLimit: 1000 },
    { code: "NEWUSER",  description: "30% off for new users",            type: "pct", value: 30, maxDiscount: 150, usageLimit: 200 },
    { code: "MOMO20",   description: "20% off Momo House orders",        type: "pct", value: 20, maxDiscount: 100, usageLimit: 100, minOrderAmount: 200 },
  ];
  for (const c of coupons) {
    await prisma.coupon.upsert({ where: { code: c.code }, update: {}, create: c });
  }
  console.log("✅ Coupons seeded:", coupons.map(c => c.code).join(", "));

  // ── SURGE ZONES ───────────────────────────────────────────
  const surgeZones = [
    { name: "Thamel",    city: "Kathmandu", lat: 27.7152, lng: 85.3123, radiusKm: 1.5, multiplier: 2.1, isActive: true },
    { name: "Lazimpat",  city: "Kathmandu", lat: 27.7235, lng: 85.3128, radiusKm: 1.0, multiplier: 1.8, isActive: true },
    { name: "Baneshwor", city: "Kathmandu", lat: 27.6941, lng: 85.3385, radiusKm: 1.2, multiplier: 1.5, isActive: true },
    { name: "Kirtipur",  city: "Kathmandu", lat: 27.6780, lng: 85.2740, radiusKm: 1.0, multiplier: 1.3, isActive: true },
  ];
  for (const z of surgeZones) {
    await prisma.surgeZone.create({ data: z }).catch(() => {});
  }
  console.log("✅ Surge zones seeded");

  // ── APP CONFIG ────────────────────────────────────────────
  const configs = [
    { app: "khana",    key: "deliveryFee",       value: "50"       },
    { app: "khana",    key: "platformFee",        value: "20"       },
    { app: "khana",    key: "minOrderAmount",     value: "100"      },
    { app: "khana",    key: "maxDeliveryRadius",  value: "10"       },
    { app: "khana",    key: "welcomeMessage",     value: "Namaste! Ke khana mann lagyo?" },
    { app: "driver",   key: "perKmRate",          value: "15"       },
    { app: "driver",   key: "perDeliveryBonus",   value: "10"       },
    { app: "driver",   key: "dispatchRadiusKm",   value: "5"        },
    { app: "driver",   key: "offerTimeoutSec",    value: "30"       },
    { app: "business", key: "starterPrice",       value: "999"      },
    { app: "business", key: "growthPrice",        value: "2499"     },
    { app: "business", key: "trialDays",          value: "14"       },
  ];
  for (const c of configs) {
    await prisma.appConfig.upsert({
      where: { app_key: { app: c.app, key: c.key } },
      update: { value: c.value },
      create: c
    });
  }
  console.log("✅ App config seeded");

  console.log("\n✅ Database seeded successfully!");
  console.log("\n📋 Test credentials:");
  console.log("  Super Admin:    9800000000 / admin123");
  console.log("  Customer:       9888888888 / customer123");
  console.log("  Driver:         9801234567 / driver123");
  console.log("  Restaurant:     9801111111 / owner123");
}

main()
  .catch(e => { console.error("Seed failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
