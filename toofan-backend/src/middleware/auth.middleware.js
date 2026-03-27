const jwt   = require("jsonwebtoken");
const prisma = require("../config/prisma");
const { AppError } = require("../utils/appError");

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) throw new AppError("No token provided.", 401);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user || !user.isActive) throw new AppError("Unauthorized.", 401);
    req.user = user;
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError") return next(new AppError("Invalid token.", 401));
    if (err.name === "TokenExpiredError") return next(new AppError("Token expired.", 401));
    next(err);
  }
};

module.exports = { authenticate };
