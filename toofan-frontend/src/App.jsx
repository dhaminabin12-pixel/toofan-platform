// ─────────────────────────────────────────────────────────────
//  TooFan  ·  Integrated App
//  Combines customer / driver / business / admin / dev portals
//  Wired to the real Node.js + Prisma + PostgreSQL backend
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Auth, Restaurants, Orders, Drivers, Payments,
  Coupons, Notifications, Admin, Partners, Config,
  setAuth, clearAuth, getUser, isLoggedIn,
} from "./api.js";
import {
  connectSocket, disconnectSocket, getSocket,
  driverGoOnline, driverGoOffline, driverLocationUpdate,
  driverAcceptJob, driverRejectJob,
  onJobOffer, onJobTaken,
  customerTrackOrder,
  onOrderStatusChanged, onDriverAssigned, onDriverLocation,
  onChatMessage,
} from "./socket.js";

// ─── Global style injection ───────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
  *{margin:0;padding:0;box-sizing:border-box;}
  :root{
    --red:#E63946;--orange:#FF6B35;--dark:#0A0A0F;--darker:#06060A;
    --card:#12121A;--card2:#1A1A25;--border:rgba(255,255,255,0.07);
    --text:#F0EBE3;--muted:rgba(240,235,227,0.45);
    --green:#2EC27E;--yellow:#F5C842;--blue:#4A9EFF;--purple:#A855F7;
  }
  body{font-family:'DM Sans',sans-serif;background:var(--dark);color:var(--text);overflow-x:hidden;}
  ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-track{background:var(--darker);}::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px;}
  input,button,select,textarea{font-family:'DM Sans',sans-serif;}

  /* ── auth ── */
  .auth-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;background:radial-gradient(ellipse at 50% 0%,#1a0a0a 0%,var(--dark) 60%);}
  .auth-card{background:var(--card);border:1px solid var(--border);border-radius:18px;padding:28px 24px;width:100%;max-width:380px;}
  .auth-logo{font-family:'Syne',sans-serif;font-weight:800;font-size:1.5rem;color:var(--red);margin-bottom:4px;}
  .auth-sub{font-size:0.78rem;color:var(--muted);margin-bottom:22px;}
  .auth-tabs{display:flex;gap:0;border:1px solid var(--border);border-radius:9px;overflow:hidden;margin-bottom:20px;}
  .auth-tab{flex:1;padding:8px;font-size:0.78rem;font-weight:500;border:none;background:none;color:var(--muted);cursor:pointer;transition:all 0.2s;}
  .auth-tab.active{background:var(--red);color:white;}
  .form-group{margin-bottom:13px;}
  .form-label{font-size:0.7rem;color:var(--muted);font-weight:500;margin-bottom:5px;display:block;letter-spacing:0.5px;}
  .form-input{width:100%;padding:10px 12px;background:var(--card2);border:1px solid var(--border);border-radius:9px;font-size:0.85rem;color:var(--text);outline:none;transition:border-color 0.2s;}
  .form-input:focus{border-color:var(--red);}
  .form-input select{-webkit-appearance:none;}
  .auth-btn{width:100%;padding:12px;background:var(--red);color:white;border:none;border-radius:10px;font-family:'Syne',sans-serif;font-size:0.9rem;font-weight:700;cursor:pointer;margin-top:5px;transition:opacity 0.2s;}
  .auth-btn:disabled{opacity:0.4;cursor:default;}
  .auth-err{background:rgba(230,57,70,0.1);border:1px solid rgba(230,57,70,0.25);border-radius:8px;padding:8px 11px;font-size:0.75rem;color:var(--red);margin-bottom:12px;}
  .auth-ok{background:rgba(46,194,126,0.1);border:1px solid rgba(46,194,126,0.2);border-radius:8px;padding:8px 11px;font-size:0.75rem;color:var(--green);margin-bottom:12px;}
  .divider{display:flex;align-items:center;gap:8px;margin:14px 0;font-size:0.65rem;color:var(--muted);}
  .divider::before,.divider::after{content:'';flex:1;border-top:1px solid var(--border);}
  select.form-input{background:var(--card2);cursor:pointer;}

  /* ── top bar ── */
  .top-bar{display:flex;align-items:center;background:var(--darker);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:100;padding:0 12px;gap:4px;}
  .top-logo{font-family:'Syne',sans-serif;font-weight:800;font-size:1rem;color:var(--red);padding:14px 10px 14px 0;white-space:nowrap;flex-shrink:0;}
  .top-logo span{color:var(--text);}
  .portal-tabs{display:flex;flex:1;overflow-x:auto;}
  .portal-tab{padding:15px 13px;font-size:0.75rem;font-weight:500;cursor:pointer;color:var(--muted);border:none;background:none;border-bottom:2px solid transparent;white-space:nowrap;transition:all 0.2s;}
  .portal-tab.active{color:var(--text);border-bottom-color:var(--red);}
  .logout-btn{margin-left:auto;flex-shrink:0;padding:6px 12px;background:none;border:1px solid var(--border);border-radius:7px;color:var(--muted);font-size:0.72rem;cursor:pointer;white-space:nowrap;}
  .logout-btn:hover{border-color:var(--red);color:var(--red);}

  /* ── shared card/section ── */
  .screen{min-height:calc(100vh - 51px);}
  .section-pad{padding:13px 14px;}
  .page-title{font-family:'Syne',sans-serif;font-size:1rem;font-weight:800;margin-bottom:3px;}
  .page-sub{font-size:0.72rem;color:var(--muted);margin-bottom:16px;}
  .card{background:var(--card);border:1px solid var(--border);border-radius:13px;padding:13px;margin-bottom:10px;}
  .card-title{font-size:0.6rem;font-weight:700;color:var(--muted);letter-spacing:1px;text-transform:uppercase;margin-bottom:9px;}
  .row{display:flex;align-items:center;justify-content:space-between;}
  .tag{font-size:0.6rem;font-weight:700;padding:3px 7px;border-radius:5px;letter-spacing:0.5px;text-transform:uppercase;}
  .tag-green{background:rgba(46,194,126,0.12);color:var(--green);border:1px solid rgba(46,194,126,0.2);}
  .tag-blue{background:rgba(74,158,255,0.12);color:var(--blue);border:1px solid rgba(74,158,255,0.2);}
  .tag-yellow{background:rgba(245,200,66,0.12);color:var(--yellow);border:1px solid rgba(245,200,66,0.2);}
  .tag-red{background:rgba(230,57,70,0.1);color:var(--red);border:1px solid rgba(230,57,70,0.2);}
  .tag-muted{background:rgba(255,255,255,0.04);color:var(--muted);border:1px solid var(--border);}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:9px;}
  .kpi-card{background:var(--card);border:1px solid var(--border);border-radius:11px;padding:13px;}
  .kpi-icon{font-size:1.2rem;margin-bottom:5px;}
  .kpi-val{font-family:'Syne',sans-serif;font-size:1.3rem;font-weight:800;}
  .kpi-label{font-size:0.62rem;color:var(--muted);margin-top:2px;}
  .kpi-delta{font-size:0.62rem;font-weight:600;margin-top:4px;}
  .kpi-delta.up{color:var(--green);}.kpi-delta.down{color:var(--red);}

  /* ── restaurant/menu ── */
  .rest-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
  .rest-card{background:var(--card);border:1px solid var(--border);border-radius:13px;overflow:hidden;cursor:pointer;transition:transform 0.15s;}
  .rest-card:hover{transform:translateY(-2px);}
  .rest-img{font-size:2.2rem;background:var(--card2);padding:16px;text-align:center;}
  .rest-body{padding:8px 10px 10px;}
  .rest-name{font-weight:600;font-size:0.82rem;margin-bottom:2px;}
  .rest-meta{font-size:0.63rem;color:var(--muted);}
  .menu-item{display:flex;align-items:center;gap:9px;background:var(--card);border:1px solid var(--border);border-radius:11px;padding:9px 11px;margin-bottom:7px;}
  .item-emoji{font-size:1.5rem;}
  .item-name{font-size:0.82rem;font-weight:500;flex:1;}
  .item-price{font-size:0.78rem;font-weight:600;color:var(--orange);margin-right:7px;}
  .qty-ctrl{display:flex;align-items:center;gap:5px;}
  .qty-btn{width:25px;height:25px;border-radius:5px;border:1px solid var(--border);background:var(--card2);color:var(--text);cursor:pointer;font-size:0.9rem;display:flex;align-items:center;justify-content:center;}
  .qty-num{font-size:0.8rem;font-weight:600;min-width:14px;text-align:center;}
  .add-btn{width:27px;height:27px;border-radius:6px;background:var(--red);border:none;color:white;font-size:1rem;cursor:pointer;font-weight:700;display:flex;align-items:center;justify-content:center;}
  .cart-bar{position:fixed;bottom:0;left:0;right:0;background:var(--red);padding:12px 18px;display:flex;justify-content:space-between;align-items:center;z-index:50;cursor:pointer;}
  .cart-info{font-size:0.78rem;color:white;font-weight:500;}
  .cart-total{font-family:'Syne',sans-serif;font-size:0.88rem;color:white;font-weight:700;}
  .action-btn{width:100%;padding:12px;background:var(--red);color:white;border:none;border-radius:10px;font-family:'Syne',sans-serif;font-size:0.88rem;font-weight:700;cursor:pointer;margin-top:8px;}
  .action-btn:disabled{opacity:0.35;cursor:default;}
  .action-btn.green{background:var(--green);}
  .action-btn.blue{background:var(--blue);}
  .back-btn{width:32px;height:32px;border-radius:50%;background:var(--card2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:0.9rem;flex-shrink:0;}
  .menu-header{display:flex;align-items:center;gap:11px;padding:12px 14px;border-bottom:1px solid var(--border);background:var(--card);}
  .menu-title{font-family:'Syne',sans-serif;font-size:1rem;font-weight:700;}
  .section-title{font-family:'Syne',sans-serif;font-size:0.9rem;font-weight:700;padding:12px 14px 8px;}

  /* ── driver ── */
  .driver-hero{background:linear-gradient(135deg,#0d0a05 0%,var(--dark) 60%);padding:18px 14px;}
  .driver-name{font-family:'Syne',sans-serif;font-size:1.2rem;font-weight:800;}
  .status-toggle{display:flex;align-items:center;gap:6px;background:var(--card);border:1px solid var(--border);border-radius:20px;padding:6px 12px;cursor:pointer;}
  .status-dot{width:8px;height:8px;border-radius:50%;}
  .status-dot.online{background:var(--green);box-shadow:0 0 6px var(--green);}
  .status-dot.offline{background:var(--muted);}
  .driver-stats{display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;margin-top:14px;}
  .stat-card{background:var(--card);border:1px solid var(--border);border-radius:11px;padding:11px 7px;text-align:center;}
  .stat-val{font-family:'Syne',sans-serif;font-size:1.1rem;font-weight:800;color:var(--orange);}
  .stat-lbl{font-size:0.6rem;color:var(--muted);margin-top:2px;}

  /* ── job offer modal ── */
  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:200;display:flex;align-items:flex-end;}
  .modal-sheet{background:var(--card);border-radius:18px 18px 0 0;padding:22px 18px;width:100%;border-top:1px solid var(--border);}
  .modal-title{font-family:'Syne',sans-serif;font-size:1.1rem;font-weight:800;margin-bottom:14px;text-align:center;}
  .modal-row{display:flex;gap:8px;margin-top:14px;}
  .accept-btn{flex:1;padding:13px;background:var(--green);color:white;border:none;border-radius:10px;font-weight:700;font-size:0.88rem;cursor:pointer;}
  .reject-btn{flex:1;padding:13px;background:var(--card2);color:var(--muted);border:1px solid var(--border);border-radius:10px;font-weight:600;font-size:0.88rem;cursor:pointer;}

  /* ── tracking ── */
  .track-stages{display:flex;flex-direction:column;gap:0;}
  .track-stage{display:flex;gap:12px;padding:10px 0;}
  .stage-line{display:flex;flex-direction:column;align-items:center;}
  .stage-dot{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.9rem;border:2px solid var(--border);background:var(--card2);flex-shrink:0;}
  .stage-dot.done{background:var(--green);border-color:var(--green);}
  .stage-dot.active{background:var(--red);border-color:var(--red);box-shadow:0 0 10px rgba(230,57,70,0.4);}
  .stage-connector{width:2px;flex:1;background:var(--border);margin:3px auto;}
  .stage-connector.done{background:var(--green);}
  .stage-info{padding-top:4px;}
  .stage-label{font-size:0.82rem;font-weight:600;}
  .stage-sub{font-size:0.68rem;color:var(--muted);margin-top:2px;}

  /* ── chat ── */
  .chat-wrap{display:flex;flex-direction:column;height:280px;}
  .chat-msgs{flex:1;overflow-y:auto;padding:10px;display:flex;flex-direction:column;gap:7px;}
  .bubble{max-width:74%;padding:7px 11px;border-radius:11px;font-size:0.78rem;line-height:1.4;}
  .bubble.them{background:var(--card2);align-self:flex-start;border-radius:11px 11px 11px 3px;}
  .bubble.me{background:var(--red);align-self:flex-end;border-radius:11px 11px 3px 11px;}
  .bubble-time{font-size:0.56rem;color:var(--muted);margin-top:2px;}
  .chat-input-row{display:flex;gap:7px;padding:9px;border-top:1px solid var(--border);}
  .chat-input{flex:1;background:var(--card2);border:1px solid var(--border);border-radius:18px;padding:7px 13px;font-size:0.8rem;color:var(--text);outline:none;}
  .chat-send{width:32px;height:32px;border-radius:50%;background:var(--red);border:none;color:white;cursor:pointer;display:flex;align-items:center;justify-content:center;}

  /* ── admin ── */
  .admin-tabs{display:flex;border-bottom:1px solid var(--border);padding:0 13px;gap:2px;overflow-x:auto;}
  .admin-tab{padding:9px 13px;font-size:0.72rem;font-weight:500;cursor:pointer;color:var(--muted);border:none;background:none;border-bottom:2px solid transparent;white-space:nowrap;}
  .admin-tab.active{color:var(--blue);border-bottom-color:var(--blue);}
  .order-row{background:var(--card);border:1px solid var(--border);border-radius:11px;padding:11px;margin-bottom:7px;}
  .order-id{font-size:0.7rem;font-weight:700;color:var(--blue);}
  .order-detail{font-size:0.7rem;color:var(--muted);margin-top:3px;}

  /* ── biz ── */
  .biz-wrap{background:#FAFAF7;min-height:100vh;color:#0D0D0D;font-family:'DM Sans',sans-serif;}
  .biz-header{background:white;border-bottom:1px solid #E8E5E0;padding:14px 18px;display:flex;align-items:center;justify-content:space-between;}
  .biz-logo{font-family:'Syne',sans-serif;font-weight:800;font-size:1.1rem;color:#E63946;}
  .biz-tabs{display:flex;gap:2px;border-bottom:1px solid #E8E5E0;padding:0 16px;background:white;overflow-x:auto;}
  .biz-tab{padding:10px 14px;font-size:0.75rem;font-weight:500;cursor:pointer;color:#888;border:none;background:none;border-bottom:2px solid transparent;white-space:nowrap;}
  .biz-tab.active{color:#E63946;border-bottom-color:#E63946;}
  .biz-card{background:white;border:1px solid #E8E5E0;border-radius:13px;padding:14px;margin-bottom:10px;}
  .biz-kpi{text-align:center;background:white;border:1px solid #E8E5E0;border-radius:13px;padding:14px;}
  .biz-kpi-val{font-family:'Syne',sans-serif;font-size:1.6rem;font-weight:800;color:#0D0D0D;}
  .biz-kpi-lbl{font-size:0.65rem;color:#888;margin-top:2px;}

  /* ── dev portal ── */
  .dev-wrap{display:flex;height:100vh;background:#0A0A0F;overflow:hidden;}
  .dev-sidebar{width:200px;flex-shrink:0;background:#06060A;border-right:1px solid var(--border);display:flex;flex-direction:column;overflow-y:auto;}
  .dev-logo{font-family:'Syne',sans-serif;font-weight:800;font-size:0.95rem;color:var(--red);padding:16px 14px;border-bottom:1px solid var(--border);}
  .dev-section{font-size:0.55rem;font-weight:700;color:var(--muted);letter-spacing:1.5px;padding:14px 14px 5px;text-transform:uppercase;}
  .dev-nav-item{display:flex;align-items:center;gap:8px;padding:8px 14px;font-size:0.75rem;color:var(--muted);cursor:pointer;border:none;background:none;width:100%;text-align:left;transition:all 0.15s;}
  .dev-nav-item:hover{color:var(--text);background:rgba(255,255,255,0.03);}
  .dev-nav-item.active{color:var(--text);background:rgba(230,57,70,0.08);border-left:2px solid var(--red);}
  .dev-content{flex:1;overflow-y:auto;padding:20px;}
  .dev-title{font-family:'Syne',sans-serif;font-size:1.1rem;font-weight:800;margin-bottom:16px;}
  .dev-toggle-row{display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);}
  .dev-toggle-label{font-size:0.82rem;}
  .dev-toggle-sub{font-size:0.65rem;color:var(--muted);margin-top:2px;}
  .toggle{width:40px;height:22px;border-radius:11px;border:none;cursor:pointer;position:relative;transition:background 0.2s;flex-shrink:0;}
  .toggle.on{background:var(--green);}
  .toggle.off{background:var(--border);}
  .toggle::after{content:'';position:absolute;top:3px;width:16px;height:16px;background:white;border-radius:50%;transition:left 0.2s;}
  .toggle.on::after{left:21px;}.toggle.off::after{left:3px;}
  .config-input{background:var(--card2);border:1px solid var(--border);border-radius:7px;padding:7px 10px;font-size:0.8rem;color:var(--text);outline:none;width:100px;text-align:right;}
  .config-input:focus{border-color:var(--blue);}

  /* ── notifications ── */
  .notif-item{display:flex;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);}
  .notif-dot{width:7px;height:7px;border-radius:50%;background:var(--red);flex-shrink:0;margin-top:5px;}
  .notif-text{font-size:0.78rem;line-height:1.5;}
  .notif-time{font-size:0.62rem;color:var(--muted);margin-top:2px;}

  /* ── misc ── */
  .spinner{display:inline-block;width:20px;height:20px;border:2px solid var(--border);border-top-color:var(--red);border-radius:50%;animation:spin 0.7s linear infinite;}
  @keyframes spin{to{transform:rotate(360deg)}}
  .loading-screen{min-height:100vh;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;color:var(--muted);}
  .toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:var(--card);border:1px solid var(--border);border-radius:10px;padding:10px 16px;font-size:0.78rem;z-index:300;white-space:nowrap;box-shadow:0 4px 16px rgba(0,0,0,0.5);}
  .toast.ok{border-color:rgba(46,194,126,0.3);color:var(--green);}
  .toast.err{border-color:rgba(230,57,70,0.3);color:var(--red);}
`;

// ─── Toast ────────────────────────────────────────────────────
function Toast({ msg, type }) {
  if (!msg) return null;
  return <div className={`toast ${type}`}>{msg}</div>;
}
function useToast() {
  const [toast, setToast] = useState(null);
  const show = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };
  return [toast, show];
}

// ─── Auth Screen ──────────────────────────────────────────────
function AuthScreen({ onLogin }) {
  const [mode, setMode]       = useState("login"); // login | register | otp
  const [phone, setPhone]     = useState("");
  const [password, setPass]   = useState("");
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [role, setRole]       = useState("CUSTOMER");
  const [otp, setOtp]         = useState("");
  const [otpPurpose, setPurpose] = useState("REGISTRATION");
  const [err, setErr]         = useState("");
  const [ok, setOk]           = useState("");
  const [busy, setBusy]       = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setErr(""); setOk("");
    setBusy(true);
    try {
      if (mode === "login") {
        const d = await Auth.login(phone, password);
        setAuth({ token: d.token, refreshToken: d.refreshToken, user: d.user });
        onLogin(d.user);
      } else if (mode === "register") {
        await Auth.sendOtp(phone);
        setPurpose("REGISTRATION");
        setMode("otp");
        setOk("OTP sent to " + phone);
      } else if (mode === "otp") {
        const d = await Auth.verifyOtp(phone, otp, otpPurpose);
        if (otpPurpose === "REGISTRATION") {
          const r = await Auth.register(name, phone, email, password, role);
          setAuth({ token: r.token, refreshToken: r.refreshToken, user: r.user });
          onLogin(r.user);
        } else {
          setOk("Phone verified"); setMode("login");
        }
      }
    } catch (ex) {
      setErr(ex.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">🌪️ TooFan</div>
        <div className="auth-sub">Kathmandu&apos;s fastest delivery platform</div>

        {mode !== "otp" && (
          <div className="auth-tabs">
            <button className={`auth-tab ${mode === "login" ? "active" : ""}`} onClick={() => { setMode("login"); setErr(""); setOk(""); }}>Sign In</button>
            <button className={`auth-tab ${mode === "register" ? "active" : ""}`} onClick={() => { setMode("register"); setErr(""); setOk(""); }}>Register</button>
          </div>
        )}

        {err && <div className="auth-err">{err}</div>}
        {ok  && <div className="auth-ok">{ok}</div>}

        <form onSubmit={handle}>
          {mode === "register" && (
            <>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="Aarav Sharma" required />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="aarav@email.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-input" value={role} onChange={e => setRole(e.target.value)}>
                  <option value="CUSTOMER">Customer</option>
                  <option value="DRIVER">Driver</option>
                  <option value="RESTAURANT_OWNER">Restaurant Owner</option>
                </select>
              </div>
            </>
          )}

          {mode !== "otp" && (
            <>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input className="form-input" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="98XXXXXXXX" required />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-input" type="password" value={password} onChange={e => setPass(e.target.value)} placeholder="••••••••" required />
              </div>
            </>
          )}

          {mode === "otp" && (
            <div className="form-group">
              <label className="form-label">Enter OTP sent to {phone}</label>
              <input className="form-input" value={otp} onChange={e => setOtp(e.target.value)} placeholder="6-digit code" maxLength={6} required />
            </div>
          )}

          <button className="auth-btn" disabled={busy} type="submit">
            {busy ? "..." : mode === "login" ? "Sign In" : mode === "register" ? "Send OTP" : "Verify & Continue"}
          </button>
        </form>

        {mode === "login" && (
          <p style={{ fontSize: "0.68rem", color: "var(--muted)", textAlign: "center", marginTop: "14px" }}>
            Test: 9888888888 / customer123 &nbsp;|&nbsp; 9800000000 / admin123
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Customer Portal ──────────────────────────────────────────
const MENU_FALLBACK = {};
const REST_FALLBACK = [
  { id: 1, name: "Momo House", cuisine: "Nepali", rating: 4.8, estimatedTime: "20-30", imageUrl: "🥟" },
  { id: 2, name: "Dal Bhat Palace", cuisine: "Traditional", rating: 4.6, estimatedTime: "25-35", imageUrl: "🍛" },
];

function CustomerPortal({ user, socket }) {
  const [screen, setScreen]     = useState("home"); // home | menu | checkout | tracking | history
  const [restaurants, setRests] = useState([]);
  const [activeRest, setRest]   = useState(null);
  const [menuItems, setMenu]    = useState([]);
  const [cart, setCart]         = useState({});
  const [activeOrder, setActiveOrder] = useState(null);
  const [orderHistory, setHistory]    = useState([]);
  const [chatMsgs, setChat]     = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [driverPos, setDriverPos] = useState(null);
  const [toast, showToast]      = useToast();
  const [busy, setBusy]         = useState(false);
  const [payMethod, setPayMethod] = useState("CASH");
  const [coupon, setCoupon]     = useState("");
  const [discount, setDiscount] = useState(0);
  const [bnav, setBnav]         = useState("home");

  useEffect(() => {
    Restaurants.list().then(d => setRests(Array.isArray(d) ? d : REST_FALLBACK)).catch(() => setRests(REST_FALLBACK));
    Orders.list({ limit: 10 }).then(d => setHistory(Array.isArray(d) ? d : [])).catch(() => {});
    Orders.active().then(d => {
      if (d && d.id) { setActiveOrder(d); setScreen("tracking"); }
    }).catch(() => {});
  }, []);

  // Socket: order tracking
  useEffect(() => {
    if (!socket || !activeOrder) return;
    customerTrackOrder(activeOrder.id);
    const off1 = onOrderStatusChanged(d => setActiveOrder(o => ({ ...o, ...d })));
    const off2 = onDriverAssigned(d => setActiveOrder(o => ({ ...o, driver: d.driver })));
    const off3 = onDriverLocation(d => setDriverPos(d));
    const off4 = onChatMessage(d => setChat(c => [...c, { from: "driver", text: d.message, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]));
    return () => { off1(); off2(); off3(); off4(); };
  }, [socket, activeOrder?.id]);

  const openMenu = async (rest) => {
    setRest(rest);
    setCart({});
    try {
      const d = await Restaurants.get(rest.id);
      // Backend returns menuCategories[].items — flatten to a single list
      const items = d.menuCategories?.flatMap(c => c.items) ?? d.menuItems ?? d.menu ?? [];
      setMenu(items);
    } catch {
      setMenu(MENU_FALLBACK[rest.id] || []);
    }
    setScreen("menu");
  };

  const adjust = (item, delta) => {
    setCart(c => {
      const qty = (c[item.id]?.qty || 0) + delta;
      if (qty <= 0) { const n = { ...c }; delete n[item.id]; return n; }
      return { ...c, [item.id]: { ...item, qty } };
    });
  };

  const cartItems  = Object.values(cart);
  const cartCount  = cartItems.reduce((s, i) => s + i.qty, 0);
  const subtotal   = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
  const delivFee   = subtotal > 0 ? 50 : 0;
  const total      = Math.max(0, subtotal - discount) + delivFee;

  const applyCoupon = async () => {
    try {
      const d = await Coupons.validate(coupon);
      // Compute discount locally from the coupon definition
      let amt = d.type === "pct"
        ? Math.round(subtotal * d.value / 100)
        : d.value;
      if (d.maxDiscount) amt = Math.min(amt, d.maxDiscount);
      setDiscount(amt);
      showToast(`Coupon applied! -रू${amt}`, "ok");
    } catch (ex) {
      showToast(ex.message || "Invalid coupon", "err");
    }
  };

  const placeOrder = async () => {
    setBusy(true);
    try {
      const d = await Orders.place({
        restaurantId: activeRest.id,
        items: cartItems.map(i => ({ menuItemId: i.id, quantity: i.qty })),
        paymentMethod: payMethod,
        ...(coupon && { couponCode: coupon }),
      });
      setActiveOrder(d);
      setCart({});
      setDiscount(0);
      setCoupon("");
      setScreen("tracking");
      showToast("Order placed!", "ok");
    } catch (ex) {
      showToast(ex.message || "Order failed", "err");
    } finally {
      setBusy(false);
    }
  };

  const sendChat = async () => {
    if (!chatInput.trim() || !activeOrder) return;
    const msg = chatInput.trim();
    setChatInput("");
    setChat(c => [...c, { from: "me", text: msg, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
    try { await Orders.sendChat(activeOrder.id, msg); } catch {}
  };

  // Load chat history when on tracking screen
  useEffect(() => {
    if (screen === "tracking" && activeOrder?.id) {
      Orders.chat(activeOrder.id).then(d => {
        if (Array.isArray(d)) setChat(d.map(m => ({ from: m.senderRole === "CUSTOMER" ? "me" : "driver", text: m.message, time: m.createdAt })));
      }).catch(() => {});
    }
  }, [screen, activeOrder?.id]);

  const STAGE_DATA = [
    { key: "PENDING",    label: "Order Confirmed", icon: "✅", sub: "Restaurant received your order" },
    { key: "PREPARING",  label: "Preparing", icon: "🍳", sub: "Kitchen is working on it" },
    { key: "PICKED_UP",  label: "Picked Up", icon: "🛵", sub: "Driver is on the way" },
    { key: "DELIVERED",  label: "Delivered!", icon: "🎉", sub: "Enjoy your meal" },
  ];
  const stageIdx = activeOrder ? STAGE_DATA.findIndex(s => s.key === activeOrder.status) : -1;

  // ── Render ─────────────────────────────────────────────────
  if (screen === "menu" && activeRest) return (
    <div className="screen">
      <div className="menu-header">
        <button className="back-btn" onClick={() => setScreen("home")}>←</button>
        <div>
          <div className="menu-title">{activeRest.imageUrl || activeRest.img || "🍽️"} {activeRest.name}</div>
          <div style={{ fontSize: "0.65rem", color: "var(--muted)" }}>⭐ {activeRest.rating} · {activeRest.prepTimeMin || activeRest.estimatedTime || activeRest.time} min</div>
        </div>
      </div>
      <div style={{ padding: "9px 13px", paddingBottom: cartCount ? "80px" : "20px" }}>
        {menuItems.map(item => (
          <div className="menu-item" key={item.id}>
            <span className="item-emoji">{item.imageUrl || "🍽️"}</span>
            <span className="item-name">{item.name}</span>
            <span className="item-price">रू{item.price}</span>
            {cart[item.id] ? (
              <div className="qty-ctrl">
                <button className="qty-btn" onClick={() => adjust(item, -1)}>−</button>
                <span className="qty-num">{cart[item.id].qty}</span>
                <button className="qty-btn" onClick={() => adjust(item, 1)}>+</button>
              </div>
            ) : (
              <button className="add-btn" onClick={() => adjust(item, 1)}>+</button>
            )}
          </div>
        ))}
        {menuItems.length === 0 && <p style={{ color: "var(--muted)", fontSize: "0.8rem", padding: "20px 0" }}>Loading menu...</p>}
      </div>
      {cartCount > 0 && (
        <div className="cart-bar" onClick={() => setScreen("checkout")}>
          <span className="cart-info">{cartCount} item{cartCount > 1 ? "s" : ""}</span>
          <span className="cart-total">View Cart · रू{subtotal}</span>
        </div>
      )}
      <Toast {...(toast || {})} />
    </div>
  );

  if (screen === "checkout") return (
    <div className="screen">
      <div className="menu-header">
        <button className="back-btn" onClick={() => setScreen("menu")}>←</button>
        <div className="menu-title">Checkout</div>
      </div>
      <div style={{ padding: "13px", paddingBottom: "30px" }}>
        <div className="card">
          <div className="card-title">Your Order</div>
          {cartItems.map(i => (
            <div className="row" key={i.id} style={{ padding: "4px 0", fontSize: "0.8rem" }}>
              <span>{i.name} × {i.qty}</span>
              <span style={{ color: "var(--orange)" }}>रू{i.price * i.qty}</span>
            </div>
          ))}
          <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "8px 0" }} />
          <div className="row" style={{ fontSize: "0.75rem", color: "var(--muted)" }}><span>Subtotal</span><span>रू{subtotal}</span></div>
          {discount > 0 && <div className="row" style={{ fontSize: "0.75rem", color: "var(--green)" }}><span>Discount</span><span>-रू{discount}</span></div>}
          <div className="row" style={{ fontSize: "0.75rem", color: "var(--muted)" }}><span>Delivery Fee</span><span>रू{delivFee}</span></div>
          <div className="row" style={{ fontWeight: 700, marginTop: "5px" }}><span>Total</span><span style={{ color: "var(--orange)" }}>रू{total}</span></div>
        </div>

        <div className="card">
          <div className="card-title">Coupon</div>
          <div style={{ display: "flex", gap: "7px" }}>
            <input className="form-input" style={{ flex: 1 }} placeholder="TOOFAN50" value={coupon} onChange={e => setCoupon(e.target.value.toUpperCase())} />
            <button className="action-btn green" style={{ width: "auto", padding: "0 14px", marginTop: 0 }} onClick={applyCoupon}>Apply</button>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Payment Method</div>
          {["CASH", "WALLET", "ESEWA", "KHALTI"].map(m => (
            <label key={m} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "5px 0", cursor: "pointer", fontSize: "0.8rem" }}>
              <input type="radio" value={m} checked={payMethod === m} onChange={() => setPayMethod(m)} />
              {m}
            </label>
          ))}
        </div>

        <button className="action-btn" disabled={busy || cartCount === 0} onClick={placeOrder}>
          {busy ? "Placing..." : `Place Order · रू${total}`}
        </button>
      </div>
      <Toast {...(toast || {})} />
    </div>
  );

  if (screen === "tracking" && activeOrder) return (
    <div className="screen">
      <div className="menu-header">
        <button className="back-btn" onClick={() => setScreen("home")}>←</button>
        <div className="menu-title">Order #{activeOrder.id?.toString().slice(-4) || "..."}</div>
      </div>
      <div style={{ padding: "13px", paddingBottom: "20px" }}>
        <div className="card">
          <div className="card-title">Order Status</div>
          <div className="track-stages">
            {STAGE_DATA.map((s, i) => (
              <div className="track-stage" key={s.key}>
                <div className="stage-line">
                  <div className={`stage-dot ${i < stageIdx ? "done" : i === stageIdx ? "active" : ""}`}>
                    {i <= stageIdx ? s.icon : "○"}
                  </div>
                  {i < STAGE_DATA.length - 1 && <div className={`stage-connector ${i < stageIdx ? "done" : ""}`} style={{ height: "24px" }} />}
                </div>
                <div className="stage-info">
                  <div className="stage-label" style={{ color: i === stageIdx ? "var(--text)" : i < stageIdx ? "var(--green)" : "var(--muted)" }}>{s.label}</div>
                  {i === stageIdx && <div className="stage-sub">{s.sub}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {activeOrder.driver && (
          <div className="card">
            <div className="card-title">Your Driver</div>
            <div className="row">
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>{activeOrder.driver.user?.name || "Driver"}</div>
                <div style={{ fontSize: "0.68rem", color: "var(--muted)" }}>⭐ {activeOrder.driver.rating || "—"} · {activeOrder.driver.vehicleType || "Motorcycle"}</div>
              </div>
              <a href={`tel:${activeOrder.driver.user?.phone}`} style={{ background: "var(--green)", color: "white", padding: "7px 14px", borderRadius: "8px", fontSize: "0.75rem", fontWeight: 700, textDecoration: "none" }}>Call</a>
            </div>
            {driverPos && <div style={{ fontSize: "0.68rem", color: "var(--muted)", marginTop: "6px" }}>📍 {driverPos.lat?.toFixed(4)}, {driverPos.lng?.toFixed(4)}</div>}
          </div>
        )}

        <div className="card">
          <div className="card-title">Chat with Driver</div>
          <div className="chat-wrap">
            <div className="chat-msgs">
              {chatMsgs.length === 0 && <p style={{ color: "var(--muted)", fontSize: "0.75rem" }}>No messages yet</p>}
              {chatMsgs.map((m, i) => (
                <div key={i}>
                  <div className={`bubble ${m.from === "me" ? "me" : "them"}`}>{m.text}</div>
                  <div className="bubble-time" style={{ textAlign: m.from === "me" ? "right" : "left" }}>{m.time}</div>
                </div>
              ))}
            </div>
            <div className="chat-input-row">
              <input className="chat-input" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Message driver..." onKeyDown={e => e.key === "Enter" && sendChat()} />
              <button className="chat-send" onClick={sendChat}>➤</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (screen === "history") return (
    <div className="screen">
      <div style={{ padding: "16px 14px" }}>
        <div className="page-title">Order History</div>
        <div className="page-sub">Your past orders</div>
        {orderHistory.map(o => (
          <div className="card" key={o.id}>
            <div className="row">
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.82rem" }}>{o.restaurant?.name || "Restaurant"}</div>
                <div style={{ fontSize: "0.68rem", color: "var(--muted)", marginTop: "2px" }}>
                  {o.items?.map(i => i.menuItem?.name).join(", ") || "Items"}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 700, color: "var(--orange)", fontSize: "0.88rem" }}>रू{o.totalAmount || o.total}</div>
                <span className={`tag ${o.status === "DELIVERED" ? "tag-green" : o.status === "CANCELLED" ? "tag-red" : "tag-blue"}`}>{o.status}</span>
              </div>
            </div>
          </div>
        ))}
        {orderHistory.length === 0 && <p style={{ color: "var(--muted)", fontSize: "0.8rem" }}>No orders yet. Order something delicious!</p>}
      </div>
    </div>
  );

  // Home screen
  return (
    <div className="screen" style={{ paddingBottom: "70px" }}>
      <div style={{ padding: "18px 14px 14px", background: "linear-gradient(135deg,#1a0a0a 0%,var(--dark) 60%)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ fontSize: "0.7rem", color: "var(--muted)" }}>Namaste, {user.name?.split(" ")[0]} 👋</div>
        <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: "1.3rem", lineHeight: 1.1, margin: "2px 0 12px" }}>
          What are you <span style={{ color: "var(--red)" }}>craving</span>?
        </div>
      </div>

      <div className="section-title">Restaurants Near You</div>
      <div style={{ padding: "0 14px 14px" }} className="rest-grid">
        {restaurants.map(r => (
          <div className="rest-card" key={r.id} onClick={() => openMenu(r)}>
            <div className="rest-img">{r.imageUrl || r.img || "🍽️"}</div>
            <div className="rest-body">
              <div className="rest-name">{r.name}</div>
              <div className="rest-meta">⭐ {r.rating} · {r.prepTimeMin || r.estimatedTime || r.time} min</div>
              {(r.cuisineType || r.cuisine) && <div className="rest-meta">{r.cuisineType || r.cuisine}</div>}
            </div>
          </div>
        ))}
        {restaurants.length === 0 && (
          <div style={{ gridColumn: "1/-1", textAlign: "center", color: "var(--muted)", padding: "30px 0", fontSize: "0.8rem" }}>
            <div className="spinner" style={{ margin: "0 auto 10px" }} /> Loading restaurants...
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "var(--darker)", borderTop: "1px solid var(--border)", display: "flex", zIndex: 90 }}>
        {[["🏠", "home", "Home"], ["🕐", "history", "Orders"]].map(([icon, id, label]) => (
          <button key={id} onClick={() => { setBnav(id); setScreen(id); }} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "9px 4px", cursor: "pointer", fontSize: "0.58rem", color: bnav === id ? "var(--red)" : "var(--muted)", gap: "2px", border: "none", background: "none" }}>
            <span style={{ fontSize: "1.15rem" }}>{icon}</span>{label}
          </button>
        ))}
        {activeOrder && (
          <button onClick={() => { setBnav("tracking"); setScreen("tracking"); }} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "9px 4px", cursor: "pointer", fontSize: "0.58rem", color: bnav === "tracking" ? "var(--orange)" : "var(--muted)", gap: "2px", border: "none", background: "none" }}>
            <span style={{ fontSize: "1.15rem" }}>🛵</span>Track
          </button>
        )}
      </div>
      <Toast {...(toast || {})} />
    </div>
  );
}

// ─── Driver Portal ────────────────────────────────────────────
function DriverPortal({ user, socket }) {
  const [online, setOnline]       = useState(false);
  const [driverData, setDriver]   = useState(null);
  const [earnings, setEarnings]   = useState(null);
  const [trips, setTrips]         = useState([]);
  const [jobOffer, setJobOffer]   = useState(null);
  const [activeOrder, setActive]  = useState(null);
  const [dtab, setDtab]           = useState("home");
  const [toast, showToast]        = useToast();
  const locTimer = useRef(null);

  useEffect(() => {
    Drivers.me().then(setDriver).catch(() => {});
    Drivers.earnings().then(setEarnings).catch(() => {});
    Drivers.trips().then(d => setTrips(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  // Socket: job offers
  useEffect(() => {
    if (!socket) return;
    const off1 = onJobOffer(d => setJobOffer(d));
    const off2 = onJobTaken(() => setJobOffer(null));
    return () => { off1(); off2(); };
  }, [socket]);

  // GPS location update every 10s when online
  useEffect(() => {
    if (online && socket) {
      locTimer.current = setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          p => driverLocationUpdate(p.coords.latitude, p.coords.longitude, activeOrder?.id || null),
          () => driverLocationUpdate(27.7172, 85.3240, activeOrder?.id || null) // Kathmandu fallback
        );
      }, 10000);
    } else {
      clearInterval(locTimer.current);
    }
    return () => clearInterval(locTimer.current);
  }, [online, socket, activeOrder?.id]);

  const toggleOnline = () => {
    if (!online) { driverGoOnline(); showToast("You are now online", "ok"); }
    else { driverGoOffline(); showToast("You are now offline", "err"); }
    setOnline(o => !o);
  };

  const acceptJob = () => {
    driverAcceptJob(jobOffer.orderId);
    setActive(jobOffer);
    setJobOffer(null);
    showToast("Job accepted!", "ok");
  };
  const rejectJob = () => {
    driverRejectJob(jobOffer.orderId);
    setJobOffer(null);
  };

  const markDelivered = async () => {
    if (!activeOrder) return;
    try {
      await Orders.updateStatus(activeOrder.orderId, "DELIVERED");
      setActive(null);
      showToast("Marked as delivered!", "ok");
      Drivers.earnings().then(setEarnings).catch(() => {});
    } catch (ex) {
      showToast(ex.message || "Failed", "err");
    }
  };

  const todayEarning = earnings?.today || 0;
  const weekEarning  = earnings?.week  || 0;
  const weekTarget   = earnings?.weeklyTarget || 5000;

  return (
    <div className="screen">
      {/* Job offer modal */}
      {jobOffer && (
        <div className="modal-overlay">
          <div className="modal-sheet">
            <div className="modal-title">🛵 New Job Offer!</div>
            <div className="card" style={{ margin: 0, marginBottom: 4 }}>
              <div style={{ fontSize: "0.8rem" }}>Order #{jobOffer.orderId?.toString().slice(-4)}</div>
              <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: "4px" }}>
                {jobOffer.restaurantName || "Restaurant"} → Customer
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--muted)" }}>
                Estimated earning: रू{jobOffer.estimatedEarning || 65}
              </div>
            </div>
            <div className="modal-row">
              <button className="reject-btn" onClick={rejectJob}>Reject</button>
              <button className="accept-btn" onClick={acceptJob}>Accept</button>
            </div>
          </div>
        </div>
      )}

      <div className="driver-hero">
        <div className="row">
          <div>
            <div style={{ fontSize: "0.65rem", color: "var(--muted)" }}>Welcome back</div>
            <div className="driver-name">{user.name}</div>
          </div>
          <button className="status-toggle" onClick={toggleOnline}>
            <div className={`status-dot ${online ? "online" : "offline"}`} />
            <span style={{ fontSize: "0.72rem", fontWeight: 500 }}>{online ? "Online" : "Offline"}</span>
          </button>
        </div>
        <div className="driver-stats">
          {[
            ["रू" + todayEarning, "Today"],
            [driverData?.tripsCount || trips.length, "Trips"],
            [driverData?.rating?.toFixed(1) || "—", "Rating"],
          ].map(([val, lbl]) => (
            <div className="stat-card" key={lbl}>
              <div className="stat-val">{val}</div>
              <div className="stat-lbl">{lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)", background: "var(--darker)", padding: "0 10px", overflowX: "auto" }}>
        {[["home", "Overview"], ["earnings", "Earnings"], ["trips", "Trips"]].map(([id, label]) => (
          <button key={id} onClick={() => setDtab(id)} style={{ padding: "10px 13px", fontSize: "0.72rem", fontWeight: 500, cursor: "pointer", color: dtab === id ? "var(--orange)" : "var(--muted)", border: "none", background: "none", borderBottom: dtab === id ? "2px solid var(--orange)" : "2px solid transparent", whiteSpace: "nowrap" }}>
            {label}
          </button>
        ))}
      </div>

      {dtab === "home" && (
        <div style={{ padding: "13px" }}>
          {activeOrder ? (
            <div className="card">
              <div className="card-title">Active Delivery</div>
              <div style={{ fontSize: "0.82rem", fontWeight: 600 }}>Order #{activeOrder.orderId?.toString().slice(-4)}</div>
              <div style={{ fontSize: "0.7rem", color: "var(--muted)", margin: "4px 0 12px" }}>{activeOrder.restaurantName || "Restaurant"} → Customer</div>
              <button className="action-btn green" onClick={markDelivered}>Mark as Delivered</button>
            </div>
          ) : (
            <div className="card" style={{ textAlign: "center" }}>
              <div style={{ fontSize: "2rem", marginBottom: "8px" }}>{online ? "🟢" : "⭕"}</div>
              <div style={{ fontSize: "0.82rem", fontWeight: 600 }}>{online ? "Waiting for orders..." : "You are offline"}</div>
              <div style={{ fontSize: "0.7rem", color: "var(--muted)", marginTop: "4px" }}>{online ? "Job offers will appear here" : "Toggle to go online and start earning"}</div>
            </div>
          )}

          <div className="card">
            <div className="card-title">Weekly Target</div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", marginBottom: "6px" }}>
              <span>रू{weekEarning}</span>
              <span style={{ color: "var(--muted)" }}>of रू{weekTarget}</span>
            </div>
            <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "4px", height: "5px", overflow: "hidden" }}>
              <div style={{ height: "100%", background: "var(--green)", borderRadius: "4px", width: `${Math.min(100, (weekEarning / weekTarget) * 100)}%`, transition: "width 0.5s" }} />
            </div>
          </div>
        </div>
      )}

      {dtab === "earnings" && (
        <div style={{ padding: "13px" }}>
          <div className="card" style={{ background: "linear-gradient(135deg,#0d1a0a,var(--dark))", borderColor: "rgba(46,194,126,0.2)" }}>
            <div style={{ fontSize: "0.6rem", color: "var(--muted)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "4px" }}>Today's Earnings</div>
            <div style={{ fontFamily: "Syne,sans-serif", fontSize: "2rem", fontWeight: 800, color: "var(--green)" }}>रू{todayEarning}</div>
            <div style={{ fontSize: "0.7rem", color: "var(--muted)", marginTop: "4px" }}>Week: रू{weekEarning} · Month: रू{earnings?.month || 0}</div>
          </div>
          {earnings?.breakdown && (
            <div className="card">
              <div className="card-title">Breakdown</div>
              {Object.entries(earnings.breakdown).map(([k, v]) => (
                <div className="row" key={k} style={{ fontSize: "0.78rem", padding: "3px 0" }}>
                  <span style={{ color: "var(--muted)", textTransform: "capitalize" }}>{k}</span>
                  <span style={{ color: "var(--green)", fontWeight: 600 }}>रू{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {dtab === "trips" && (
        <div style={{ padding: "13px" }}>
          {trips.map((t, i) => (
            <div className="card" key={t.id || i}>
              <div className="row">
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.82rem" }}>{t.restaurant?.name || "Order"}</div>
                  <div style={{ fontSize: "0.68rem", color: "var(--muted)", marginTop: "2px" }}>{t.customer?.name || ""} · {t.distanceKm?.toFixed(1) || "—"} km</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, color: "var(--green)", fontSize: "0.88rem" }}>रू{t.driverEarning || t.earn || 0}</div>
                  <div style={{ fontSize: "0.62rem", color: "var(--muted)" }}>{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : ""}</div>
                </div>
              </div>
            </div>
          ))}
          {trips.length === 0 && <p style={{ color: "var(--muted)", fontSize: "0.8rem" }}>No trips yet. Go online to start!</p>}
        </div>
      )}
      <Toast {...(toast || {})} />
    </div>
  );
}

// ─── Admin Portal ─────────────────────────────────────────────
function AdminPortal() {
  const [atab, setAtab]       = useState("overview");
  const [dash, setDash]       = useState(null);
  const [orders, setOrders]   = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [toast, showToast]    = useToast();

  useEffect(() => {
    Admin.dashboard().then(setDash).catch(() => {});
    Admin.orders({ limit: 20 }).then(d => setOrders(Array.isArray(d) ? d : [])).catch(() => {});
    Admin.drivers({ limit: 20 }).then(d => setDrivers(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const kpis = [
    { icon: "📦", val: dash?.stats?.todayOrders ?? "—", label: "Orders Today", delta: dash?.stats?.orderGrowth },
    { icon: "💰", val: dash?.stats?.todayRevenue ? `रू${dash.stats.todayRevenue}` : "—", label: "Revenue Today", delta: dash?.stats?.revenueGrowth },
    { icon: "🛵", val: dash?.stats?.activeDrivers ?? "—", label: "Active Drivers", delta: null },
    { icon: "🏪", val: dash?.stats?.activeRestaurants ?? "—", label: "Restaurants", delta: null },
  ];

  const getStatusClass = s => s === "DELIVERED" ? "tag-green" : s === "CANCELLED" ? "tag-red" : s === "ON_THE_WAY" ? "tag-blue" : "tag-yellow";

  return (
    <div className="screen">
      <div style={{ background: "var(--darker)", borderBottom: "1px solid var(--border)", padding: "13px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontFamily: "Syne,sans-serif", fontSize: "1rem", fontWeight: 800 }}>Admin Panel</div>
        <span className="tag tag-blue">SUPER ADMIN</span>
      </div>

      <div className="admin-tabs">
        {[["overview", "Overview"], ["orders", "Orders"], ["drivers", "Drivers"]].map(([id, label]) => (
          <button key={id} onClick={() => setAtab(id)} className={`admin-tab ${atab === id ? "active" : ""}`}>{label}</button>
        ))}
      </div>

      {atab === "overview" && (
        <div style={{ padding: "13px" }}>
          <div className="grid2">
            {kpis.map(k => (
              <div className="kpi-card" key={k.label}>
                <div className="kpi-icon">{k.icon}</div>
                <div className="kpi-val">{k.val}</div>
                <div className="kpi-label">{k.label}</div>
                {k.delta != null && (
                  <div className={`kpi-delta ${k.delta >= 0 ? "up" : "down"}`}>
                    {k.delta >= 0 ? "▲" : "▼"} {Math.abs(k.delta)}%
                  </div>
                )}
              </div>
            ))}
          </div>
          {dash?.weeklyRevenue && (
            <div className="card" style={{ marginTop: "10px" }}>
              <div className="card-title">Weekly Revenue</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: "68px" }}>
                {dash.weeklyRevenue.map((d, i) => {
                  const max = Math.max(...dash.weeklyRevenue.map(x => x.revenue || x));
                  const h = max > 0 ? ((d.revenue || d) / max) * 100 : 20;
                  return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
                      <div style={{ width: "100%", height: `${h}%`, background: "linear-gradient(180deg,var(--blue),rgba(74,158,255,0.3))", borderRadius: "3px 3px 0 0" }} />
                      <div style={{ fontSize: "0.52rem", color: "var(--muted)" }}>{d.day || ["M","T","W","T","F","S","S"][i]}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {atab === "orders" && (
        <div style={{ padding: "13px" }}>
          {orders.map(o => (
            <div className="order-row" key={o.id}>
              <div className="row">
                <span className="order-id">#{o.id?.toString().slice(-4)}</span>
                <span className={`tag ${getStatusClass(o.status)}`}>{o.status}</span>
              </div>
              <div className="order-detail">{o.customer?.name || "Customer"} · {o.restaurant?.name || "Restaurant"}</div>
              <div style={{ fontSize: "0.7rem", color: "var(--orange)", marginTop: "3px", fontWeight: 600 }}>रू{o.totalAmount}</div>
            </div>
          ))}
          {orders.length === 0 && <p style={{ color: "var(--muted)", fontSize: "0.8rem" }}>Loading orders...</p>}
        </div>
      )}

      {atab === "drivers" && (
        <div style={{ padding: "13px" }}>
          {drivers.map(d => (
            <div className="card" key={d.id}>
              <div className="row">
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.82rem" }}>{d.user?.name || "Driver"}</div>
                  <div style={{ fontSize: "0.68rem", color: "var(--muted)", marginTop: "2px" }}>
                    ⭐ {d.rating?.toFixed(1) || "—"} · {d.tripsCount || 0} trips · {d.vehicleType}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px", alignItems: "flex-end" }}>
                  <span className={`tag ${d.isApproved ? "tag-green" : "tag-yellow"}`}>{d.isApproved ? "Approved" : "Pending"}</span>
                  {!d.isApproved && (
                    <button onClick={async () => {
                      try { await Drivers.approve(d.id); Admin.drivers({ limit: 20 }).then(x => setDrivers(Array.isArray(x) ? x : [])); showToast("Driver approved", "ok"); }
                      catch (ex) { showToast(ex.message, "err"); }
                    }} style={{ fontSize: "0.65rem", background: "var(--green)", color: "white", border: "none", borderRadius: "5px", padding: "3px 8px", cursor: "pointer" }}>
                      Approve
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {drivers.length === 0 && <p style={{ color: "var(--muted)", fontSize: "0.8rem" }}>No drivers found.</p>}
        </div>
      )}
      <Toast {...(toast || {})} />
    </div>
  );
}

// ─── Business Portal ──────────────────────────────────────────
function BusinessPortal({ user }) {
  const [btab, setBtab]       = useState("overview");
  const [partnerData, setPartner] = useState(null);
  const [orders, setOrders]   = useState([]);
  const [toast, showToast]    = useToast();

  useEffect(() => {
    Partners.me().then(setPartner).catch(() => {});
    Orders.list({ limit: 20 }).then(d => setOrders(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const kpis = [
    { val: orders.filter(o => o.status === "DELIVERED").length, label: "Delivered Today", icon: "✅" },
    { val: orders.reduce((s, o) => s + (o.totalAmount || 0), 0), label: "Revenue (रू)", icon: "💰" },
    { val: orders.filter(o => o.status === "PREPARING" || o.status === "PENDING").length, label: "Active Orders", icon: "🍳" },
    { val: (orders.reduce((s, o) => s + (o.rating || 0), 0) / (orders.filter(o => o.rating).length || 1)).toFixed(1), label: "Avg Rating", icon: "⭐" },
  ];

  return (
    <div className="biz-wrap">
      <div className="biz-header">
        <div className="biz-logo">🌪️ TooFan Business</div>
        <div style={{ fontSize: "0.75rem", color: "#888" }}>{partnerData?.restaurant?.name || user.name}</div>
      </div>

      <div className="biz-tabs">
        {[["overview", "Overview"], ["orders", "Orders"]].map(([id, label]) => (
          <button key={id} onClick={() => setBtab(id)} className={`biz-tab ${btab === id ? "active" : ""}`}>{label}</button>
        ))}
      </div>

      {btab === "overview" && (
        <div style={{ padding: "16px" }}>
          <div className="grid2">
            {kpis.map(k => (
              <div className="biz-kpi" key={k.label}>
                <div style={{ fontSize: "1.4rem", marginBottom: "4px" }}>{k.icon}</div>
                <div className="biz-kpi-val">{k.val}</div>
                <div className="biz-kpi-lbl">{k.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {btab === "orders" && (
        <div style={{ padding: "16px" }}>
          {orders.map(o => (
            <div className="biz-card" key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.82rem" }}>#{o.id?.toString().slice(-4)} · {o.customer?.name || "Customer"}</div>
                <div style={{ fontSize: "0.68rem", color: "#888", marginTop: "2px" }}>{o.items?.map(i => i.menuItem?.name).join(", ")}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 700, color: "#E63946" }}>रू{o.totalAmount}</div>
                <div style={{ fontSize: "0.65rem", color: o.status === "DELIVERED" ? "#22c55e" : "#F59E0B", marginTop: "2px" }}>{o.status}</div>
              </div>
            </div>
          ))}
          {orders.length === 0 && <p style={{ color: "#888", fontSize: "0.8rem" }}>No orders yet.</p>}
        </div>
      )}
      <Toast {...(toast || {})} />
    </div>
  );
}

// ─── Dev Portal ───────────────────────────────────────────────
function DevPortalComponent() {
  const [page, setPage]         = useState("config");
  const [config, setConfig]     = useState(null);
  const [surgeZones, setSurge]  = useState([]);
  const [restaurants, setRests] = useState([]);
  const [drivers, setDrivers]   = useState([]);
  const [toast, showToast]      = useToast();

  useEffect(() => {
    Promise.all([
      Admin.getConfig("khana").catch(() => null),
      Admin.surgeZones().catch(() => []),
      Restaurants.list().catch(() => []),
      Admin.drivers({ limit: 50 }).catch(() => []),
    ]).then(([cfg, sz, rests, drvs]) => {
      setConfig(cfg);
      setSurge(Array.isArray(sz) ? sz : []);
      setRests(Array.isArray(rests) ? rests : []);
      setDrivers(Array.isArray(drvs) ? drvs : []);
    });
  }, []);

  const saveConfig = async (app, data) => {
    try {
      await Admin.setConfig(app, data);
      showToast("Config saved", "ok");
    } catch (ex) {
      showToast(ex.message || "Save failed", "err");
    }
  };

  const NAV = [
    { section: "PLATFORM", items: [{ id: "config", icon: "⚙️", label: "App Config" }, { id: "surge", icon: "⚡", label: "Surge Zones" }] },
    { section: "DATA", items: [{ id: "restaurants", icon: "🏪", label: "Restaurants" }, { id: "drivers", icon: "🛵", label: "Drivers" }] },
  ];

  return (
    <div className="dev-wrap">
      <div className="dev-sidebar">
        <div className="dev-logo">🌪️ TooFan Dev</div>
        {NAV.map(n => (
          <div key={n.section}>
            <div className="dev-section">{n.section}</div>
            {n.items.map(item => (
              <button key={item.id} onClick={() => setPage(item.id)} className={`dev-nav-item ${page === item.id ? "active" : ""}`}>
                <span>{item.icon}</span>{item.label}
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="dev-content">
        {page === "config" && (
          <>
            <div className="dev-title">App Config</div>
            {config ? (
              <>
                {Object.entries(config).map(([k, v]) => (
                  <div className="dev-toggle-row" key={k}>
                    <div>
                      <div className="dev-toggle-label">{k}</div>
                      <div className="dev-toggle-sub">{typeof v === "boolean" ? (v ? "Enabled" : "Disabled") : String(v)}</div>
                    </div>
                    {typeof v === "boolean" ? (
                      <button className={`toggle ${v ? "on" : "off"}`} onClick={() => {
                        const updated = { ...config, [k]: !v };
                        setConfig(updated);
                        saveConfig("khana", { [k]: !v });
                      }} />
                    ) : typeof v === "number" ? (
                      <input className="config-input" type="number" value={v} onChange={e => {
                        const updated = { ...config, [k]: Number(e.target.value) };
                        setConfig(updated);
                      }} onBlur={e => saveConfig("khana", { [k]: Number(e.target.value) })} />
                    ) : null}
                  </div>
                ))}
              </>
            ) : <p style={{ color: "var(--muted)", fontSize: "0.8rem" }}>Loading config...</p>}
          </>
        )}

        {page === "surge" && (
          <>
            <div className="dev-title">Surge Zones</div>
            {surgeZones.map(z => (
              <div className="card" key={z.id}>
                <div className="row">
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.82rem" }}>{z.name}</div>
                    <div style={{ fontSize: "0.68rem", color: "var(--muted)", marginTop: "2px" }}>{z.area || z.description}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, color: "var(--orange)" }}>{z.multiplier || z.surge}x</div>
                    <span className={`tag ${z.isActive !== false ? "tag-green" : "tag-muted"}`}>{z.isActive !== false ? "Active" : "Inactive"}</span>
                  </div>
                </div>
              </div>
            ))}
            {surgeZones.length === 0 && <p style={{ color: "var(--muted)", fontSize: "0.8rem" }}>No surge zones configured.</p>}
          </>
        )}

        {page === "restaurants" && (
          <>
            <div className="dev-title">Restaurants ({restaurants.length})</div>
            {restaurants.map(r => (
              <div className="card" key={r.id}>
                <div className="row">
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.82rem" }}>{r.imageUrl || "🍽️"} {r.name}</div>
                    <div style={{ fontSize: "0.68rem", color: "var(--muted)", marginTop: "2px" }}>{r.cuisineType || r.cuisine} · ⭐ {r.rating}</div>
                  </div>
                  <span className={`tag ${r.isOpen !== false ? "tag-green" : "tag-red"}`}>{r.isOpen !== false ? "Open" : "Closed"}</span>
                </div>
              </div>
            ))}
          </>
        )}

        {page === "drivers" && (
          <>
            <div className="dev-title">Drivers ({drivers.length})</div>
            {drivers.map(d => (
              <div className="card" key={d.id}>
                <div className="row">
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.82rem" }}>{d.user?.name}</div>
                    <div style={{ fontSize: "0.68rem", color: "var(--muted)", marginTop: "2px" }}>
                      {d.vehicleType} · ⭐ {d.rating?.toFixed(1)} · {d.tripsCount} trips
                    </div>
                  </div>
                  <span className={`tag ${d.isApproved ? "tag-green" : "tag-yellow"}`}>{d.isApproved ? "Active" : "Pending"}</span>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
      <Toast {...(toast || {})} />
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────
export default function App() {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [portal, setPortal]   = useState("main");
  const [socket, setSocket]   = useState(null);

  // Bootstrap: check existing auth
  useEffect(() => {
    if (isLoggedIn()) {
      Auth.me()
        .then(me => { setUser(me); })
        .catch(() => { clearAuth(); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Connect socket when user logs in
  useEffect(() => {
    if (user) {
      const s = connectSocket();
      setSocket(s);
      return () => disconnectSocket();
    }
  }, [user?.id]);

  // Set default portal per role
  useEffect(() => {
    if (!user) return;
    if (user.role === "DRIVER") setPortal("driver");
    else if (user.role === "RESTAURANT_OWNER") setPortal("business");
    else if (user.role === "SUPER_ADMIN") setPortal("admin");
    else setPortal("main");
  }, [user?.role]);

  const handleLogin = (u) => setUser(u);
  const handleLogout = () => {
    clearAuth();
    disconnectSocket();
    setUser(null);
    setSocket(null);
  };

  if (loading) return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div className="loading-screen">
        <div className="spinner" />
        <div>Loading TooFan...</div>
      </div>
    </>
  );

  if (!user) return (
    <>
      <style>{GLOBAL_CSS}</style>
      <AuthScreen onLogin={handleLogin} />
    </>
  );

  const isAdmin = user.role === "SUPER_ADMIN";
  const isBiz   = user.role === "RESTAURANT_OWNER";
  const isDriver = user.role === "DRIVER";

  // Build portal tabs based on role
  const tabs = [];
  if (!isDriver && !isBiz) tabs.push({ id: "main", label: "🌪️ Khana" });
  if (isDriver)             tabs.push({ id: "driver", label: "🛵 Driver" });
  if (isBiz || isAdmin)     tabs.push({ id: "business", label: "🏪 Business" });
  if (isAdmin)              tabs.push({ id: "admin", label: "📊 Admin" });
  if (isAdmin)              tabs.push({ id: "dev", label: "⚙️ Dev" });

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      {/* Top nav */}
      <div className="top-bar">
        <div className="top-logo">Too<span>Fan</span></div>
        <div className="portal-tabs">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setPortal(t.id)} className={`portal-tab ${portal === t.id ? "active" : ""}`}>
              {t.label}
            </button>
          ))}
        </div>
        <button className="logout-btn" onClick={handleLogout}>Sign Out</button>
      </div>

      {/* Portal content */}
      {portal === "main"     && <CustomerPortal user={user} socket={socket} />}
      {portal === "driver"   && <DriverPortal   user={user} socket={socket} />}
      {portal === "business" && <BusinessPortal user={user} />}
      {portal === "admin"    && <AdminPortal />}
      {portal === "dev"      && <DevPortalComponent />}
    </>
  );
}
