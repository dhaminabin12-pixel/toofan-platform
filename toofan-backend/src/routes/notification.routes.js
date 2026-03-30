const router  = require("express").Router();
const prisma  = require("../config/prisma");
const { authenticate } = require("../middleware/auth.middleware");
const { asyncHandler } = require("../utils/asyncHandler");

router.use(authenticate);

router.get("/", asyncHandler(async (req, res) => {
  const notifs = await prisma.notification.findMany({
    where:   { userId: req.user.id },
    orderBy: { sentAt: "desc" },
    take:    50,
  });
  const unreadCount = notifs.filter(n => !n.isRead).length;
  res.json({ success: true, data: { notifications: notifs, unreadCount } });
}));

router.patch("/:id/read", asyncHandler(async (req, res) => {
  await prisma.notification.update({ where: { id: req.params.id }, data: { isRead: true } });
  res.json({ success: true });
}));

router.patch("/read-all", asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({ where: { userId: req.user.id, isRead: false }, data: { isRead: true } });
  res.json({ success: true, message: "All notifications marked as read." });
}));

module.exports = router;
