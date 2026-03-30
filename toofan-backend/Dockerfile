# ─────────────────────────────────────────────
#  TooFan Backend — Dockerfile
# ─────────────────────────────────────────────
FROM node:18-alpine AS base

# Install OpenSSL — required by Prisma on Alpine
RUN apk add --no-cache openssl

WORKDIR /app

# Install dependencies only
COPY package*.json ./
RUN npm install --omit=dev

# Generate Prisma client
COPY prisma ./prisma
RUN npx prisma generate

# Copy source
COPY src ./src

EXPOSE 5000

CMD ["node", "src/index.js"]
