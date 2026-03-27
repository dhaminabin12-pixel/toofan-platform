# 🌪️ TooFan Backend API
**Bodh Software Company — Nepal**

Complete Node.js + PostgreSQL backend for TooFan Khana, Driver & Business Portal.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file and fill in values
cp .env.example .env

# 3. Create PostgreSQL database
createdb toofan_db

# 4. Run database migrations
npm run db:migrate

# 5. Seed with sample data
npm run db:seed

# 6. Start development server
npm run dev
```

Server runs at: `http://localhost:5000`
API docs at: `http://localhost:5000/api/docs`

---

## 📋 Test Credentials (after seed)

| Role | Phone | Password |
|------|-------|----------|
| Super Admin | 9800000000 | admin123 |
| Customer | 9888888888 | customer123 |
| Driver | 9801234567 | driver123 |
| Restaurant Owner | 9801111111 | owner123 |

---

## 📁 Project Structure

```
toofan-backend/
├── prisma/
│   ├── schema.prisma        ← Full database schema
│   └── seed.js              ← Sample data seeder
├── src/
│   ├── index.js             ← Server entry point
│   ├── app.js               ← Express app + middleware
│   ├── config/
│   │   └── prisma.js        ← Prisma client singleton
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── order.controller.js   ← Dispatch engine here
│   │   ├── driver.controller.js
│   │   └── payment.controller.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── order.routes.js
│   │   ├── driver.routes.js
│   │   ├── restaurant.routes.js
│   │   ├── menu.routes.js
│   │   ├── payment.routes.js
│   │   ├── partner.routes.js
│   │   ├── admin.routes.js
│   │   ├── coupon.routes.js
│   │   ├── notification.routes.js
│   │   ├── upload.routes.js
│   │   └── config.routes.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── authorize.middleware.js
│   │   ├── validate.middleware.js
│   │   └── error.middleware.js
│   ├── services/
│   │   ├── socket.service.js    ← Real-time tracking + chat
│   │   ├── push.service.js      ← Firebase push notifications
│   │   ├── sms.service.js       ← Sparrow SMS Nepal
│   │   └── cron.service.js      ← Scheduled jobs
│   └── utils/
│       ├── appError.js
│       ├── asyncHandler.js
│       ├── geo.js               ← Haversine distance
│       └── logger.js
├── uploads/                 ← Local image uploads
├── logs/                    ← Winston log files
├── .env.example
└── package.json
```

---

## 🗄️ Database Tables

| Table | Purpose |
|-------|---------|
| users | All users (customer/driver/owner/admin) |
| customers | Customer wallets, coins, addresses |
| drivers | Driver profiles, location, rating |
| restaurants | Restaurant listings |
| menu_categories | Menu sections |
| menu_items | Individual dishes |
| orders | Order lifecycle |
| order_items | Items per order |
| order_status_history | Full audit trail |
| payments | eSewa/Khalti/Wallet records |
| chat_messages | Driver ↔ Customer chat |
| driver_trips | Completed delivery records |
| driver_earnings | Earnings per trip |
| driver_incentives | Bonus payouts |
| partners | Franchise partners |
| coupons | Promo codes |
| surge_zones | Active surge areas |
| notifications | Push notification log |
| app_config | Runtime config per app |
| otp_codes | Phone verification OTPs |
| wallet_transactions | Wallet credit/debit log |
| favourites | Customer saved restaurants |

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/auth/send-otp` | Send phone OTP |
| POST | `/api/v1/auth/verify-otp` | Verify OTP |
| POST | `/api/v1/auth/refresh-token` | Refresh JWT |
| POST | `/api/v1/auth/logout` | Logout |
| POST | `/api/v1/auth/reset-password` | Reset password |
| GET | `/api/v1/auth/me` | Get current user |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/orders` | Place order (triggers dispatch) |
| GET | `/api/v1/orders` | List orders |
| GET | `/api/v1/orders/active` | Customer's active order |
| GET | `/api/v1/orders/:id` | Get order details |
| PATCH | `/api/v1/orders/:id/status` | Update status |
| POST | `/api/v1/orders/:id/cancel` | Cancel order |
| POST | `/api/v1/orders/:id/rate` | Rate order + driver |
| GET | `/api/v1/orders/:id/track` | Get driver location |
| GET | `/api/v1/orders/:id/chat` | Get chat messages |
| POST | `/api/v1/orders/:id/chat` | Send chat message |

