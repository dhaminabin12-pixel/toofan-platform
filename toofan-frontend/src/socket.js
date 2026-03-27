// ─────────────────────────────────────────────────────────────
//  TooFan Socket.IO Service
//  Connects to localhost:5000 via Vite proxy (/socket.io)
// ─────────────────────────────────────────────────────────────

import { io } from "socket.io-client";
import { getToken } from "./api.js";

let socket = null;

// ── Connect ───────────────────────────────────────────────────
export function connectSocket() {
  if (socket?.connected) return socket;

  socket = io("/", {
    path: "/socket.io",
    auth: { token: `Bearer ${getToken()}` },
    transports: ["websocket", "polling"],
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  socket.on("connect", () => console.log("[socket] connected", socket.id));
  socket.on("disconnect", (reason) => console.log("[socket] disconnected", reason));
  socket.on("connect_error", (err) => console.warn("[socket] error", err.message));

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket() {
  return socket;
}

// ── Driver helpers ────────────────────────────────────────────
export function driverGoOnline() {
  socket?.emit("driver_online");
}

export function driverGoOffline() {
  socket?.emit("driver_offline");
}

/** Call periodically (every ~10 s) while driver is online */
export function driverLocationUpdate(lat, lng, orderId = null) {
  socket?.emit("location_update", { lat, lng, ...(orderId ? { orderId } : {}) });
}

export function driverAcceptJob(orderId) {
  socket?.emit("accept_job", { orderId });
}

export function driverRejectJob(orderId) {
  socket?.emit("reject_job", { orderId });
}

/** Register a handler for incoming job offers */
export function onJobOffer(cb) {
  socket?.on("job_offer", cb);
  return () => socket?.off("job_offer", cb);
}

export function onJobTaken(cb) {
  socket?.on("job_taken", cb);
  return () => socket?.off("job_taken", cb);
}

// ── Customer helpers ──────────────────────────────────────────
export function customerTrackOrder(orderId) {
  socket?.emit("track_order", { orderId });
}

export function onOrderStatusChanged(cb) {
  socket?.on("order_status_changed", cb);
  return () => socket?.off("order_status_changed", cb);
}

export function onDriverAssigned(cb) {
  socket?.on("driver_assigned", cb);
  return () => socket?.off("driver_assigned", cb);
}

export function onDriverLocation(cb) {
  socket?.on("driver_location", cb);
  return () => socket?.off("driver_location", cb);
}

export function onChatMessage(cb) {
  socket?.on("chat_message", cb);
  return () => socket?.off("chat_message", cb);
}
