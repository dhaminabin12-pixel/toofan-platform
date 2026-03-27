// ─────────────────────────────────────────────────────────────
//  TooFan Backend — Main Entry Point
//  Bodh Software Company
// ─────────────────────────────────────────────────────────────

require("dotenv").config();
const http    = require("http");
const app     = require("./app");
const { initSocket } = require("./services/socket.service");
const { logger } = require("./utils/logger");
const cron    = require("./services/cron.service");

const PORT = process.env.PORT || 5000;

// Create HTTP server (needed for Socket.IO)
const server = http.createServer(app);

// Init WebSocket for live driver tracking & chat
initSocket(server);

// Start cron jobs (surge zones, daily earnings reset, etc.)
cron.start();

server.listen(PORT, () => {
  logger.info(`🌪️  TooFan API running on port ${PORT} [${process.env.NODE_ENV}]`);
  logger.info(`📖  Docs: http://localhost:${PORT}/api/docs`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received. Closing server...");
  server.close(() => {
    logger.info("Server closed.");
    process.exit(0);
  });
});