### Drivers
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/drivers/apply` | Apply as driver |
| GET | `/api/v1/drivers/me` | My driver profile |
| GET | `/api/v1/drivers/me/earnings` | Earnings summary |
| GET | `/api/v1/drivers/me/trips` | Trip history |
| GET | `/api/v1/drivers/me/incentives` | Active bonuses |
| GET | `/api/v1/drivers/surge-zones` | Surge zone map |
| PATCH | `/api/v1/drivers/:id/approve` | Approve driver (admin) |

### Restaurants & Menu
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/restaurants` | List restaurants (with distance) |
| GET | `/api/v1/restaurants/:id` | Restaurant + full menu |
| POST | `/api/v1/restaurants` | Create restaurant |
| PATCH | `/api/v1/restaurants/:id` | Update restaurant |
| POST | `/api/v1/restaurants/:id/favourite` | Toggle favourite |
| GET | `/api/v1/restaurants/my/favourites` | My favourites |
| POST | `/api/v1/menu/items` | Add menu item |
| PATCH | `/api/v1/menu/items/:id` | Update/toggle item |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/payments/esewa/initiate` | Start eSewa payment |
| POST | `/api/v1/payments/esewa/verify` | Verify eSewa |
| POST | `/api/v1/payments/khalti/initiate` | Start Khalti payment |
| POST | `/api/v1/payments/khalti/verify` | Verify Khalti |
| POST | `/api/v1/payments/wallet/topup` | Top up wallet |
| GET | `/api/v1/payments/wallet/balance` | Wallet balance |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/dashboard` | KPIs + weekly revenue |
| GET | `/api/v1/admin/orders` | All orders |
| GET | `/api/v1/admin/config/:app` | Get app config |
| PATCH | `/api/v1/admin/config/:app` | Update app config |
| GET | `/api/v1/admin/surge-zones` | Surge zones |
| PATCH | `/api/v1/admin/surge-zones/:id` | Update surge zone |

---

## ⚡ Real-time Events (Socket.IO)

Connect: `io("http://localhost:5000", { auth: { token: "Bearer JWT_TOKEN" } })`

### Customer emits:
- `track_order` `{ orderId }` — join order tracking room

### Customer receives:
- `order_status_changed` `{ orderId, status }` — order update
- `driver_assigned` `{ orderId, driver }` — driver found
- `driver_location` `{ lat, lng }` — live driver position (every 10s)
- `chat_message` `{ message, from }` — new chat message

### Driver emits:
- `driver_online` — go online
- `driver_offline` — go offline
- `location_update` `{ lat, lng, orderId }` — GPS update
- `accept_job` `{ orderId }` — accept delivery
- `reject_job` `{ orderId }` — skip delivery

### Driver receives:
- `job_offer` `{ orderId, restaurant, earn, distKm, timeoutSec }` — new job
- `job_taken` — order already assigned

---

## 💳 Payment Setup

### eSewa (Nepal)
1. Register at https://merchant.esewa.com.np
2. Get your `ESEWA_MERCHANT_ID` and `ESEWA_SECRET_KEY`
3. Update `.env`

### Khalti (Nepal)
1. Register at https://khalti.com/merchant
2. Get your `KHALTI_SECRET_KEY` and `KHALTI_PUBLIC_KEY`
3. Update `.env`

---

## 📱 Push Notifications (Firebase)
1. Create project at https://console.firebase.google.com
2. Go to Project Settings → Service Accounts → Generate New Private Key
3. Copy `project_id`, `private_key`, `client_email` to `.env`

---

## 🚀 Production Deployment (DigitalOcean)

```bash
# On your DigitalOcean droplet (Ubuntu 22.04)
# 1. Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Install PostgreSQL
sudo apt install postgresql postgresql-contrib
sudo -u postgres createdb toofan_db

# 3. Clone and setup
git clone your-repo
cd toofan-backend
npm install --production
cp .env.example .env
# Edit .env with production values

# 4. Run migrations + seed
npm run db:migrate
npm run db:seed

# 5. Use PM2 to keep server alive
npm install -g pm2
pm2 start src/index.js --name toofan-api
pm2 startup
pm2 save

# 6. Nginx reverse proxy (optional)
# Proxy port 5000 to port 80/443
```

---

## 📞 Support
Bodh Software Company — contact@bodhsoftware.com.np
