// ─────────────────────────────────────────────────────────────
// TooFan Socket.IO Service
// Connects to the backend via the /socket.io proxy.
// Event names and payloads are typed so the driver and customer
// screens can't emit or listen for an event the server doesn't know.
// ─────────────────────────────────────────────────────────────
import io from "socket.io-client";
import type { Socket } from "socket.io-client";
import { getToken } from "./api";
import type { OrderStatus } from "./api";

type Id = string | number;

export interface LatLng { lat: number; lng: number }

export interface JobOffer {
  orderId: Id;
  orderNumber?: string;
  restaurant: { name: string; address?: string } & LatLng;
  deliveryLat?: number;
  deliveryLng?: number;
  total?: number;
  /** Driver's share of the delivery fee (80%) */
  earn: number;
  distKm?: number;
  timeoutSec?: number;
  [key: string]: unknown;
}

export interface OrderStatusChange { orderId: Id; status: OrderStatus }
export interface DriverAssigned {
  orderId: Id;
  driver: { id: Id; name: string; phone?: string; rating?: number; vehicleType?: string; vehicleName?: string };
}
export interface DriverLocation extends LatLng { driverId: Id; timestamp: string }
export interface ChatMessage { orderId: Id; message: string; [key: string]: unknown }

/** Events the server sends to the client. */
export interface ServerToClientEvents {
  job_offer:            (offer: JobOffer) => void;
  job_taken:            (payload: { orderId: Id }) => void;
  order_status_changed: (payload: OrderStatusChange) => void;
  driver_assigned:      (payload: DriverAssigned) => void;
  driver_location:      (payload: DriverLocation) => void;
  chat_message:         (payload: ChatMessage) => void;
}

/** Events the client sends to the server. */
export interface ClientToServerEvents {
  driver_online:   () => void;
  driver_offline:  () => void;
  location_update: (payload: LatLng & { orderId?: Id }) => void;
  accept_job:      (payload: { orderId: Id }) => void;
  reject_job:      (payload: { orderId: Id }) => void;
  track_order:     (payload: { orderId: Id }) => void;
}

export type TooFanSocket = Socket<ServerToClientEvents, ClientToServerEvents>;
type Unsubscribe = () => void;

let socket: TooFanSocket | null = null;

// ── Connect ───────────────────────────────────────────────────
export function connectSocket(): TooFanSocket {
  if (socket?.connected) return socket;

  const s: TooFanSocket = io("/", {
    path: "/socket.io",
    auth: { token: `Bearer ${getToken()}` },
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  s.on("connect", () => console.log("[socket] connected", s.id));
  s.on("disconnect", (reason) => console.log("[socket] disconnected", reason));
  s.on("connect_error", (err) => console.warn("[socket] error", err.message));

  socket = s;
  return s;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket(): TooFanSocket | null {
  return socket;
}

/** Subscribe to a server event; returns a function that unsubscribes. */
function subscribe<E extends keyof ServerToClientEvents>(
  event: E,
  cb: ServerToClientEvents[E],
): Unsubscribe {
  // socket.io's overloads don't narrow well through a generic key, hence the casts.
  (socket?.on as (e: E, l: ServerToClientEvents[E]) => void)?.call(socket, event, cb);
  return () => { (socket?.off as (e: E, l: ServerToClientEvents[E]) => void)?.call(socket, event, cb); };
}

// ── Driver helpers ────────────────────────────────────────────
export function driverGoOnline(): void  { socket?.emit("driver_online"); }
export function driverGoOffline(): void { socket?.emit("driver_offline"); }

/** Call periodically (every ~10 s) while driver is online */
export function driverLocationUpdate(lat: number, lng: number, orderId: Id | null = null): void {
  socket?.emit("location_update", { lat, lng, ...(orderId ? { orderId } : {}) });
}

export function driverAcceptJob(orderId: Id): void { socket?.emit("accept_job", { orderId }); }
export function driverRejectJob(orderId: Id): void { socket?.emit("reject_job", { orderId }); }

/** Register a handler for incoming job offers */
export const onJobOffer = (cb: ServerToClientEvents["job_offer"]) => subscribe("job_offer", cb);
export const onJobTaken = (cb: ServerToClientEvents["job_taken"]) => subscribe("job_taken", cb);

// ── Customer helpers ──────────────────────────────────────────
export function customerTrackOrder(orderId: Id): void { socket?.emit("track_order", { orderId }); }

export const onOrderStatusChanged = (cb: ServerToClientEvents["order_status_changed"]) => subscribe("order_status_changed", cb);
export const onDriverAssigned     = (cb: ServerToClientEvents["driver_assigned"])      => subscribe("driver_assigned", cb);
export const onDriverLocation     = (cb: ServerToClientEvents["driver_location"])      => subscribe("driver_location", cb);
export const onChatMessage        = (cb: ServerToClientEvents["chat_message"])         => subscribe("chat_message", cb);
