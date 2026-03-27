const { PrismaClient } = require("@prisma/client");
const g = global;
const prisma = g.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query","error","warn"] : ["error"],
});
if (process.env.NODE_ENV !== "production") g.prisma = prisma;
module.exports = prisma;
