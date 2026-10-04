//
// TooFan API Service — all backend calls in one place
// Base URL: http://localhost:5000/api/v1  (proxied via Vite)
//

const BASE = "/api/v1";

// ── Types ──────────────────────────────────────────────────────
/** Mirrors `enum UserRole` in toofan-backend/prisma/schema.prisma */
export type Role = "CUSTOMER" | "DRIVER" | "RESTAURANT_OWNER" | "PARTNER_ADMIN" | "SUPER_ADMIN";

export interface User {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  role: Role;
  [key: string]: unknown;
}

export interface AuthPayload {
  token: string;
  refreshToken?: string | null;
  user: User | null;
}

export type OtpPurpose = "verify_phone" | "reset_password" | "login";
export type HttpMethod = "GET" | "POST" | "PATCH";
export type QueryParams = Record<string, string | number | boolean | null | undefined>;
export type Body = Record<string, unknown>;
export type Id = string | number;

/** Backend envelope: `{ success, message, data }`. `req` unwraps `data`. */
interface ApiEnvelope<T> {
  success?: boolean;
  message?: string;
  data?: T;
}

// ── Token helpers ──────────────────────────────────────────────
let _token: string | null        = localStorage.getItem("tf_token")         || null;
let _refreshToken: string | null = localStorage.getItem("tf_refresh_token") || null;
let _user: User | null           = JSON.parse(localStorage.getItem("tf_user") || "null");

export const setAuth = ({ token, refreshToken, user }: AuthPayload): void => {
  _token        = token;
  _refreshToken = refreshToken ?? null;
  _user         = user;
  localStorage.setItem("tf_token",         token);
  localStorage.setItem("tf_refresh_token", refreshToken || "");
  localStorage.setItem("tf_user",          JSON.stringify(user));
};

export const clearAuth = (): void => {
  _token = _refreshToken = _user = null;
  localStorage.removeItem("tf_token");
  localStorage.removeItem("tf_refresh_token");
  localStorage.removeItem("tf_user");
};

export const getToken    = (): string | null => _token;
export const getUser     = (): User | null   => _user;
export const isLoggedIn  = (): boolean       => !!_token;

// ── Core fetch wrapper ─────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function req<T = any>(method: HttpMethod, path: string, body?: Body | null, params?: QueryParams): Promise<T> {
  const url = new URL(BASE + path, window.location.origin);
  if (params) Object.entries(params).forEach(([k, v]) => { if (v != null) url.searchParams.set(k, String(v)); });

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

    const data: ApiEnvelope<T> = await res.json().catch(() => ({}));

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
        return req<T>(method, path, body, params);
      } else {
        clearAuth();
        window.location.reload();
      }
    }

    if (!res.ok) throw new Error(data.message || "HTTP " + res.status);
    return (data.data ?? data) as T;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") throw new Error("Request timed out. Please try again.");
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

const get   = (path: string, params?: QueryParams) => req("GET",   path, null, params);
const post  = (path: string, body?: Body)          => req("POST",  path, body);
const patch = (path: string, body?: Body)          => req("PATCH", path, body);

// ── AUTH ───────────────────────────────────────────────────────
export const Auth = {
  login:        (phone: string, password: string) => post("/auth/login", { phone, password }),
  register:     (name: string, phone: string, email: string, password: string, role: Role) =>
    post("/auth/register", { name, phone, email, password, role }),
  me:           () => get("/auth/me"),
  logout:       () => post("/auth/logout"),

  /** Send an OTP to a Nepali phone number (98XXXXXXXX) or an email address. */
  sendOtp:    (identifier: string, purpose: OtpPurpose = "verify_phone") =>
    post("/auth/send-otp", { identifier, purpose }),

  /** Verify an OTP. `identifier` and `purpose` must match the `sendOtp` call. */
  verifyOtp:  (identifier: string, code: string, purpose: OtpPurpose) =>
    post("/auth/verify-otp", { identifier, code, purpose }),

  refreshToken: (refreshToken: string) => post("/auth/refresh-token", { refreshToken }),
  resetPassword:(identifier: string, otp: string, newPassword: string) =>
    post("/auth/reset-password", { identifier, otp, newPassword }),
};

