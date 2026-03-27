// ─────────────────────────────────────────────────────────────
//  TooFan API Service  —  all backend calls in one place
//  Base URL: http://localhost:5000/api/v1  (proxied via Vite)
// ─────────────────────────────────────────────────────────────

const BASE = "/api/v1";

// ── Token helpers ─────────────────────────────────────────────
let _token       = localStorage.getItem("tf_token")        || null;
let _refreshToken = localStorage.getItem("tf_refresh_token") || null;
let _user        = JSON.parse(localStorage.getItem("tf_user") || "null");

export const setAuth = ({ token, refreshToken, user }) => {
  _token        = token;
  _refreshToken = refreshToken;
  _user         = user;
  localStorage.setItem("tf_token",         token);
  localStorage.setItem("tf_refresh_token", refreshToken || "");
  localStorage.setItem("tf_user",          JSON.stringify(user));
};

export const clearAuth = () => {
  _token = _refreshToken = _user = null;
  localStorage.removeItem("tf_token");
  localStorage.removeItem("tf_refresh_token");
  localStorage.removeItem("tf_user");
};

export const getToken    = () => _token;
export const getUser     = () => _user;
export const isLoggedIn  = () => !!_token;

// ── Core fetch wrapper ────────────────────────────────────────
async function req(method, path, body, params) {
  const url = new URL(BASE + path, window.location.origin);
  if (params) Object.entries(params).forEach(([k, v]) => v != null && url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(_token ? { Authorization: `Bearer ${_token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (res.status === 401 && _refreshToken) {
    // Try refresh once
    const r = await fetch(`${BASE}/auth/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: _refreshToken }),
    });
    if (r.ok) {
      const d = await r.json();
      setAuth({ token: d.data.token, refreshToken: d.data.refreshToken, user: _user });
      // Retry original
      return req(method, path, body, params);
    } else {
      clearAuth();
      window.location.reload();
    }
  }

  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data.data ?? data;
}

const get    = (path, params) => req("GET",    path, null, params);
const post   = (path, body)   => req("POST",   path, body);
const patch  = (path, body)   => req("PATCH",  path, body);

// ── AUTH ──────────────────────────────────────────────────────
export const Auth = {
  login:        (phone, password)              => post("/auth/login",         { phone, password }),
  register:     (name, phone, email, password, role) =>
                post("/auth/register", { name, phone, email, password, role }),
  me:           ()                             => get("/auth/me"),
  logout:       ()                             => post("/auth/logout"),
  sendOtp:      (phone)                        => post("/auth/send-otp",      { phone }),
  verifyOtp:    (phone, code, purpose)         => post("/auth/verify-otp",    { phone, code, purpose }),
  refreshToken: (refreshToken)                 => post("/auth/refresh-token", { refreshToken }),
  resetPassword:(phone, otp, newPassword)      => post("/auth/reset-password",{ phone, otp, newPassword }),
};

// ── RESTAURANTS ───────────────────────────────────────────────
export const Restaurants = {
  list:      (params = {})  => get("/restaurants", params),
  get:       (id)           => get(`/restaurants/${id}`),
  create:    (data)         => post("/restaurants", data),
  update:    (id, data)     => patch(`/restaurants/${id}`, data),
  toggleFav: (id)           => post(`/restaurants/${id}/favourite`),
  myFavs:    ()             => get("/restaurants/my/favourites"),
};

// ── MENU ──────────────────────────────────────────────────────
export const Menu = {
  addItem:    (data)        => post("/menu/items", data),
  updateItem: (id, data)    => patch(`/menu/items/${id}`, data),
};

