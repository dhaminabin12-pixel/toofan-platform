const router  = require("express").Router();
const prisma  = require("../config/prisma");
const { asyncHandler } = require("../utils/asyncHandler");

router.get("/:app", asyncHandler(async (req, res) => {
  const configs = await prisma.appConfig.findMany({ where: { app: req.params.app } });
  const obj = Object.fromEntries(configs.map(c => [c.key, c.value]));
  res.json({ success: true, data: obj });
}));

module.exports = router;
