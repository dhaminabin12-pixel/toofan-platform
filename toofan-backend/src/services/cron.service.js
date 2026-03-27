const cron   = require("node-cron");
const prisma = require("../config/prisma");
const { logger } = require("../utils/logger");

const start = () => {
  // ── Reset today's driver earnings at midnight every day ───────────
  cron.schedule("0 0 * * *", async () => {
    try {
      await prisma.driver.updateMany({}, { data: { todayEarnings: 0 } });
      logger.info("⏰ Daily driver earnings reset completed");
    } catch (err) {
      logger.error("Cron daily reset error:", err);
    }
  });

  // ── Auto-cancel stale unassigned orders (>15 min with no driver) ──
  cron.schedule("*/5 * * * *", async () => {
    try {
      const cutoff = new Date(Date.now() - 15 * 60 * 1000);
      const stale = await prisma.order.findMany({
        where: { status: "CONFIRMED", driverId: null, createdAt: { lt: cutoff } }
      });
      for (const order of stale) {
        await prisma.order.update({
          where: { id: order.id },
          data:  { status: "CANCELLED", cancelledAt: new Date(), cancelReason: "No driver available" }
        });
        await prisma.orderStatusHistory.create({
          data: { orderId: order.id, status: "CANCELLED", note: "Auto-cancelled: no driver available" }
        });
        logger.warn(`Auto-cancelled stale order: ${order.orderNumber}`);
      }
    } catch (err) {
      logger.error("Cron stale order cancel error:", err);
    }
  });

  // ── Update surge zones based on order density every 5 min ─────────
  cron.schedule("*/5 * * * *", async () => {
    try {
      // Count orders in last 15 minutes per zone city
      const recentOrders = await prisma.order.count({
        where: { createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) } }
      });

      // Simple surge logic: if >20 orders in 15 min, activate all zones
      if (recentOrders > 20) {
        await prisma.surgeZone.updateMany({ data: { isActive: true } });
      } else if (recentOrders < 5) {
        await prisma.surgeZone.updateMany({ data: { isActive: false } });
      }
    } catch (err) {
      logger.error("Cron surge zone update error:", err);
    }
  });

  // ── Weekly target check (every hour) ──────────────────────────────
  cron.schedule("0 * * * *", async () => {
    try {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0,0,0,0);

      const WEEKLY_TARGET = 5000;
      const WEEKLY_BONUS  = 500;

      // Find drivers who just hit their weekly target
      const drivers = await prisma.driver.findMany({
        where: { status: "APPROVED", isOnline: true }
      });

      for (const driver of drivers) {
        const weekEarnings = await prisma.driverEarning.aggregate({
          where: { driverId: driver.id, date: { gte: weekStart } },
          _sum:  { amount: true }
        });
        const earned = weekEarnings._sum.amount || 0;

        // If they just crossed the target this hour, give them the bonus
        const alreadyGotBonus = await prisma.driverIncentive.findFirst({
          where: { driverId: driver.id, type: "weekly_target", earnedAt: { gte: weekStart } }
        });

        if (earned >= WEEKLY_TARGET && !alreadyGotBonus) {
          await prisma.driverIncentive.create({
            data: {
              driverId:    driver.id,
              type:        "weekly_target",
              amount:      WEEKLY_BONUS,
              description: `Weekly target bonus — reached रू${WEEKLY_TARGET}`,
            }
          });
          await prisma.driverEarning.create({
            data: {
              driverId:    driver.id,
              amount:      WEEKLY_BONUS,
              type:        "incentive",
              description: "Weekly target bonus रू500",
            }
          });
          logger.info(`Weekly target bonus paid to driver ${driver.id}`);
        }
      }
    } catch (err) {
      logger.error("Cron weekly bonus error:", err);
    }
  });

  logger.info("⏰ Cron jobs started (earnings reset, stale orders, surge zones, weekly bonuses)");
};

module.exports = { start };
