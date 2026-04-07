//
// TooFan API Service — all backend calls in one place
// Base URL: http://localhost:5000/api/v1  (proxied via Vite)
//

const BASE = "/api/v1";

// ── Token helpers ──────────────────────────────────────────────
let _token        = localStorage.getItem("tf_token")         || null;
let _refreshToken = localStorage.getItem("tf_refresh_token") || null;
let _user         = JSON.parse(localStorage.getItem("tf_user") || "null");

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

// ── Core fetch wrapper ─────────────────────────────────────────
async function req(method, path, body, params) {
  const url = new URL(BASE + path, window.location.origin);
  if (params) Object.entries(params).forEach(([k, v]) => v != null && url.searchParams.set(k, v));

  // Abort after 15 s to prevent the UI from freezing indefinitely
  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url.toString(), {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(_token ? { Authorization: "Bearer " + _token } : {}),
      },
      body:   body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const data = await res.json().catch(() => ({}));

    if (res.status === 401 && _refreshToken) {
      // Try refresh once
      const r = await fetch(BASE + "/auth/refresh-token", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ refreshToken: _refreshToken }),
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

    if (!res.ok) throw new Error(data.message || "HTTP " + res.status);
    return data.data ?? data;
  } catch (err) {
    if (err.name === "AbortError") throw new Error("Request timed out. Please try again.");
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

const get   = (path, params) => req("GET",   path, null, params);
const post  = (path, body)   => req("POST",  path, body);
const patch = (path, body)   => req("PATCH", path, body);

// ── AUTH ───────────────────────────────────────────────────────
export const Auth = {
  login:        (phone, password)                    => post("/auth/login",          { phone, password }),
  register:     (name, phone, email, password, role) => post("/auth/register",       { name, phone, email, password, role }),
  me:           ()                                   => get("/auth/me"),
  logout:       ()                                   => post("/auth/logout"),

  /**
   * Send an OTP to a phone number or email address.
   * @param {string} identifier - Nepali phone (98XXXXXXXX) or email
   * @param {string} purpose    - "verify_phone" | "reset_password" | "login"
   */
  sendOtp:    (identifier, purpose = "verify_phone") =>
    post("/auth/send-otp",   { identifier, purpose }),

  /**
   * Verify an OTP that was sent to a phone number or email address.
   * @param {string} identifier - same value passed to sendOtp
   * @param {string} code       - the 6-digit OTP
   * @param {string} purpose    - must match the purpose used in sendOtp
   */
  verifyOtp:  (identifier, code, purpose)            =>
    post("/auth/verify-otp", { identifier, code, purpose }),

  refreshToken: (refreshToken)                       =>
    post("/auth/refresh-token",  { refreshToken }),
  resetPassword:(identifier, otp, newPassword)       =>
    post("/auth/reset-password", { identifier, otp, newPassword }),
};

// ── RESTAURANTS ────────────────────────────────────────────────
export const Restaurants = {
  list:      (params = {}) => get("/restaurants", params),
  get:       (id)          => get("/restaurants/" + id),
  create:    (data)        => post("/restaurants", data),
  update:    (id, data)    => patch("/restaurants/" + id, data),
  toggleFav: (id)          => post("/restaurants/" + id + "/favourite"),
  myFavs:    ()            => get("/restaurants/my/favourites"),
};

// ── MENU ───────────────────────────────────────────────────────
export const Menu = {
  addItem:    (data)      => post("/menu/items", data),
  updateItem: (id, data)  => patch("/menu/items/" + id, data),
};

// ── ORDERS ─────────────────────────────────────────────────────
export const Orders = {
  place:    (data)   => post("/orders", data),
  list:     (params) => get("/orders", params),
  active:   ()       => get("/orders/active"),
  get:      (id)     => get("/orders/" + id),
  status:   (id, s)  => patch("/orders/" + id + "/status", { status: s }),
  cancel:   (id)     => post("/orders/" + id + "/cancel"),
  rate:     (id, d)  => post("/orders/" + id + "/rate", d),
  track:    (id)     => get("/orders/" + id + "/track"),
  chat:     (id)     => get("/orders/" + id + "/chat"),
  sendChat: (id, m)  => post("/orders/" + id + "/chat", { message: m }),
};

// ── DRIVERS ────────────────────────────────────────────────────
export const Drivers = {
  apply:    (data) => post("/drivers/apply", data),
  me:       ()     => get("/drivers/me"),
  earnings: ()     => get("/drivers/me/earnings"),
  trips:    ()     => get("/drivers/me/trips"),
  surge:    ()     => get("/drivers/surge-zones"),
  approve:  (id)   => patch("/drivers/" + id + "/approve"),
};

// ── PAYMENTS ───────────────────────────────────────────────────
export const Payments = {
  esewaInit:   (d) => post("/payments/esewa/initiate", d),
  esewaVerify: (d) => post("/payments/esewa/verify",   d),
  khaltiInit:  (d) => post("/payments/khalti/initiate",d),
  khaltiVerify:(d) => post("/payments/khalti/verify",  d),
  walletTopup: (d) => post("/payments/wallet/topup",   d),
  balance:     ()  => get("/payments/wallet/balance"),
};

// ── COUPONS ────────────────────────────────────────────────────
export const Coupons = {
  apply: (code, orderId) => post("/coupons/apply", { code, orderId }),
};

// ── NOTIFICATIONS ──────────────────────────────────────────────
export const Notifications = {
  list: () => get("/notifications"),
};

// ── ADMIN ──────────────────────────────────────────────────────
export const Admin = {
  dashboard:  ()            => get("/admin/dashboard"),
  orders:     (p)           => get("/admin/orders", p),
  getConfig:  (app)         => get("/admin/config/" + app),
  setConfig:  (app, data)   => patch("/admin/config/" + app, data),
  surgeZones: ()            => get("/admin/surge-zones"),
  setSurge:   (id, data)    => patch("/admin/surge-zones/" + id, data),
};

// ── PARTNERS ───────────────────────────────────────────────────
export const Partners = {
  list:   ()     => get("/partners"),
  get:    (id)   => get("/partners/" + id),
  create: (data) => post("/partners", data),
};

// ── CONFIG ─────────────────────────────────────────────────────
export const Config = {
  get: (app) => get("/config/" + app),
};