// ── ORDERS ────────────────────────────────────────────────────
export const Orders = {
  place: ({
    restaurantId, items, paymentMethod, addressId,
    couponCode, scheduledFor, deliveryLat, deliveryLng, specialNote
  }) => post("/orders", {
    restaurantId, items, paymentMethod,
    ...(addressId    && { addressId }),
    ...(couponCode   && { couponCode }),
    ...(scheduledFor && { scheduledFor }),
    ...(deliveryLat  && { deliveryLat }),
    ...(deliveryLng  && { deliveryLng }),
    ...(specialNote  && { specialNote }),
  }),

  list:       (params = {}) => get("/orders",               params),
  active:     ()            => get("/orders/active"),
  get:        (id)          => get(`/orders/${id}`),
  updateStatus:(id, status, note) => patch(`/orders/${id}/status`, { status, note }),
  cancel:     (id, reason)  => post(`/orders/${id}/cancel`, { reason }),
  rate:       (id, data)    => post(`/orders/${id}/rate`,   data),
  chat:       (id)          => get(`/orders/${id}/chat`),
  sendChat:   (id, message) => post(`/orders/${id}/chat`,   { message }),
  track:      (id)          => get(`/orders/${id}/track`),
};

// ── DRIVERS ───────────────────────────────────────────────────
export const Drivers = {
  apply:       (data)       => post("/drivers/apply",        data),
  me:          ()           => get("/drivers/me"),
  earnings:    ()           => get("/drivers/me/earnings"),
  trips:       ()           => get("/drivers/me/trips"),
  incentives:  ()           => get("/drivers/me/incentives"),
  surgeZones:  ()           => get("/drivers/surge-zones"),
  nearby:      ()           => get("/drivers/nearby"),
  // Admin only
  list:        (params={})  => get("/drivers",               params),
  approve:     (id)         => patch(`/drivers/${id}/approve`),
  suspend:     (id)         => patch(`/drivers/${id}/suspend`),
};

// ── PAYMENTS ─────────────────────────────────────────────────
export const Payments = {
  walletBalance:    ()              => get("/payments/wallet/balance"),
  walletTopup:      (amount)        => post("/payments/wallet/topup",      { amount }),
  esewaInitiate:    (orderId, amount) => post("/payments/esewa/initiate",   { orderId, amount }),
  esewaVerify:      (data)          => post("/payments/esewa/verify",       data),
  khaltiInitiate:   (orderId, amount) => post("/payments/khalti/initiate",  { orderId, amount }),
  khaltiVerify:     (data)          => post("/payments/khalti/verify",      data),
};

// ── COUPONS ───────────────────────────────────────────────────
export const Coupons = {
  // Backend: GET /coupons/validate/:code
  validate: (code) => get(`/coupons/validate/${encodeURIComponent(code)}`),
};

// ── NOTIFICATIONS ─────────────────────────────────────────────
export const Notifications = {
  list:   () => get("/notifications"),
  markRead: (id) => patch(`/notifications/${id}/read`),
};

// ── ADMIN ─────────────────────────────────────────────────────
export const Admin = {
  dashboard:    ()                  => get("/admin/dashboard"),
  orders:       (params = {})       => get("/admin/orders",           params),
  drivers:      (params = {})       => get("/admin/drivers",          params),
  partners:     ()                  => get("/admin/partners"),
  analytics:    ()                  => get("/admin/analytics"),
  getConfig:    (app)               => get(`/admin/config/${app}`),
  setConfig:    (app, data)         => patch(`/admin/config/${app}`,   data),
  surgeZones:   ()                  => get("/admin/surge-zones"),
  updateSurge:  (id, data)          => patch(`/admin/surge-zones/${id}`, data),
};

// ── PARTNERS ─────────────────────────────────────────────────
export const Partners = {
  apply:    (data)  => post("/partners/register", data),
  list:     ()      => get("/partners"),
  approve:  (id)    => patch(`/partners/${id}/approve`),
  me:       ()      => get("/partners/me"),
};

// ── CONFIG ────────────────────────────────────────────────────
export const Config = {
  get: (app) => get(`/config/${app}`),
};

// ── Health check ─────────────────────────────────────────────
export const healthCheck = () =>
  fetch("/health").then(r => r.json()).catch(() => ({ status: "error" }));
