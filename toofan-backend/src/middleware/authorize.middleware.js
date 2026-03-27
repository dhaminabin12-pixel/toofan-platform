const { AppError } = require("../utils/appError");

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return next(new AppError(`Access denied. Requires: ${roles.join(" or ")}`, 403));
  }
  next();
};

module.exports = { authorize };
