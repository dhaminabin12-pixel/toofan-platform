import { useState, useRef, useEffect } from "react";

// ═══════════════════════════════════════════════════════
//  TOOFAN  DEV PORTAL  ·  Private Control Center
//  Everything Nabin needs to manage, configure, and
//  deploy changes across all TooFan apps from one place.
// ═══════════════════════════════════════════════════════

// ── MOCK STATE ─────────────────────────────────────────
const INITIAL_CONFIG = {
  khana: {
    appName: "TooFan Khana",
    primaryColor: "#E63946",
    secondaryColor: "#FF6B35",
    deliveryFee: 50,
    platformFee: 20,
    maxDeliveryRadius: 10,
    minOrderAmount: 100,
    active: true,
    maintenanceMode: false,
    welcomeMessage: "Namaste! Ke khana mann lagyo?",
    supportPhone: "9800000001",
  },
  driver: {
    appName: "TooFan Driver",
    perKmRate: 15,
    perDeliveryBonus: 10,
    maxActiveOrders: 2,
    autoAssign: true,
    active: true,
    maintenanceMode: false,
    supportPhone: "9800000002",
    onlineRadiusKm: 5,
  },
  business: {
    appName: "TooFan Business",
    commissionPct: 0,
    trialDays: 14,
    starterPrice: 999,
    growthPrice: 2499,
    active: true,
    maintenanceMode: false,
    supportEmail: "biz@toofan.com",
    autoApprovePartners: false,
  },
};

const INITIAL_RESTAURANTS = [
  { id:1, name:"Momo House",      cuisine:"Nepali",     rating:4.8, time:"20-30", img:"🥟", active:true,  city:"Kathmandu", joined:"Jan 2025" },
  { id:2, name:"Dal Bhat Palace", cuisine:"Traditional",rating:4.6, time:"25-35", img:"🍛", active:true,  city:"Lalitpur",  joined:"Feb 2025" },
  { id:3, name:"Tandoor Express", cuisine:"Indian",     rating:4.5, time:"30-40", img:"🍗", active:false, city:"Kathmandu", joined:"Mar 2025" },
  { id:4, name:"Chiya & Snacks",  cuisine:"Cafe",       rating:4.9, time:"10-15", img:"☕", active:true,  city:"Bhaktapur", joined:"Mar 2025" },
  { id:5, name:"Pizza Adda",      cuisine:"Fast Food",  rating:4.3, time:"25-35", img:"🍕", active:true,  city:"Pokhara",   joined:"Apr 2025" },
  { id:6, name:"Biryani Hub",     cuisine:"Mughlai",    rating:4.7, time:"35-45", img:"🍚", active:true,  city:"Kathmandu", joined:"Apr 2025" },
];

const INITIAL_DRIVERS = [
  { id:"D01", name:"Bikash Tamang",  phone:"9801234567", city:"Lalitpur",   status:"Active",  trips:124, rating:4.9, approved:true  },
  { id:"D02", name:"Sanjay KC",      phone:"9807654321", city:"Kathmandu",  status:"Active",  trips:89,  rating:4.7, approved:true  },
  { id:"D03", name:"Ritu Shrestha",  phone:"9812345678", city:"Bhaktapur",  status:"Offline", trips:56,  rating:4.5, approved:true  },
  { id:"D04", name:"Naresh Maharjan",phone:"9845678901", city:"Patan",      status:"Active",  trips:201, rating:4.8, approved:true  },
  { id:"D05", name:"Anil Tamang",    phone:"9866543210", city:"Kathmandu",  status:"Pending", trips:0,   rating:0,   approved:false },
];

const INITIAL_PARTNERS = [
  { id:"P01", name:"Sharma Food Chain",  type:"Franchise", plan:"Growth",     city:"Kathmandu", outlets:4, status:"Active",  joined:"Jan 2025" },
  { id:"P02", name:"SpeedRide Logistics",type:"Fleet",     plan:"Enterprise", city:"Lalitpur",  outlets:1, status:"Active",  joined:"Feb 2025" },
  { id:"P03", name:"MomoKing Franchise", type:"Franchise", plan:"Growth",     city:"Pokhara",   outlets:3, status:"Active",  joined:"Mar 2025" },
  { id:"P04", name:"QuickEats Pvt Ltd",  type:"Restaurant",plan:"Starter",    city:"Bhaktapur", outlets:1, status:"Pending", joined:"Apr 2025" },
];

const API_ENDPOINTS = [
  { method:"GET",  path:"/v1/orders",            desc:"List all orders",                  app:"khana"    },
  { method:"POST", path:"/v1/orders",            desc:"Create a new order",               app:"khana"    },
  { method:"GET",  path:"/v1/restaurants",       desc:"List all restaurants",             app:"khana"    },
  { method:"POST", path:"/v1/restaurants",       desc:"Register a restaurant",            app:"khana"    },
  { method:"GET",  path:"/v1/drivers",           desc:"List all drivers",                 app:"driver"   },
  { method:"PATCH",path:"/v1/drivers/:id/status",desc:"Update driver online/offline",     app:"driver"   },
  { method:"POST", path:"/v1/assignments",       desc:"Assign order to driver",           app:"driver"   },
  { method:"GET",  path:"/v1/partners",          desc:"List all business partners",       app:"business" },
  { method:"POST", path:"/v1/partners",          desc:"Onboard a new partner",            app:"business" },
  { method:"GET",  path:"/v1/analytics/revenue", desc:"Revenue analytics",                app:"admin"    },
  { method:"POST", path:"/v1/webhooks",          desc:"Register a webhook endpoint",      app:"all"      },
  { method:"GET",  path:"/v1/config/:app",       desc:"Get app configuration",            app:"all"      },
  { method:"PATCH",path:"/v1/config/:app",       desc:"Update app configuration",         app:"all"      },
];

const WEBHOOK_EVENTS = [
  "order.created","order.status_changed","order.delivered","order.cancelled",
  "driver.assigned","driver.went_online","driver.went_offline",
  "partner.registered","partner.approved","payment.completed",
];

const DEPLOY_LOG = [
  { time:"2025-04-08 14:32", app:"TooFan Khana",    action:"Config update · deliveryFee 40→50",  by:"Nabin", status:"success" },
  { time:"2025-04-08 11:10", app:"TooFan Driver",   action:"Toggle autoAssign ON",                by:"Nabin", status:"success" },
  { time:"2025-04-07 18:55", app:"Business Portal", action:"starterPrice 799→999",                by:"Nabin", status:"success" },
  { time:"2025-04-07 09:20", app:"TooFan Khana",    action:"Maintenance mode OFF",                by:"Nabin", status:"success" },
  { time:"2025-04-06 16:44", app:"TooFan Driver",   action:"perKmRate 12→15",                     by:"Nabin", status:"success" },
  { time:"2025-04-05 12:00", app:"All Apps",        action:"API key rotated",                     by:"Nabin", status:"warning" },
];