// ── RESTAURANTS ────────────────────────────────────────────────
export const Restaurants = {
  list:      (params: QueryParams = {}) => get("/restaurants", params),
  get:       (id: Id)                   => get("/restaurants/" + id),
  create:    (data: Body)               => post("/restaurants", data),
  update:    (id: Id, data: Body)       => patch("/restaurants/" + id, data),
  toggleFav: (id: Id)                   => post("/restaurants/" + id + "/favourite"),
  myFavs:    ()                         => get("/restaurants/my/favourites"),
};

// ── MENU ───────────────────────────────────────────────────────
export const Menu = {
  addItem:    (data: Body)          => post("/menu/items", data),
  updateItem: (id: Id, data: Body)  => patch("/menu/items/" + id, data),
};

// ── ORDERS ─────────────────────────────────────────────────────
/** Mirrors `enum OrderStatus` in toofan-backend/prisma/schema.prisma */
export type OrderStatus =
  | "PENDING" | "CONFIRMED" | "PREPARING" | "READY_FOR_PICKUP" | "PICKED_UP"
  | "ON_THE_WAY" | "DELIVERED" | "CANCELLED" | "REFUNDED";

export const Orders = {
  place:    (data: Body)               => post("/orders", data),
  list:     (params?: QueryParams)     => get("/orders", params),
  active:   ()                         => get("/orders/active"),
  get:      (id: Id)                   => get("/orders/" + id),
  status:   (id: Id, s: OrderStatus)   => patch("/orders/" + id + "/status", { status: s }),
  cancel:   (id: Id)                   => post("/orders/" + id + "/cancel"),
  rate:     (id: Id, d: Body)          => post("/orders/" + id + "/rate", d),
  track:    (id: Id)                   => get("/orders/" + id + "/track"),
  chat:     (id: Id)                   => get("/orders/" + id + "/chat"),
  sendChat: (id: Id, m: string)        => post("/orders/" + id + "/chat", { message: m }),
};

// ── DRIVERS ────────────────────────────────────────────────────
export const Drivers = {
  apply:    (data: Body) => post("/drivers/apply", data),
  me:       ()           => get("/drivers/me"),
  earnings: ()           => get("/drivers/me/earnings"),
  trips:    ()           => get("/drivers/me/trips"),
  surge:    ()           => get("/drivers/surge-zones"),
  approve:  (id: Id)     => patch("/drivers/" + id + "/approve"),
};

// ── PAYMENTS ───────────────────────────────────────────────────
export const Payments = {
  esewaInit:   (d: Body) => post("/payments/esewa/initiate", d),
  esewaVerify: (d: Body) => post("/payments/esewa/verify",   d),
  khaltiInit:  (d: Body) => post("/payments/khalti/initiate",d),
  khaltiVerify:(d: Body) => post("/payments/khalti/verify",  d),
  walletTopup: (d: Body) => post("/payments/wallet/topup",   d),
  balance:     ()        => get("/payments/wallet/balance"),
};

// ── COUPONS ────────────────────────────────────────────────────
export const Coupons = {
  apply: (code: string, orderId: Id) => post("/coupons/apply", { code, orderId }),
};

// ── NOTIFICATIONS ──────────────────────────────────────────────
export const Notifications = {
  list: () => get("/notifications"),
};

// ── ADMIN ──────────────────────────────────────────────────────
export const Admin = {
  dashboard:  ()                     => get("/admin/dashboard"),
  orders:     (p?: QueryParams)      => get("/admin/orders", p),
  getConfig:  (app: string)          => get("/admin/config/" + app),
  setConfig:  (app: string, data: Body) => patch("/admin/config/" + app, data),
  surgeZones: ()                     => get("/admin/surge-zones"),
  setSurge:   (id: Id, data: Body)   => patch("/admin/surge-zones/" + id, data),
};

// ── PARTNERS ───────────────────────────────────────────────────
export const Partners = {
  list:   ()           => get("/partners"),
  get:    (id: Id)     => get("/partners/" + id),
  create: (data: Body) => post("/partners", data),
};

// ── CONFIG ─────────────────────────────────────────────────────
export const Config = {
  get: (app: string) => get("/config/" + app),
};
