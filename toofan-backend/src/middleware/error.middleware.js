const { logger } = require("../utils/logger");

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;

  if (process.env.NODE_ENV === "development") {
    logger.error(err.stack);
    return res.status(err.statusCode).json({
      success: false, message: err.message, stack: err.stack
    });
  }

  if (err.isOperational) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }

  // Handle Prisma errors
  if (err.code === "P2002") {
    return res.status(409).json({ success: false, message: "This record already exists." });
  }
  if (err.code === "P2025") {
    return res.status(404).json({ success: false, message: "Record not found." });
  }

  logger.error("UNHANDLED ERROR:", err);
  res.status(500).json({ success: false, message: "Something went wrong. Please try again." });
};

const notFound = (req, res) =>
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });

module.exports = { errorHandler, notFound };