// ── STYLES ─────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&family=Manrope:wght@300;400;500;600;700;800&display=swap');

  *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }

  :root {
    --bg:       #0B0E14;
    --surface:  #111520;
    --surface2: #161B27;
    --border:   rgba(255,255,255,0.07);
    --border2:  rgba(255,255,255,0.12);
    --text:     #E8ECF4;
    --muted:    rgba(232,236,244,0.4);
    --muted2:   rgba(232,236,244,0.25);
    --brand:    #E63946;
    --orange:   #FF6B35;
    --green:    #22C55E;
    --blue:     #3B82F6;
    --yellow:   #EAB308;
    --purple:   #A855F7;
    --cyan:     #06B6D4;
    --red:      #EF4444;
  }

  html { scroll-behavior: smooth; }
  body { font-family:'Manrope',sans-serif; background:var(--bg); color:var(--text); overflow-x:hidden; }
  ::-webkit-scrollbar { width:4px; height:4px; }
  ::-webkit-scrollbar-thumb { background:var(--border2); border-radius:2px; }
  * { scrollbar-width:thin; scrollbar-color: var(--border2) transparent; }

  /* ── SHELL LAYOUT ── */
  .shell { display:flex; height:100vh; overflow:hidden; }

  /* ── SIDEBAR ── */
  .sidebar {
    width:220px; flex-shrink:0;
    background:var(--surface);
    border-right:1px solid var(--border);
    display:flex; flex-direction:column;
    overflow-y:auto; overflow-x:hidden;
  }
  .sidebar-logo {
    padding:20px 18px 16px;
    border-bottom:1px solid var(--border);
  }
  .logo-mark {
    font-family:'JetBrains Mono',monospace;
    font-size:0.7rem; font-weight:700;
    color:var(--muted); letter-spacing:2px;
    text-transform:uppercase; margin-bottom:6px;
  }
  .logo-name {
    font-family:'Manrope',sans-serif;
    font-size:1.1rem; font-weight:800;
    color:var(--text); letter-spacing:-0.5px;
  }
  .logo-name span { color:var(--brand); }
  .logo-badge {
    display:inline-block; margin-top:4px;
    background:rgba(230,57,70,0.12); color:var(--brand);
    font-family:'JetBrains Mono',monospace;
    font-size:0.55rem; font-weight:700; letter-spacing:1px;
    padding:2px 6px; border-radius:4px; border:1px solid rgba(230,57,70,0.2);
  }

  .sidebar-section {
    padding:16px 10px 4px;
    font-family:'JetBrains Mono',monospace;
    font-size:0.55rem; font-weight:700; letter-spacing:2px;
    color:var(--muted2); text-transform:uppercase;
  }
  .nav-item {
    display:flex; align-items:center; gap:9px;
    padding:8px 12px; margin:1px 6px;
    border-radius:8px; cursor:pointer;
    font-size:0.8rem; font-weight:500; color:var(--muted);
    border:none; background:none; width:calc(100% - 12px);
    text-align:left; transition:all 0.15s;
  }
  .nav-item:hover { background:var(--surface2); color:var(--text); }
  .nav-item.active { background:rgba(230,57,70,0.1); color:var(--brand); font-weight:600; }
  .nav-item.active .nav-dot { background:var(--brand); box-shadow:0 0 6px var(--brand); }
  .nav-icon { font-size:0.95rem; width:18px; text-align:center; flex-shrink:0; }
  .nav-badge {
    margin-left:auto; background:var(--brand); color:white;
    font-size:0.55rem; font-weight:700; padding:1px 5px;
    border-radius:4px; font-family:'JetBrains Mono',monospace;
  }
  .nav-badge.green { background:var(--green); }
  .nav-badge.yellow { background:var(--yellow); color:var(--bg); }

  .sidebar-footer {
    margin-top:auto; padding:14px 14px 16px;
    border-top:1px solid var(--border);
  }
  .user-pill {
    display:flex; align-items:center; gap:9px;
    background:var(--surface2); border:1px solid var(--border);
    border-radius:10px; padding:8px 10px; cursor:pointer;
  }
  .user-avatar {
    width:28px; height:28px; border-radius:8px;
    background:linear-gradient(135deg,var(--brand),var(--orange));
    display:flex; align-items:center; justify-content:center;
    font-size:0.7rem; font-weight:800; color:white; flex-shrink:0;
  }
  .user-name { font-size:0.78rem; font-weight:700; }
  .user-role { font-size:0.62rem; color:var(--muted); font-family:'JetBrains Mono',monospace; }
  .online-dot { width:7px; height:7px; border-radius:50%; background:var(--green); margin-left:auto; box-shadow:0 0 6px var(--green); }

  /* ── MAIN ── */
  .main { flex:1; overflow-y:auto; display:flex; flex-direction:column; min-width:0; }

  .topbar {
    display:flex; align-items:center; justify-content:space-between;
    padding:14px 24px; border-bottom:1px solid var(--border);
    background:var(--surface); position:sticky; top:0; z-index:50; flex-shrink:0;
  }
  .topbar-left { display:flex; align-items:center; gap:8px; }
  .breadcrumb { font-size:0.75rem; color:var(--muted); font-family:'JetBrains Mono',monospace; }
  .breadcrumb span { color:var(--text); font-weight:600; }
  .topbar-right { display:flex; align-items:center; gap:8px; }
  .tb-pill {
    display:flex; align-items:center; gap:6px;
    background:var(--surface2); border:1px solid var(--border);
    border-radius:8px; padding:5px 10px; font-size:0.72rem; font-weight:500; cursor:pointer;
  }
  .tb-dot { width:6px; height:6px; border-radius:50%; }

  .page { padding:24px; flex:1; }

  /* ── PAGE HEADER ── */
  .page-header { margin-bottom:24px; }
  .page-title {
    font-size:1.35rem; font-weight:800; color:var(--text); letter-spacing:-0.5px; margin-bottom:4px;
  }
  .page-sub { font-size:0.8rem; color:var(--muted); }

  /* ── CARDS ── */
  .card {
    background:var(--surface); border:1px solid var(--border);
    border-radius:14px; padding:18px;
  }
  .card-title {
    font-size:0.68rem; font-weight:700; letter-spacing:1.5px;
    text-transform:uppercase; color:var(--muted); margin-bottom:14px;
    font-family:'JetBrains Mono',monospace;
  }

  /* ── GRID ── */
  .grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  .grid-3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:14px; }
  .grid-4 { display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:12px; }
  .col-span-2 { grid-column:span 2; }

  /* ── KPI TILES ── */
  .kpi-tile {
    background:var(--surface); border:1px solid var(--border);
    border-radius:14px; padding:16px 18px;
  }
  .kpi-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px; }
  .kpi-label { font-size:0.68rem; color:var(--muted); font-weight:600; letter-spacing:0.5px; text-transform:uppercase; font-family:'JetBrains Mono',monospace; }
  .kpi-icon { font-size:1.1rem; }
  .kpi-val { font-family:'JetBrains Mono',monospace; font-size:1.6rem; font-weight:700; color:var(--text); }
  .kpi-delta { font-size:0.68rem; margin-top:4px; font-weight:600; }
  .kpi-delta.up { color:var(--green); }
  .kpi-delta.down { color:var(--red); }
  .kpi-delta.neutral { color:var(--muted); }

  /* ── APP STATUS CARDS ── */
  .app-status-card {
    background:var(--surface); border:1px solid var(--border);
    border-radius:14px; padding:16px; display:flex; flex-direction:column; gap:12px;
  }
  .app-status-header { display:flex; align-items:center; gap:10px; }
  .app-icon-box {
    width:36px; height:36px; border-radius:10px;
    display:flex; align-items:center; justify-content:center; font-size:1.1rem; flex-shrink:0;
  }
  .app-status-name { font-size:0.88rem; font-weight:700; }
  .app-status-version { font-size:0.62rem; color:var(--muted); font-family:'JetBrains Mono',monospace; margin-top:1px; }
  .status-pill {
    margin-left:auto; font-size:0.6rem; font-weight:700; padding:3px 8px; border-radius:6px;
    font-family:'JetBrains Mono',monospace; letter-spacing:0.5px;
  }
  .status-pill.live   { background:rgba(34,197,94,0.12);  color:var(--green);  border:1px solid rgba(34,197,94,0.2);  }
  .status-pill.maint  { background:rgba(234,179,8,0.12);  color:var(--yellow); border:1px solid rgba(234,179,8,0.2);  }
  .status-pill.off    { background:rgba(239,68,68,0.12);  color:var(--red);    border:1px solid rgba(239,68,68,0.2);  }
  .app-metrics { display:flex; gap:12px; }
  .app-metric { flex:1; background:var(--surface2); border-radius:8px; padding:8px 10px; }
  .app-metric-val { font-family:'JetBrains Mono',monospace; font-size:0.88rem; font-weight:700; }
  .app-metric-lbl { font-size:0.6rem; color:var(--muted); margin-top:2px; }
  .app-action-row { display:flex; gap:6px; margin-top:2px; }

  /* ── BUTTONS ── */
  .btn {
    padding:7px 14px; border-radius:8px; font-size:0.76rem; font-weight:600;
    cursor:pointer; border:none; font-family:'Manrope',sans-serif; transition:all 0.15s;
    display:inline-flex; align-items:center; gap:6px;
  }
  .btn-primary { background:var(--brand); color:white; }
  .btn-primary:hover { background:#c62b38; }
  .btn-ghost { background:var(--surface2); color:var(--text); border:1px solid var(--border); }
  .btn-ghost:hover { border-color:var(--border2); background:rgba(255,255,255,0.05); }
  .btn-green { background:rgba(34,197,94,0.15); color:var(--green); border:1px solid rgba(34,197,94,0.2); }
  .btn-green:hover { background:rgba(34,197,94,0.25); }
  .btn-red { background:rgba(239,68,68,0.12); color:var(--red); border:1px solid rgba(239,68,68,0.2); }
  .btn-red:hover { background:rgba(239,68,68,0.22); }
  .btn-yellow { background:rgba(234,179,8,0.12); color:var(--yellow); border:1px solid rgba(234,179,8,0.2); }
  .btn-sm { padding:5px 10px; font-size:0.7rem; border-radius:6px; }

  /* ── FORM ELEMENTS ── */
  .form-group { margin-bottom:14px; }
  .form-label { display:block; font-size:0.68rem; font-weight:700; color:var(--muted); letter-spacing:1px; text-transform:uppercase; margin-bottom:6px; font-family:'JetBrains Mono',monospace; }
  .form-input {
    width:100%; padding:9px 12px; background:var(--surface2); border:1px solid var(--border);
    border-radius:8px; font-family:'JetBrains Mono',monospace; font-size:0.82rem; color:var(--text);
    outline:none; transition:border-color 0.15s;
  }
  .form-input:focus { border-color:var(--brand); }
  .form-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .form-hint { font-size:0.65rem; color:var(--muted); margin-top:4px; font-family:'JetBrains Mono',monospace; }

  /* Toggle switch */
  .toggle-wrap { display:flex; align-items:center; justify-content:space-between; padding:10px 14px; background:var(--surface2); border:1px solid var(--border); border-radius:8px; }
  .toggle-label { font-size:0.8rem; font-weight:500; }
  .toggle-sub { font-size:0.68rem; color:var(--muted); margin-top:1px; }
  .toggle-switch { position:relative; width:36px; height:20px; flex-shrink:0; }
  .toggle-switch input { opacity:0; width:0; height:0; position:absolute; }
  .toggle-track {
    position:absolute; inset:0; border-radius:10px; cursor:pointer;
    background:var(--border2); transition:background 0.2s;
  }
  .toggle-track.on { background:var(--green); }
  .toggle-thumb {
    position:absolute; top:3px; left:3px;
    width:14px; height:14px; border-radius:50%; background:white; transition:left 0.2s;
  }
  .toggle-thumb.on { left:19px; }

  /* ── TABLE ── */
  .data-table { width:100%; border-collapse:collapse; }
  .data-table th { font-family:'JetBrains Mono',monospace; font-size:0.6rem; font-weight:700; color:var(--muted); text-transform:uppercase; letter-spacing:1px; padding:8px 12px; text-align:left; border-bottom:1px solid var(--border); }
  .data-table td { font-size:0.78rem; padding:10px 12px; border-bottom:1px solid rgba(255,255,255,0.04); vertical-align:middle; }
  .data-table tr:hover td { background:rgba(255,255,255,0.02); }
  .data-table tr:last-child td { border-bottom:none; }

  /* ── BADGES ── */
  .badge { display:inline-block; font-size:0.6rem; font-weight:700; padding:2px 7px; border-radius:5px; letter-spacing:0.5px; font-family:'JetBrains Mono',monospace; text-transform:uppercase; }
  .badge-green  { background:rgba(34,197,94,0.12);  color:var(--green);  border:1px solid rgba(34,197,94,0.15);  }
  .badge-red    { background:rgba(239,68,68,0.12);  color:var(--red);    border:1px solid rgba(239,68,68,0.15);  }
  .badge-yellow { background:rgba(234,179,8,0.12);  color:var(--yellow); border:1px solid rgba(234,179,8,0.15);  }
  .badge-blue   { background:rgba(59,130,246,0.12); color:var(--blue);   border:1px solid rgba(59,130,246,0.15); }
  .badge-purple { background:rgba(168,85,247,0.12); color:var(--purple); border:1px solid rgba(168,85,247,0.15); }
  .badge-orange { background:rgba(255,107,53,0.12); color:var(--orange); border:1px solid rgba(255,107,53,0.15); }

  /* METHOD badges */
  .method-get    { background:rgba(34,197,94,0.1);  color:var(--green);  border:1px solid rgba(34,197,94,0.15);  font-family:'JetBrains Mono',monospace; font-size:0.6rem; font-weight:700; padding:2px 6px; border-radius:4px; }
  .method-post   { background:rgba(59,130,246,0.1); color:var(--blue);   border:1px solid rgba(59,130,246,0.15); font-family:'JetBrains Mono',monospace; font-size:0.6rem; font-weight:700; padding:2px 6px; border-radius:4px; }
  .method-patch  { background:rgba(234,179,8,0.1);  color:var(--yellow); border:1px solid rgba(234,179,8,0.15);  font-family:'JetBrains Mono',monospace; font-size:0.6rem; font-weight:700; padding:2px 6px; border-radius:4px; }
  .method-delete { background:rgba(239,68,68,0.1);  color:var(--red);    border:1px solid rgba(239,68,68,0.15);  font-family:'JetBrains Mono',monospace; font-size:0.6rem; font-weight:700; padding:2px 6px; border-radius:4px; }

  /* ── CODE BLOCK ── */
  .code-block {
    background:#080B10; border:1px solid var(--border); border-radius:10px;
    padding:14px 16px; font-family:'JetBrains Mono',monospace; font-size:0.75rem;
    color:#A8D8A0; line-height:1.7; overflow-x:auto; position:relative;
  }
  .code-comment { color:#4B5563; }
  .code-key     { color:#93C5FD; }
  .code-val     { color:#FCA5A5; }
  .code-str     { color:#A8D8A0; }
  .code-copy {
    position:absolute; top:8px; right:10px;
    background:var(--surface); border:1px solid var(--border);
    border-radius:6px; padding:3px 8px; font-size:0.6rem; font-weight:600;
    color:var(--muted); cursor:pointer; font-family:'JetBrains Mono',monospace;
    transition:all 0.15s;
  }
  .code-copy:hover { border-color:var(--brand); color:var(--brand); }

  /* ── API KEY ── */
  .api-key-row {
    display:flex; align-items:center; gap:10px;
    background:var(--surface2); border:1px solid var(--border);
    border-radius:10px; padding:10px 14px;
  }
  .api-key-label { font-size:0.65rem; color:var(--muted); font-family:'JetBrains Mono',monospace; margin-bottom:3px; }
  .api-key-val { font-family:'JetBrains Mono',monospace; font-size:0.78rem; font-weight:500; color:var(--cyan); letter-spacing:0.5px; flex:1; }
  .key-env { font-size:0.6rem; color:var(--muted); }

  /* ── DEPLOY LOG ── */
  .log-row { display:flex; align-items:flex-start; gap:10px; padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.04); }
  .log-row:last-child { border-bottom:none; }
  .log-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; margin-top:3px; }
  .log-time { font-family:'JetBrains Mono',monospace; font-size:0.62rem; color:var(--muted); flex-shrink:0; min-width:110px; }
  .log-action { font-size:0.78rem; color:var(--text); }
  .log-app { font-family:'JetBrains Mono',monospace; font-size:0.62rem; color:var(--muted); margin-top:2px; }

  /* ── WEBHOOK ── */
  .webhook-event { display:flex; align-items:center; gap:8px; padding:7px 0; border-bottom:1px solid rgba(255,255,255,0.04); }
  .webhook-event:last-child { border-bottom:none; }
  .webhook-check { width:16px; height:16px; border-radius:4px; cursor:pointer; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:0.7rem; border:1px solid var(--border); transition:all 0.15s; }
  .webhook-check.checked { background:var(--brand); border-color:var(--brand); }
  .webhook-name { font-family:'JetBrains Mono',monospace; font-size:0.72rem; }

  /* ── SANDBOX ── */
  .sandbox-terminal {
    background:#060910; border:1px solid var(--border); border-radius:12px; overflow:hidden;
  }
  .terminal-bar {
    display:flex; align-items:center; gap:6px; padding:10px 14px;
    border-bottom:1px solid var(--border); background:rgba(255,255,255,0.02);
  }
  .t-dot { width:10px; height:10px; border-radius:50%; }
  .terminal-title { font-family:'JetBrains Mono',monospace; font-size:0.65rem; color:var(--muted); margin-left:4px; }
  .terminal-body { padding:16px; font-family:'JetBrains Mono',monospace; font-size:0.75rem; min-height:160px; color:#A8D8A0; line-height:1.8; }
  .t-prompt { color:var(--brand); }
  .t-cmd { color:var(--text); }
  .t-resp { color:#6B7280; }
  .t-success { color:var(--green); }
  .t-error { color:var(--red); }
  .t-input {
    display:flex; align-items:center; gap:8px; padding:10px 14px;
    border-top:1px solid var(--border);
  }
  .t-input input {
    flex:1; background:none; border:none; outline:none;
    font-family:'JetBrains Mono',monospace; font-size:0.75rem; color:var(--text);
  }
  .t-run { background:var(--brand); color:white; border:none; border-radius:6px; padding:5px 12px; font-size:0.7rem; font-weight:700; cursor:pointer; font-family:'JetBrains Mono',monospace; }

  /* ── SECTION TABS ── */
  .section-tabs { display:flex; gap:2px; margin-bottom:18px; border-bottom:1px solid var(--border); }
  .s-tab { padding:8px 16px; font-size:0.78rem; font-weight:500; cursor:pointer; color:var(--muted); border:none; background:none; border-bottom:2px solid transparent; transition:all 0.15s; font-family:'Manrope',sans-serif; }
  .s-tab.active { color:var(--text); border-bottom-color:var(--brand); font-weight:600; }

  /* ── TOAST ── */
  .toast {
    position:fixed; bottom:24px; right:24px; z-index:9999;
    background:var(--surface); border:1px solid var(--green);
    border-radius:10px; padding:12px 16px; display:flex; align-items:center; gap:10px;
    font-size:0.8rem; font-weight:500; animation:toastIn 0.3s ease;
    box-shadow:0 8px 32px rgba(0,0,0,0.4);
  }
  @keyframes toastIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

  /* ── MODAL ── */
  .modal-overlay {
    position:fixed; inset:0; z-index:1000;
    background:rgba(0,0,0,0.75); backdrop-filter:blur(4px);
    display:flex; align-items:center; justify-content:center; padding:20px;
  }
  .modal {
    background:var(--surface); border:1px solid var(--border2);
    border-radius:16px; padding:24px; width:100%; max-width:480px;
    max-height:88vh; overflow-y:auto;
  }
  .modal-header {
    display:flex; align-items:center; justify-content:space-between; margin-bottom:20px;
  }
  .modal-title { font-size:1rem; font-weight:700; }
  .modal-close {
    background:var(--surface2); border:1px solid var(--border);
    border-radius:6px; width:28px; height:28px; cursor:pointer;
    color:var(--muted); font-size:1rem; display:flex; align-items:center; justify-content:center;
    font-family:monospace;
  }
  .modal-close:hover { color:var(--text); border-color:var(--border2); }
  .modal-footer { display:flex; gap:8px; justify-content:flex-end; margin-top:20px; }
  .form-select {
    width:100%; padding:9px 12px; background:var(--surface2); border:1px solid var(--border);
    border-radius:8px; font-family:'JetBrains Mono',monospace; font-size:0.82rem; color:var(--text);
    outline:none; transition:border-color 0.15s; appearance:none; cursor:pointer;
  }
  .form-select:focus { border-color:var(--brand); }

  /* ── ANIMATIONS ── */
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
  .live-dot { display:inline-block; width:7px; height:7px; border-radius:50%; background:var(--green); box-shadow:0 0 6px var(--green); animation:pulse 2s infinite; }

  /* ── MINI SPARKLINE ── */
  .sparkline { display:flex; align-items:flex-end; gap:3px; height:32px; }
  .spark-bar { flex:1; border-radius:2px 2px 0 0; min-height:3px; }

  /* scrollable table container */
  .table-wrap { overflow-x:auto; }

  /* ── APP LAUNCH BUTTON ── */
  .launch-btn {
    width:100%; padding:10px; background:var(--surface2); border:1px solid var(--border);
    border-radius:8px; color:var(--text); font-size:0.78rem; font-weight:600;
    cursor:pointer; transition:all 0.15s; text-align:center;
    font-family:'Manrope',sans-serif;
  }
  .launch-btn:hover { border-color:var(--brand); color:var(--brand); background:rgba(230,57,70,0.05); }
`;

// ── SMALL COMPONENTS ────────────────────────────────────

function Toggle({ on, onChange }) {
  return (
    <div className="toggle-switch" onClick={() => onChange(!on)}>
      <div className={`toggle-track ${on?"on":""}`} />
      <div className={`toggle-thumb ${on?"on":""}`} />
    </div>
  );
}

function Toast({ msg, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2500); return () => clearTimeout(t); }, []);
  return <div className="toast"><span style={{color:"var(--green)"}}>✓</span>{msg}</div>;
}

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <span className="code-copy" onClick={() => { navigator.clipboard?.writeText(text); setCopied(true); setTimeout(()=>setCopied(false),1500); }}>
      {copied ? "✓ copied" : "copy"}
    </span>
  );
}

function MethodBadge({ method }) {
  return <span className={`method-${method.toLowerCase()}`}>{method}</span>;
}

// ── PAGE: OVERVIEW ────────────────────────────────────────
function PageOverview({ config, setConfig, toast }) {
  const apps = [
    { key:"khana",    name:"TooFan Khana",    icon:"🍱", color:"#E63946", version:"v2.4.1", users:1240, orders:342 },
    { key:"driver",   name:"TooFan Driver",   icon:"🛵", color:"#FF6B35", version:"v1.9.3", users:47,   orders:342 },
    { key:"business", name:"Business Portal", icon:"🏪", color:"#3B82F6", version:"v1.5.0", users:18,   orders:0   },
  ];

  const kpis = [
    { label:"Total Orders Today", val:"342",    icon:"📦", delta:"↑ 12%",  up:true  },
    { label:"Platform Revenue",   val:"रू94k",  icon:"💰", delta:"↑ 8%",   up:true  },
    { label:"Active Drivers",     val:"23",      icon:"🛵", delta:"↑ 3",    up:true  },
    { label:"API Calls Today",    val:"8,421",   icon:"⚡", delta:"↓ 200",  up:false },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">Platform Overview</div>
        <div className="page-sub">All TooFan apps at a glance — live status, metrics, and quick controls.</div>
      </div>

      {/* KPIs */}
      <div className="grid-4" style={{marginBottom:20}}>
        {kpis.map((k,i) => (
          <div key={i} className="kpi-tile">
            <div className="kpi-top">
              <div className="kpi-label">{k.label}</div>
              <span>{k.icon}</span>
            </div>
            <div className="kpi-val">{k.val}</div>
            <div className={`kpi-delta ${k.up?"up":"down"}`}>{k.delta} from yesterday</div>
          </div>
        ))}
      </div>

      {/* App status cards */}
      <div className="grid-3" style={{marginBottom:20}}>
        {apps.map(app => {
          const cfg = config[app.key];
          const statusText = cfg.maintenanceMode ? "MAINT" : cfg.active ? "LIVE" : "OFF";
          const statusCls  = cfg.maintenanceMode ? "maint" : cfg.active ? "live" : "off";
          return (
            <div key={app.key} className="app-status-card">
              <div className="app-status-header">
                <div className="app-icon-box" style={{background:`${app.color}18`}}>
                  {app.icon}
                </div>
                <div>
                  <div className="app-status-name">{app.name}</div>
                  <div className="app-status-version">{app.version}</div>
                </div>
                <div className={`status-pill ${statusCls}`}>{statusText}</div>
              </div>
              <div className="app-metrics">
                <div className="app-metric">
                  <div className="app-metric-val" style={{color:app.color}}>{app.users}</div>
                  <div className="app-metric-lbl">Active Users</div>
                </div>
                <div className="app-metric">
                  <div className="app-metric-val">{app.orders || "—"}</div>
                  <div className="app-metric-lbl">{app.key==="business"?"Partners":"Orders/Day"}</div>
                </div>
                <div className="app-metric">
                  <div className="app-metric-val" style={{color:"var(--green)"}}>99.8%</div>
                  <div className="app-metric-lbl">Uptime</div>
                </div>
              </div>
              <div className="app-action-row">
                <button className="btn btn-ghost btn-sm" onClick={() => {
                  setConfig(c => ({...c, [app.key]:{...c[app.key], maintenanceMode:!cfg.maintenanceMode}}));
                  toast(`${app.name} maintenance ${!cfg.maintenanceMode?"ON":"OFF"}`);
                }}>
                  {cfg.maintenanceMode ? "🟢 End Maint" : "🔧 Maintenance"}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => {
                  setConfig(c => ({...c, [app.key]:{...c[app.key], active:!cfg.active}}));
                  toast(`${app.name} ${!cfg.active?"enabled":"disabled"}`);
                }}>
                  {cfg.active ? "⏸ Pause" : "▶ Enable"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deploy log */}
      <div className="card">
        <div className="card-title">Recent Changes</div>
        {DEPLOY_LOG.slice(0,5).map((l,i) => (
          <div key={i} className="log-row">
            <div className="log-dot" style={{background: l.status==="success"?"var(--green)":l.status==="warning"?"var(--yellow)":"var(--red)"}} />
            <div className="log-time">{l.time}</div>
            <div>
              <div className="log-action">{l.action}</div>
              <div className="log-app">{l.app} · by {l.by}</div>
            </div>
            <div className={`badge badge-${l.status==="success"?"green":l.status==="warning"?"yellow":"red"}`} style={{marginLeft:"auto",flexShrink:0}}>
              {l.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── PAGE: APP CONFIG ──────────────────────────────────────
function PageAppConfig({ appKey, config, setConfig, toast }) {
  const cfg = config[appKey];
  const [local, setLocal] = useState({...cfg});
  const appMeta = {
    khana:    { name:"TooFan Khana",    icon:"🍱", color:"#E63946" },
    driver:   { name:"TooFan Driver",   icon:"🛵", color:"#FF6B35" },
    business: { name:"Business Portal", icon:"🏪", color:"#3B82F6" },
  }[appKey];

  const set = (k, v) => setLocal(l => ({...l, [k]:v}));

  const save = () => {
    setConfig(c => ({...c, [appKey]: local}));
    toast(`${appMeta.name} config saved`);
  };

  return (
    <div className="page">
      <div className="page-header" style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start"}}>
        <div>
          <div className="page-title">{appMeta.icon} {appMeta.name} — Config</div>
          <div className="page-sub">Edit runtime settings for {appMeta.name}. Changes apply immediately after save.</div>
        </div>
        <button className="btn btn-primary" onClick={save}>💾 Save Changes</button>
      </div>

      <div className="grid-2">
        {/* General */}
        <div className="card">
          <div className="card-title">General Settings</div>
          <div className="form-group">
            <label className="form-label">App Name</label>
            <input className="form-input" value={local.appName} onChange={e=>set("appName",e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Support {appKey==="business"?"Email":"Phone"}</label>
            <input className="form-input" value={local.supportPhone||local.supportEmail||""} onChange={e=>set(appKey==="business"?"supportEmail":"supportPhone",e.target.value)} />
          </div>
          {appKey==="khana" && (
            <div className="form-group">
              <label className="form-label">Welcome Message</label>
              <input className="form-input" value={local.welcomeMessage} onChange={e=>set("welcomeMessage",e.target.value)} />
            </div>
          )}
          {appKey==="khana" && (
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Delivery Fee (रू)</label>
                <input className="form-input" type="number" value={local.deliveryFee} onChange={e=>set("deliveryFee",+e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Platform Fee (रू)</label>
                <input className="form-input" type="number" value={local.platformFee} onChange={e=>set("platformFee",+e.target.value)} />
              </div>
            </div>
          )}
          {appKey==="khana" && (
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Min Order (रू)</label>
                <input className="form-input" type="number" value={local.minOrderAmount} onChange={e=>set("minOrderAmount",+e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Max Delivery Radius (km)</label>
                <input className="form-input" type="number" value={local.maxDeliveryRadius} onChange={e=>set("maxDeliveryRadius",+e.target.value)} />
              </div>
            </div>
          )}
          {appKey==="driver" && (
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Per KM Rate (रू)</label>
                <input className="form-input" type="number" value={local.perKmRate} onChange={e=>set("perKmRate",+e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Delivery Bonus (रू)</label>
                <input className="form-input" type="number" value={local.perDeliveryBonus} onChange={e=>set("perDeliveryBonus",+e.target.value)} />
              </div>
            </div>
          )}
          {appKey==="driver" && (
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Max Active Orders</label>
                <input className="form-input" type="number" value={local.maxActiveOrders} onChange={e=>set("maxActiveOrders",+e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Online Radius (km)</label>
                <input className="form-input" type="number" value={local.onlineRadiusKm} onChange={e=>set("onlineRadiusKm",+e.target.value)} />
              </div>
            </div>
          )}
          {appKey==="business" && (
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Starter Plan (रू/mo)</label>
                <input className="form-input" type="number" value={local.starterPrice} onChange={e=>set("starterPrice",+e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Growth Plan (रू/mo)</label>
                <input className="form-input" type="number" value={local.growthPrice} onChange={e=>set("growthPrice",+e.target.value)} />
              </div>
            </div>
          )}
          {appKey==="business" && (
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Trial Days</label>
                <input className="form-input" type="number" value={local.trialDays} onChange={e=>set("trialDays",+e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Commission %</label>
                <input className="form-input" type="number" value={local.commissionPct} onChange={e=>set("commissionPct",+e.target.value)} />
              </div>
            </div>
          )}
        </div>

        {/* Toggles */}
        <div className="card">
          <div className="card-title">Feature Toggles</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div className="toggle-wrap">
              <div>
                <div className="toggle-label">App Active</div>
                <div className="toggle-sub">Enable / disable the entire app</div>
              </div>
              <Toggle on={local.active} onChange={v=>set("active",v)} />
            </div>
            <div className="toggle-wrap">
              <div>
                <div className="toggle-label">Maintenance Mode</div>
                <div className="toggle-sub">Show a maintenance screen to users</div>
              </div>
              <Toggle on={local.maintenanceMode} onChange={v=>set("maintenanceMode",v)} />
            </div>
            {appKey==="driver" && (
              <div className="toggle-wrap">
                <div>
                  <div className="toggle-label">Auto-Assign Orders</div>
                  <div className="toggle-sub">Automatically assign to nearest driver</div>
                </div>
                <Toggle on={local.autoAssign} onChange={v=>set("autoAssign",v)} />
              </div>
            )}
            {appKey==="business" && (
              <div className="toggle-wrap">
                <div>
                  <div className="toggle-label">Auto-Approve Partners</div>
                  <div className="toggle-sub">Skip manual review for new signups</div>
                </div>
                <Toggle on={local.autoApprovePartners} onChange={v=>set("autoApprovePartners",v)} />
              </div>
            )}
          </div>

          {/* Branding colours */}
          <div style={{marginTop:18}}>
            <div className="card-title">Branding Colours</div>
            <div className="form-group">
              <label className="form-label">Primary Colour</label>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <input type="color" value={appMeta.color} style={{width:36,height:36,border:"none",background:"none",cursor:"pointer",borderRadius:6}} readOnly />
                <input className="form-input" value={appMeta.color} readOnly style={{flex:1,fontFamily:"'JetBrains Mono',monospace"}} />
              </div>
              <div className="form-hint">// Contact Nabin to change brand colours</div>
            </div>
          </div>

          {/* Current config snapshot */}
          <div style={{marginTop:14}}>
            <div className="card-title">Live Config Snapshot</div>
            <div className="code-block" style={{fontSize:"0.68rem"}}>
              <CopyBtn text={JSON.stringify(local,null,2)} />
              <span className="code-comment">// {appMeta.name} runtime config</span>{"\n"}
              {"{"}
              {Object.entries(local).map(([k,v]) => (
                <span key={k}>{"\n  "}<span className="code-key">"{k}"</span>{": "}<span className="code-val">{JSON.stringify(v)}</span>{","}</span>
              ))}
              {"\n}"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const BLANK_REST = { name:"", cuisine:"Nepali", city:"Kathmandu", time:"20-30", img:"🍽️", rating:4.5, active:true };
const CUISINES = ["Nepali","Traditional","Indian","Cafe","Fast Food","Mughlai","Chinese","Continental"];
const CITIES   = ["Kathmandu","Lalitpur","Bhaktapur","Pokhara","Patan","Biratnagar","Butwal"];

// ── PAGE: RESTAURANTS ────────────────────────────────────
function PageRestaurants({ toast }) {
  const [rests, setRests] = useState(INITIAL_RESTAURANTS);
  const [modal, setModal] = useState(null); // null | { mode:"add"|"edit", data:{} }

  const openAdd  = () => setModal({ mode:"add",  data:{...BLANK_REST} });
  const openEdit = (r) => setModal({ mode:"edit", data:{...r} });
  const closeModal = () => setModal(null);

  const setField = (k, v) => setModal(m => ({...m, data:{...m.data, [k]:v}}));

  const save = () => {
    if (!modal.data.name.trim()) return;
    if (modal.mode === "add") {
      const joined = new Date().toLocaleString("en-US",{month:"short",year:"numeric"});
      setRests(r => [...r, {...modal.data, id: Date.now(), joined }]);
      toast(`${modal.data.name} added`);
    } else {
      setRests(r => r.map(x => x.id===modal.data.id ? modal.data : x));
      toast(`${modal.data.name} updated`);
    }
    closeModal();
  };

  const toggle = (id) => {
    const r = rests.find(x=>x.id===id);
    setRests(rs => rs.map(x => x.id===id ? {...x,active:!x.active} : x));
    toast(`${r.name} ${r.active?"deactivated":"activated"}`);
  };

  return (
    <div className="page">
      <div className="page-header" style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div>
          <div className="page-title">🍱 Restaurants</div>
          <div className="page-sub">Manage all partner restaurants on TooFan Khana.</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Restaurant</button>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Restaurant</th><th>Cuisine</th><th>City</th>
                <th>Rating</th><th>Delivery</th><th>Joined</th>
                <th>Status</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rests.map(r => (
                <tr key={r.id}>
                  <td><span style={{marginRight:6}}>{r.img}</span><strong>{r.name}</strong></td>
                  <td><span className="badge badge-purple">{r.cuisine}</span></td>
                  <td style={{color:"var(--muted)"}}>{r.city}</td>
                  <td style={{color:"var(--yellow)"}}>⭐ {r.rating}</td>
                  <td style={{color:"var(--muted)"}}>{r.time} min</td>
                  <td style={{color:"var(--muted)",fontFamily:"'JetBrains Mono',monospace",fontSize:"0.68rem"}}>{r.joined}</td>
                  <td><span className={`badge ${r.active?"badge-green":"badge-red"}`}>{r.active?"ACTIVE":"PAUSED"}</span></td>
                  <td>
                    <div style={{display:"flex",gap:6}}>
                      <button className={`btn btn-sm ${r.active?"btn-red":"btn-green"}`} onClick={()=>toggle(r.id)}>
                        {r.active?"Pause":"Activate"}
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={()=>openEdit(r)}>Edit</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{modal.mode==="add"?"➕ Add Restaurant":"✏️ Edit Restaurant"}</div>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input className="form-input" value={modal.data.name} onChange={e=>setField("name",e.target.value)} placeholder="Restaurant name" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Cuisine</label>
                <select className="form-select" value={modal.data.cuisine} onChange={e=>setField("cuisine",e.target.value)}>
                  {CUISINES.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">City</label>
                <select className="form-select" value={modal.data.city} onChange={e=>setField("city",e.target.value)}>
                  {CITIES.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Delivery Time</label>
                <input className="form-input" value={modal.data.time} onChange={e=>setField("time",e.target.value)} placeholder="20-30" />
                <div className="form-hint">// e.g. 20-30</div>
              </div>
              <div className="form-group">
                <label className="form-label">Rating</label>
                <input className="form-input" type="number" step="0.1" min="1" max="5" value={modal.data.rating} onChange={e=>setField("rating",parseFloat(e.target.value))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Icon (emoji)</label>
              <input className="form-input" value={modal.data.img} onChange={e=>setField("img",e.target.value)} placeholder="🍽️" />
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>
                {modal.mode==="add"?"Add Restaurant":"Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const BLANK_DRIVER = { name:"", phone:"", city:"Kathmandu", status:"Pending", trips:0, rating:0, approved:false };

// ── PAGE: DRIVERS ────────────────────────────────────────
function PageDrivers({ toast }) {
  const [drivers, setDrivers] = useState(INITIAL_DRIVERS);
  const [modal, setModal] = useState(null); // null | { mode:"add"|"edit", data:{} }

  const openAdd  = () => setModal({ mode:"add",  data:{...BLANK_DRIVER, id:`D${String(Date.now()).slice(-2)}`} });
  const openEdit = (d) => setModal({ mode:"edit", data:{...d} });
  const closeModal = () => setModal(null);

  const setField = (k, v) => setModal(m => ({...m, data:{...m.data, [k]:v}}));

  const save = () => {
    if (!modal.data.name.trim() || !modal.data.phone.trim()) return;
    if (modal.mode === "add") {
      setDrivers(d => [...d, modal.data]);
      toast(`${modal.data.name} added — pending approval`);
    } else {
      setDrivers(d => d.map(x => x.id===modal.data.id ? modal.data : x));
      toast(`${modal.data.name} updated`);
    }
    closeModal();
  };

  const approve = (id) => {
    setDrivers(d => d.map(x => x.id===id ? {...x,approved:true,status:"Active"} : x));
    toast("Driver approved & activated");
  };
  const remove = (id) => {
    setDrivers(d => d.filter(x => x.id!==id));
    toast("Driver removed from platform");
  };

  return (
    <div className="page">
      <div className="page-header" style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div>
          <div className="page-title">🛵 Drivers</div>
          <div className="page-sub">Approve, manage, and monitor all TooFan drivers.</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Driver</button>
      </div>

      {drivers.filter(d=>!d.approved).length > 0 && (
        <div style={{background:"rgba(234,179,8,0.07)",border:"1px solid rgba(234,179,8,0.2)",borderRadius:12,padding:"12px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:10,fontSize:"0.82rem"}}>
          <span style={{color:"var(--yellow)"}}>⚠</span>
          <span><strong style={{color:"var(--yellow)"}}>{drivers.filter(d=>!d.approved).length} driver{drivers.filter(d=>!d.approved).length>1?"s":""}</strong> pending approval</span>
        </div>
      )}

      <div className="card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Driver</th><th>Phone</th><th>City</th><th>Status</th><th>Trips</th><th>Rating</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {drivers.map(d => (
                <tr key={d.id}>
                  <td><strong>{d.name}</strong><div style={{fontSize:"0.65rem",color:"var(--muted)",fontFamily:"'JetBrains Mono',monospace"}}>{d.id}</div></td>
                  <td style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.72rem",color:"var(--muted)"}}>{d.phone}</td>
                  <td style={{color:"var(--muted)"}}>{d.city}</td>
                  <td>
                    <span className={`badge ${d.status==="Active"?"badge-green":d.status==="Pending"?"badge-yellow":"badge-red"}`}>{d.status}</span>
                  </td>
                  <td style={{fontFamily:"'JetBrains Mono',monospace"}}>{d.trips}</td>
                  <td style={{color:"var(--yellow)"}}>{d.rating > 0 ? `⭐ ${d.rating}` : "—"}</td>
                  <td>
                    <div style={{display:"flex",gap:6}}>
                      {!d.approved && <button className="btn btn-green btn-sm" onClick={()=>approve(d.id)}>✓ Approve</button>}
                      <button className="btn btn-ghost btn-sm" onClick={()=>openEdit(d)}>Edit</button>
                      <button className="btn btn-red btn-sm" onClick={()=>remove(d.id)}>Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{modal.mode==="add"?"➕ Add Driver":"✏️ Edit Driver"}</div>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={modal.data.name} onChange={e=>setField("name",e.target.value)} placeholder="Driver full name" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" value={modal.data.phone} onChange={e=>setField("phone",e.target.value)} placeholder="98XXXXXXXX" />
              </div>
              <div className="form-group">
                <label className="form-label">City</label>
                <select className="form-select" value={modal.data.city} onChange={e=>setField("city",e.target.value)}>
                  {CITIES.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            {modal.mode==="edit" && (
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={modal.data.status} onChange={e=>setField("status",e.target.value)}>
                    {["Active","Offline","Pending"].map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Rating</label>
                  <input className="form-input" type="number" step="0.1" min="0" max="5" value={modal.data.rating} onChange={e=>setField("rating",parseFloat(e.target.value)||0)} />
                </div>
              </div>
            )}
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>
                {modal.mode==="add"?"Add Driver":"Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const BLANK_PARTNER = { name:"", type:"Franchise", plan:"Starter", city:"Kathmandu", outlets:1, status:"Pending" };
const PARTNER_TYPES = ["Franchise","Fleet","Restaurant","Cloud Kitchen"];
const PARTNER_PLANS = ["Starter","Growth","Enterprise"];

// ── PAGE: PARTNERS ────────────────────────────────────────
function PagePartners({ toast }) {
  const [partners, setPartners] = useState(INITIAL_PARTNERS);
  const [modal, setModal] = useState(null); // null | { mode:"invite"|"view", data:{} }

  const openInvite = () => setModal({ mode:"invite", data:{...BLANK_PARTNER, id:`P${String(Date.now()).slice(-2)}`} });
  const openView   = (p) => setModal({ mode:"view",   data:{...p} });
  const closeModal = () => setModal(null);

  const setField = (k, v) => setModal(m => ({...m, data:{...m.data, [k]:v}}));

  const sendInvite = () => {
    if (!modal.data.name.trim()) return;
    const joined = new Date().toLocaleString("en-US",{month:"short",year:"numeric"});
    setPartners(p => [...p, {...modal.data, joined}]);
    toast(`Invite sent to ${modal.data.name}`);
    closeModal();
  };

  const saveView = () => {
    setPartners(p => p.map(x => x.id===modal.data.id ? modal.data : x));
    toast(`${modal.data.name} updated`);
    closeModal();
  };

  const approve = (id) => {
    setPartners(p => p.map(x => x.id===id ? {...x,status:"Active"} : x));
    toast("Partner approved and onboarded");
  };

  return (
    <div className="page">
      <div className="page-header" style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div>
          <div className="page-title">🏪 Business Partners</div>
          <div className="page-sub">Manage all franchise and fleet partners on the Business Portal.</div>
        </div>
        <button className="btn btn-primary" onClick={openInvite}>+ Invite Partner</button>
      </div>

      {partners.filter(p=>p.status==="Pending").length > 0 && (
        <div style={{background:"rgba(59,130,246,0.07)",border:"1px solid rgba(59,130,246,0.2)",borderRadius:12,padding:"12px 16px",marginBottom:16,fontSize:"0.82rem",display:"flex",gap:10,alignItems:"center"}}>
          <span style={{color:"var(--blue)"}}>ℹ</span>
          <span><strong style={{color:"var(--blue)"}}>{partners.filter(p=>p.status==="Pending").length} partner(s)</strong> awaiting your approval</span>
        </div>
      )}

      <div className="card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Business</th><th>Type</th><th>Plan</th><th>City</th><th>Outlets</th><th>Joined</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {partners.map(p => (
                <tr key={p.id}>
                  <td><strong>{p.name}</strong></td>
                  <td><span className={`badge ${p.type==="Franchise"?"badge-orange":p.type==="Fleet"?"badge-blue":"badge-purple"}`}>{p.type}</span></td>
                  <td><span className="badge badge-green">{p.plan}</span></td>
                  <td style={{color:"var(--muted)"}}>{p.city}</td>
                  <td style={{fontFamily:"'JetBrains Mono',monospace"}}>{p.outlets}</td>
                  <td style={{color:"var(--muted)",fontFamily:"'JetBrains Mono',monospace",fontSize:"0.68rem"}}>{p.joined}</td>
                  <td><span className={`badge ${p.status==="Active"?"badge-green":"badge-yellow"}`}>{p.status}</span></td>
                  <td>
                    <div style={{display:"flex",gap:6}}>
                      {p.status==="Pending" && <button className="btn btn-green btn-sm" onClick={()=>approve(p.id)}>✓ Approve</button>}
                      <button className="btn btn-ghost btn-sm" onClick={()=>openView(p)}>View</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{modal.mode==="invite"?"📨 Invite Partner":"🏪 Partner Details"}</div>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <div className="form-group">
              <label className="form-label">Business Name</label>
              <input className="form-input" value={modal.data.name} onChange={e=>setField("name",e.target.value)} placeholder="Business name" readOnly={modal.mode==="view"&&modal.data.status==="Active"} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-select" value={modal.data.type} onChange={e=>setField("type",e.target.value)}>
                  {PARTNER_TYPES.map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Plan</label>
                <select className="form-select" value={modal.data.plan} onChange={e=>setField("plan",e.target.value)}>
                  {PARTNER_PLANS.map(p=><option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">City</label>
                <select className="form-select" value={modal.data.city} onChange={e=>setField("city",e.target.value)}>
                  {CITIES.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Outlets</label>
                <input className="form-input" type="number" min="1" value={modal.data.outlets} onChange={e=>setField("outlets",+e.target.value)} />
              </div>
            </div>
            {modal.mode==="view" && (
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={modal.data.status} onChange={e=>setField("status",e.target.value)}>
                  {["Active","Pending","Suspended"].map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
            )}
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={modal.mode==="invite"?sendInvite:saveView}>
                {modal.mode==="invite"?"Send Invite":"Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── PAGE: API KEYS ────────────────────────────────────────
function PageAPIKeys({ toast }) {
  const [keys] = useState([
    { env:"production", key:"tf_live_sk_KthmNP_aBcDeFgHiJkLmNoP1234567890xYz", created:"Jan 10, 2025", lastUsed:"Today" },
    { env:"test",       key:"tf_test_sk_SandBx_qRsTuVwXyZaBcDeFgHiJkLm0987654", created:"Jan 10, 2025", lastUsed:"Today" },
  ]);
  const [visible, setVisible] = useState({});

  return (
    <div className="page">
      <div className="page-header" style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div>
          <div className="page-title">🔑 API Keys</div>
          <div className="page-sub">Your secret keys for integrating TooFan with external tools and automations.</div>
        </div>
        <button className="btn btn-ghost" onClick={()=>toast("New API key generated")}>+ Generate Key</button>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {keys.map((k,i) => (
          <div key={i} className="card">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                  <span className={`badge ${k.env==="production"?"badge-red":"badge-blue"}`}>{k.env.toUpperCase()}</span>
                  <span style={{fontSize:"0.72rem",color:"var(--muted)"}}>Created {k.created} · Last used {k.lastUsed}</span>
                </div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button className="btn btn-ghost btn-sm" onClick={()=>setVisible(v=>({...v,[i]:!v[i]}))}>
                  {visible[i]?"Hide":"Show"}
                </button>
                <button className="btn btn-red btn-sm" onClick={()=>toast("Key rotated — update your integrations")}>Rotate</button>
              </div>
            </div>
            <div className="api-key-row">
              <div style={{flex:1}}>
                <div className="api-key-label">SECRET KEY</div>
                <div className="api-key-val">
                  {visible[i] ? k.key : k.key.slice(0,20)+"•".repeat(30)}
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={()=>{navigator.clipboard?.writeText(k.key);toast("Key copied");}}>Copy</button>
            </div>
          </div>
        ))}
      </div>

      {/* Usage example */}
      <div className="card" style={{marginTop:14}}>
        <div className="card-title">Usage Example — n8n / HTTP Request</div>
        <div className="code-block">
          <CopyBtn text={`fetch("https://api.toofan.com/v1/orders", {\n  headers: { "Authorization": "Bearer tf_live_sk_KthmNP_..." }\n})`} />
          <span className="code-comment">// Use in n8n HTTP Request node or any tool</span>{"\n"}
          <span className="code-key">const</span>{" response = "}<span className="code-str">await</span>{" fetch("}<span className="code-val">"https://api.toofan.com/v1/orders"</span>{", {"}{"\n"}
          {"  "}<span className="code-key">method</span>{": "}<span className="code-val">"GET"</span>{","}{"\n"}
          {"  "}<span className="code-key">headers</span>{": {{"}{"\n"}
          {"    "}<span className="code-val">"Authorization"</span>{": "}<span className="code-str">`Bearer ${"{"}`}<span className="code-key">process.env.TOOFAN_KEY</span>{"}"}`</span>{"\n"}
          {"  }}"}{"\n"}
          {"});"}
        </div>
      </div>
    </div>
  );
}

// ── PAGE: API REFERENCE ──────────────────────────────────
function PageAPIDocs() {
  const [filter, setFilter] = useState("all");
  const filtered = filter==="all" ? API_ENDPOINTS : API_ENDPOINTS.filter(e=>e.app===filter);

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">📖 API Reference</div>
        <div className="page-sub">All available TooFan REST API endpoints. Base URL: <code style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.78rem",color:"var(--cyan)"}}>https://api.toofan.com</code></div>
      </div>

      <div style={{display:"flex",gap:6,marginBottom:18,flexWrap:"wrap"}}>
        {["all","khana","driver","business","admin"].map(f => (
          <button key={f} className={`btn btn-sm ${filter===f?"btn-primary":"btn-ghost"}`} onClick={()=>setFilter(f)}>
            {f==="all"?"All Apps":f.charAt(0).toUpperCase()+f.slice(1)}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Method</th><th>Endpoint</th><th>Description</th><th>App</th></tr>
            </thead>
            <tbody>
              {filtered.map((e,i) => (
                <tr key={i}>
                  <td><MethodBadge method={e.method} /></td>
                  <td style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.75rem",color:"var(--cyan)"}}>{e.path}</td>
                  <td style={{color:"var(--muted)",fontSize:"0.78rem"}}>{e.desc}</td>
                  <td><span className={`badge ${e.app==="khana"?"badge-red":e.app==="driver"?"badge-orange":e.app==="business"?"badge-blue":e.app==="admin"?"badge-purple":"badge-green"}`}>{e.app}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sample response */}
      <div className="card" style={{marginTop:14}}>
        <div className="card-title">Sample Response — GET /v1/orders</div>
        <div className="code-block">
          <CopyBtn text={`{"orders": [{"id": "TF-1001", "status": "delivered", "total": 300}]}`} />
          {"{{"}{"\n"}
          {"  "}<span className="code-key">"orders"</span>{": ["}{"\n"}
          {"    {{"}{"\n"}
          {"      "}<span className="code-key">"id"</span>{": "}<span className="code-val">"TF-1001"</span>{","}{"\n"}
          {"      "}<span className="code-key">"status"</span>{": "}<span className="code-val">"delivered"</span>{","}{"\n"}
          {"      "}<span className="code-key">"restaurant"</span>{": "}<span className="code-val">"Momo House"</span>{","}{"\n"}
          {"      "}<span className="code-key">"total"</span>{": "}<span className="code-val">300</span>{","}{"\n"}
          {"      "}<span className="code-key">"driver"</span>{": "}<span className="code-val">"Bikash Tamang"</span>{"\n"}
          {"    }}"}{"\n"}
          {"  ],"}{"\n"}
          {"  "}<span className="code-key">"meta"</span>{": {{"}<span className="code-key">"total"</span>{": "}<span className="code-val">342</span>{", "}<span className="code-key">"page"</span>{": "}<span className="code-val">1</span>{" }}"}
          {"\n}"}
        </div>
      </div>
    </div>
  );
}

// ── PAGE: WEBHOOKS ────────────────────────────────────────
function PageWebhooks({ toast }) {
  const [url, setUrl] = useState("https://your-n8n.app/webhook/toofan");
  const [secret, setSecret] = useState("whsec_TooFanN8nSecret2025");
  const [selected, setSelected] = useState(new Set(["order.created","order.delivered","driver.assigned"]));

  const toggleEvent = (e) => {
    setSelected(s => { const n = new Set(s); n.has(e) ? n.delete(e) : n.add(e); return n; });
  };

  return (
    <div className="page">
      <div className="page-header" style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div>
          <div className="page-title">🔔 Webhooks</div>
          <div className="page-sub">Configure real-time event delivery to n8n, Zapier, or any endpoint.</div>
        </div>
        <button className="btn btn-primary" onClick={()=>toast("Webhook saved & verified")}>Save Webhook</button>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">Endpoint Config</div>
          <div className="form-group">
            <label className="form-label">Endpoint URL</label>
            <input className="form-input" value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://..." />
            <div className="form-hint">// Your n8n webhook trigger URL</div>
          </div>
          <div className="form-group">
            <label className="form-label">Signing Secret</label>
            <input className="form-input" value={secret} onChange={e=>setSecret(e.target.value)} />
            <div className="form-hint">// Used to verify TooFan is the sender</div>
          </div>
          <div style={{marginTop:8}}>
            <button className="btn btn-ghost btn-sm" onClick={()=>toast("Test event sent → check your endpoint")}>
              ⚡ Send Test Event
            </button>
          </div>

          <div style={{marginTop:18}}>
            <div className="card-title">n8n Verification Snippet</div>
            <div className="code-block" style={{fontSize:"0.68rem"}}>
              <span className="code-comment">// In n8n Code node — verify signature</span>{"\n"}
              <span className="code-key">const</span>{" sig = "}<span className="code-str">$input.headers</span>{`["x-toofan-sig"];\n`}
              <span className="code-key">const</span>{" body = "}<span className="code-str">JSON.stringify</span>{"($input.body);\n"}
              <span className="code-key">const</span>{" hash = "}<span className="code-str">crypto.createHmac</span>{"(\n  "}<span className="code-val">"sha256"</span>{", "}<span className="code-val">"{secret.slice(0,12)}..."</span>{"\n).update(body).digest("}<span className="code-val">"hex"</span>{");\n"}
              <span className="code-key">if</span>{" (sig !== hash) "}<span className="t-error">throw</span>{" new Error("}<span className="code-val">"Invalid"</span>{");"}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Events to Subscribe ({selected.size}/{WEBHOOK_EVENTS.length})</div>
          <div style={{display:"flex",flexDirection:"column"}}>
            {WEBHOOK_EVENTS.map(e => (
              <div key={e} className="webhook-event" onClick={()=>toggleEvent(e)}>
                <div className={`webhook-check ${selected.has(e)?"checked":""}`}>{selected.has(e)?"✓":""}</div>
                <span className="webhook-name">{e}</span>
                <span style={{marginLeft:"auto",fontSize:"0.6rem",color:"var(--muted)"}}>
                  {e.startsWith("order")?"khana":e.startsWith("driver")?"driver":e.startsWith("partner")?"business":"all"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── PAGE: SANDBOX ─────────────────────────────────────────
function PageSandbox({ toast }) {
  const [cmd, setCmd] = useState("");
  const [log, setLog] = useState([
    { type:"comment", text:"# TooFan API Sandbox — test your endpoints live" },
    { type:"comment", text:"# Type a command below and hit Run" },
  ]);
  const bodyRef = useRef(null);

  const presets = [
    { label:"GET orders",       cmd:"GET /v1/orders" },
    { label:"GET restaurants",  cmd:"GET /v1/restaurants" },
    { label:"GET drivers",      cmd:"GET /v1/drivers" },
    { label:"GET analytics",    cmd:"GET /v1/analytics/revenue" },
    { label:"POST order",       cmd:'POST /v1/orders {"restaurant_id":1,"items":[101,102]}' },
    { label:"PATCH config",     cmd:'PATCH /v1/config/khana {"deliveryFee":60}' },
  ];

  const MOCK_RESPONSES = {
    "GET /v1/orders": { orders:[{id:"TF-1001",status:"delivered",total:300},{id:"TF-1002",status:"on_the_way",total:350}], meta:{total:342,page:1} },
    "GET /v1/restaurants": { restaurants:[{id:1,name:"Momo House",rating:4.8},{id:2,name:"Dal Bhat Palace",rating:4.6}], meta:{total:6} },
    "GET /v1/drivers": { drivers:[{id:"D01",name:"Bikash Tamang",status:"active"},{id:"D02",name:"Sanjay KC",status:"active"}], meta:{total:4} },
    "GET /v1/analytics/revenue": { today:94200, week:621000, month:2800000, growth_pct:12.4 },
  };

  const run = (command) => {
    const c = (command || cmd).trim();
    if (!c) return;
    const entry = { type:"cmd", text:c };
    const [method, path] = c.split(" ");
    const key = `${method.toUpperCase()} ${path}`;
    const resp = MOCK_RESPONSES[key] || { status:200, message:"OK", data:{}, note:"Sandbox response — data mocked" };
    const respEntry = { type:"resp", text:JSON.stringify(resp, null, 2) };
    setLog(l => [...l, entry, respEntry]);
    setCmd("");
    setTimeout(()=>{ if(bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight; }, 50);
  };

  const clear = () => setLog([{ type:"comment", text:"# Sandbox cleared" }]);

  return (
    <div className="page">
      <div className="page-header" style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div>
          <div className="page-title">⚡ API Sandbox</div>
          <div className="page-sub">Test TooFan API calls live. No real data is affected.</div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={clear}>Clear</button>
      </div>

      {/* Presets */}
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
        {presets.map((p,i) => (
          <button key={i} className="btn btn-ghost btn-sm" onClick={()=>run(p.cmd)}>{p.label}</button>
        ))}
      </div>

      <div className="sandbox-terminal">
        <div className="terminal-bar">
          <div className="t-dot" style={{background:"#FF5F57"}} />
          <div className="t-dot" style={{background:"#FFBD2E"}} />
          <div className="t-dot" style={{background:"#28C840"}} />
          <span className="terminal-title">toofan-sandbox — api.toofan.com</span>
          <span className="live-dot" style={{marginLeft:"auto"}} />
        </div>
        <div className="terminal-body" ref={bodyRef} style={{maxHeight:320,overflowY:"auto"}}>
          {log.map((l,i) => (
            <div key={i}>
              {l.type==="comment" && <span className="t-resp">{l.text}</span>}
              {l.type==="cmd" && <span><span className="t-prompt">❯ </span><span className="t-cmd">{l.text}</span></span>}
              {l.type==="resp" && (
                <pre style={{color:"var(--green)",fontSize:"0.68rem",whiteSpace:"pre-wrap",marginLeft:14,marginTop:2}}>
                  {l.text}
                </pre>
              )}
              {"\n"}
            </div>
          ))}
        </div>
        <div className="t-input">
          <span className="t-prompt">❯</span>
          <input
            value={cmd}
            onChange={e=>setCmd(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&run()}
            placeholder="GET /v1/orders  or  POST /v1/orders {...}"
          />
          <button className="t-run" onClick={()=>run()}>Run</button>
        </div>
      </div>
    </div>
  );
}

// ── PAGE: DEPLOY LOG ──────────────────────────────────────
function PageDeployLog() {
  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">📋 Change Log</div>
        <div className="page-sub">Full audit trail of every config change, deployment, and action you've made.</div>
      </div>
      <div className="card">
        {DEPLOY_LOG.map((l,i) => (
          <div key={i} className="log-row">
            <div className="log-dot" style={{background:l.status==="success"?"var(--green)":l.status==="warning"?"var(--yellow)":"var(--red)"}} />
            <div className="log-time">{l.time}</div>
            <div style={{flex:1}}>
              <div className="log-action">{l.action}</div>
              <div className="log-app">{l.app} · by {l.by}</div>
            </div>
            <span className={`badge badge-${l.status==="success"?"green":l.status==="warning"?"yellow":"red"}`}>{l.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MAIN SHELL ────────────────────────────────────────────
const NAV = [
  { id:"overview",   label:"Overview",        icon:"⬡",  section:"PLATFORM"  },
  { id:"khana",      label:"TooFan Khana",    icon:"🍱", section:"APPS"      },
  { id:"driver",     label:"TooFan Driver",   icon:"🛵", section:"APPS"      },
  { id:"business",   label:"Business Portal", icon:"🏪", section:"APPS"      },
  { id:"restaurants",label:"Restaurants",     icon:"🍽️", section:"DATA"      },
  { id:"drivers",    label:"Drivers",         icon:"👤", section:"DATA", badge:"1", badgeColor:"yellow" },
  { id:"partners",   label:"Partners",        icon:"🤝", section:"DATA", badge:"1", badgeColor:"yellow" },
  { id:"apikeys",    label:"API Keys",        icon:"🔑", section:"DEVELOPER" },
  { id:"apidocs",    label:"API Reference",   icon:"📖", section:"DEVELOPER" },
  { id:"webhooks",   label:"Webhooks",        icon:"🔔", section:"DEVELOPER" },
  { id:"sandbox",    label:"Sandbox",         icon:"⚡", section:"DEVELOPER" },
  { id:"deploylog",  label:"Change Log",      icon:"📋", section:"DEVELOPER" },
];

export default function DevPortal() {
  const [page, setPage] = useState("overview");
  const [config, setConfig] = useState(INITIAL_CONFIG);
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg) => { setToastMsg(null); setTimeout(()=>setToastMsg(msg),10); };

  const sections = [...new Set(NAV.map(n=>n.section))];

  const renderPage = () => {
    if (page==="overview")    return <PageOverview config={config} setConfig={setConfig} toast={showToast} />;
    if (page==="khana")       return <PageAppConfig appKey="khana"    config={config} setConfig={setConfig} toast={showToast} />;
    if (page==="driver")      return <PageAppConfig appKey="driver"   config={config} setConfig={setConfig} toast={showToast} />;
    if (page==="business")    return <PageAppConfig appKey="business" config={config} setConfig={setConfig} toast={showToast} />;
    if (page==="restaurants") return <PageRestaurants toast={showToast} />;
    if (page==="drivers")     return <PageDrivers toast={showToast} />;
    if (page==="partners")    return <PagePartners toast={showToast} />;
    if (page==="apikeys")     return <PageAPIKeys toast={showToast} />;
    if (page==="apidocs")     return <PageAPIDocs />;
    if (page==="webhooks")    return <PageWebhooks toast={showToast} />;
    if (page==="sandbox")     return <PageSandbox toast={showToast} />;
    if (page==="deploylog")   return <PageDeployLog />;
  };

  const currentNav = NAV.find(n=>n.id===page);
  const appStatuses = ["khana","driver","business"].map(k=>config[k]);
  const allLive = appStatuses.every(a=>a.active && !a.maintenanceMode);

  return (
    <>
      <style>{css}</style>
      <div className="shell">

        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="logo-mark">dev portal</div>
            <div className="logo-name">Too<span>Fan</span></div>
            <div className="logo-badge">PRIVATE · v2.4</div>
          </div>

          {sections.map(sec => (
            <div key={sec}>
              <div className="sidebar-section">{sec}</div>
              {NAV.filter(n=>n.section===sec).map(n => (
                <button key={n.id} className={`nav-item ${page===n.id?"active":""}`} onClick={()=>setPage(n.id)}>
                  <span className="nav-icon">{n.icon}</span>
                  {n.label}
                  {n.badge && <span className={`nav-badge ${n.badgeColor||""}`}>{n.badge}</span>}
                </button>
              ))}
            </div>
          ))}

          <div className="sidebar-footer">
            <div className="user-pill">
              <div className="user-avatar">N</div>
              <div>
                <div className="user-name">Nabin</div>
                <div className="user-role">super_admin</div>
              </div>
              <div className="online-dot" />
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <main className="main">
          <div className="topbar">
            <div className="topbar-left">
              <span className="breadcrumb">toofan / <span>{currentNav?.section?.toLowerCase()}</span> / <span>{currentNav?.label}</span></span>
            </div>
            <div className="topbar-right">
              <div className="tb-pill">
                <div className={`tb-dot`} style={{background: allLive?"var(--green)":"var(--yellow)", boxShadow:`0 0 5px ${allLive?"var(--green)":"var(--yellow)"}`}} />
                {allLive ? "All Apps Live" : "1 App Paused"}
              </div>
              <div className="tb-pill" style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.68rem",color:"var(--muted)"}}>
                api.toofan.com
              </div>
            </div>
          </div>

          {renderPage()}
        </main>
      </div>

      {toastMsg && <Toast msg={toastMsg} onDone={()=>setToastMsg(null)} />}
    </>
  );
}
