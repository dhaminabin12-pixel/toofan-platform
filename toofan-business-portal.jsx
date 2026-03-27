import { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────
// DESIGN: Clean warm-white light theme with bold
// black typography & saffron-red brand accent.
// Feels premium, trustworthy — like a SaaS product
// you'd actually pay for. Sharp edges, generous
// whitespace, editorial section breaks.
// ─────────────────────────────────────────────

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    tag: null,
    price: { monthly: 999, yearly: 799 },
    color: "#1a1a1a",
    features: [
      "1 outlet (restaurant or fleet)",
      "Up to 200 orders/month",
      "Menu & item management",
      "Basic analytics dashboard",
      "Email support",
      "TooFan branding on receipts",
    ],
    notIncluded: ["Custom branding", "Driver fleet tools", "Priority support"],
  },
  {
    id: "growth",
    name: "Growth",
    tag: "Most Popular",
    price: { monthly: 2499, yearly: 1999 },
    color: "#E63946",
    features: [
      "3 outlets (mix of restaurant + fleet)",
      "Up to 1,000 orders/month",
      "Menu, pricing & promo management",
      "Advanced analytics + revenue reports",
      "Driver fleet tracking & management",
      "Custom branding on customer app",
      "WhatsApp order notifications",
      "Priority email + chat support",
    ],
    notIncluded: ["Multi-city zones", "Dedicated account manager"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tag: "Best Value",
    price: { monthly: null, yearly: null },
    color: "#FF6B35",
    features: [
      "Unlimited outlets & zones",
      "Unlimited orders",
      "Full white-label (your brand, your app)",
      "Multi-city fleet management",
      "Custom integrations (POS, CRM, ERP)",
      "Real-time analytics API access",
      "Dedicated account manager",
      "SLA-backed 24/7 support",
      "Staff training included",
    ],
    notIncluded: [],
  },
];

const TESTIMONIALS = [
  { name: "Ramesh Shrestha", biz: "Shrestha Food Chain · 4 outlets", avatar: "RS", quote: "Within 2 weeks of joining TooFan, our delivery orders tripled. The dashboard is incredibly simple to manage even for non-tech staff.", stars: 5 },
  { name: "Sunita Maharjan", biz: "SpeedRide Logistics · 12 drivers", avatar: "SM", quote: "Managing 12 drivers used to be chaos. Now I can see every driver live, assign orders, and track earnings — all from one screen.", stars: 5 },
  { name: "Prakash Gurung", biz: "MomoKing Franchise · Pokhara", avatar: "PG", quote: "We launched our franchise in Pokhara using TooFan's white-label. Customers think it's our own app. The branding is perfect.", stars: 5 },
];

const FAQS = [
  { q: "Can I manage both a restaurant and a driver fleet under one account?", a: "Yes! TooFan is built specifically for franchise operators. From one dashboard you can manage restaurant outlets, menus, driver fleets, orders, and payouts — all together." },
  { q: "Do my customers need to download a separate app?", a: "On the Growth and Enterprise plans, your customers use a co-branded version of TooFan Khana with your logo and colours. On Starter, TooFan branding is shown." },
  { q: "How does driver payout work?", a: "Drivers earn per delivery. You set the per-km or per-order rate. TooFan auto-calculates their earnings and you approve payouts weekly through the dashboard." },
  { q: "Can I add my own menu items and prices?", a: "Absolutely. You have full control over your menu — add items, set prices, mark items unavailable, run promos, and update photos at any time." },
  { q: "Is there a contract or can I cancel anytime?", a: "Monthly plans can be cancelled anytime with no penalty. Yearly plans are billed upfront and non-refundable but come with a significant discount." },
];

const STEPS = [
  { icon: "📋", title: "Sign Up", desc: "Create your TooFan Business account in under 2 minutes. No credit card needed to start." },
  { icon: "🏪", title: "Set Up Your Outlet", desc: "Add your restaurant or register your driver fleet. Upload menu, set zones, and configure pricing." },
  { icon: "🎨", title: "Customise Your Brand", desc: "Upload your logo and pick your brand colours. Customers see your identity on the app." },
  { icon: "🚀", title: "Go Live", desc: "Your outlet goes live on TooFan instantly. Start receiving orders and tracking drivers the same day." },
];

// ─── STYLES ────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,700;0,9..144,900;1,9..144,300&family=DM+Mono:wght@400;500&family=Outfit:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

  :root {
    --brand: #E63946;
    --brand2: #FF6B35;
    --black: #0D0D0D;
    --ink: #1a1a1a;
    --body: #3d3d3d;
    --muted: #888;
    --line: #e8e4df;
    --bg: #FAFAF7;
    --white: #ffffff;
    --card: #ffffff;
    --yellow: #F5C842;
    --green: #1d9e6a;
    --tag-bg: #fff4f1;
    --tag-color: #E63946;
  }

  html { scroll-behavior: smooth; }
  body { font-family: 'Outfit', sans-serif; background: var(--bg); color: var(--ink); overflow-x: hidden; }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: var(--line); border-radius: 2px; }

  /* ── TOP NAV ── */
  .bp-nav {
    position: sticky; top: 0; z-index: 200;
    background: rgba(250,250,247,0.92); backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--line);
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 24px; height: 56px;
  }
  .bp-logo { font-family: 'Fraunces', serif; font-weight: 900; font-size: 1.25rem; color: var(--black); }
  .bp-logo span { color: var(--brand); }
  .bp-logo sup { font-family: 'Outfit', sans-serif; font-size: 0.55rem; font-weight: 700; color: var(--brand2); letter-spacing: 1px; vertical-align: super; margin-left: 2px; }
  .nav-links { display: flex; gap: 6px; }
  .nav-link { font-size: 0.78rem; font-weight: 500; color: var(--body); padding: 6px 14px; border-radius: 20px; cursor: pointer; border: none; background: none; transition: all 0.2s; }
  .nav-link:hover { background: var(--line); }
  .nav-cta { font-size: 0.8rem; font-weight: 600; background: var(--black); color: white; padding: 8px 18px; border-radius: 20px; cursor: pointer; border: none; transition: all 0.2s; }
  .nav-cta:hover { background: var(--brand); }

  /* ── HERO ── */
  .hero {
    padding: 72px 24px 60px;
    text-align: center;
    position: relative; overflow: hidden;
  }
  .hero::before {
    content: '';
    position: absolute; top: -120px; left: 50%; transform: translateX(-50%);
    width: 600px; height: 600px; border-radius: 50%;
    background: radial-gradient(circle, rgba(230,57,70,0.08) 0%, transparent 70%);
    pointer-events: none;
  }
  .hero-eyebrow {
    display: inline-flex; align-items: center; gap: 6px;
    background: var(--tag-bg); color: var(--tag-color);
    font-size: 0.72rem; font-weight: 700; letter-spacing: 1px;
    padding: 5px 12px; border-radius: 20px; margin-bottom: 24px;
    border: 1px solid rgba(230,57,70,0.15);
    text-transform: uppercase;
  }
  .hero-title {
    font-family: 'Fraunces', serif; font-weight: 900;
    font-size: clamp(2.2rem, 6vw, 3.6rem); line-height: 1.05;
    color: var(--black); margin-bottom: 20px; letter-spacing: -1px;
  }
  .hero-title em { font-style: italic; color: var(--brand); }
  .hero-sub { font-size: 1rem; color: var(--body); max-width: 480px; margin: 0 auto 36px; line-height: 1.7; font-weight: 400; }
  .hero-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
  .btn-primary {
    background: var(--brand); color: white;
    font-family: 'Outfit', sans-serif; font-size: 0.9rem; font-weight: 600;
    padding: 14px 28px; border-radius: 12px; border: none; cursor: pointer;
    transition: all 0.2s; box-shadow: 0 4px 24px rgba(230,57,70,0.3);
  }
  .btn-primary:hover { background: #c62b38; transform: translateY(-1px); }
  .btn-outline {
    background: transparent; color: var(--ink);
    font-family: 'Outfit', sans-serif; font-size: 0.9rem; font-weight: 500;
    padding: 14px 28px; border-radius: 12px; border: 1.5px solid var(--line);
    cursor: pointer; transition: all 0.2s;
  }
  .btn-outline:hover { border-color: var(--ink); background: var(--ink); color: white; }

  .hero-stats {
    display: flex; justify-content: center; gap: 40px; margin-top: 52px;
    padding-top: 32px; border-top: 1px solid var(--line);
  }
  .hero-stat-val { font-family: 'Fraunces', serif; font-size: 2rem; font-weight: 900; color: var(--black); }
  .hero-stat-label { font-size: 0.72rem; color: var(--muted); margin-top: 2px; }

  /* ── SECTION ── */
  .section { padding: 64px 24px; }
  .section-label {
    font-size: 0.68rem; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
    color: var(--brand); margin-bottom: 10px;
  }
  .section-title { font-family: 'Fraunces', serif; font-weight: 900; font-size: clamp(1.6rem, 4vw, 2.4rem); color: var(--black); line-height: 1.1; letter-spacing: -0.5px; margin-bottom: 12px; }
  .section-sub { font-size: 0.92rem; color: var(--body); line-height: 1.7; max-width: 480px; }
  .section-divider { border: none; border-top: 1px solid var(--line); margin: 0 24px; }

  /* ── HOW IT WORKS ── */
  .steps-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 36px; }
  .step-card {
    background: var(--white); border: 1px solid var(--line);
    border-radius: 18px; padding: 22px 20px;
    position: relative; overflow: hidden;
    transition: box-shadow 0.2s, transform 0.2s;
  }
  .step-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.07); transform: translateY(-2px); }
  .step-num {
    font-family: 'DM Mono', monospace; font-size: 0.65rem; font-weight: 500;
    color: var(--muted); margin-bottom: 12px; letter-spacing: 1px;
  }
  .step-icon { font-size: 1.8rem; margin-bottom: 10px; }
  .step-title { font-weight: 700; font-size: 0.92rem; margin-bottom: 6px; color: var(--black); }
  .step-desc { font-size: 0.78rem; color: var(--body); line-height: 1.6; }

  /* ── BENTO FEATURES ── */
  .bento { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 36px; }
  .bento-card {
    background: var(--white); border: 1px solid var(--line);
    border-radius: 18px; padding: 22px 20px;
    transition: box-shadow 0.2s;
  }
  .bento-card:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.06); }
  .bento-card.wide { grid-column: span 2; }
  .bento-card.dark { background: var(--black); border-color: var(--black); }
  .bento-card.red { background: var(--brand); border-color: var(--brand); }
  .bento-icon { font-size: 1.6rem; margin-bottom: 10px; }
  .bento-title { font-weight: 700; font-size: 0.9rem; margin-bottom: 6px; }
  .bento-card.dark .bento-title { color: white; }
  .bento-card.red .bento-title { color: white; }
  .bento-desc { font-size: 0.76rem; line-height: 1.6; color: var(--body); }
  .bento-card.dark .bento-desc { color: rgba(255,255,255,0.55); }
  .bento-card.red .bento-desc { color: rgba(255,255,255,0.75); }
  .bento-tag { display: inline-block; background: var(--tag-bg); color: var(--tag-color); font-size: 0.6rem; font-weight: 700; padding: 3px 8px; border-radius: 6px; letter-spacing: 0.5px; margin-bottom: 8px; text-transform: uppercase; }
  .bento-card.dark .bento-tag { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); }

  /* ── PRICING ── */
  .billing-toggle {
    display: inline-flex; background: var(--line); border-radius: 24px; padding: 4px; margin-bottom: 36px;
  }
  .toggle-btn {
    font-size: 0.8rem; font-weight: 500; padding: 8px 20px; border-radius: 20px;
    border: none; cursor: pointer; transition: all 0.2s; background: transparent; color: var(--body);
  }
  .toggle-btn.active { background: white; color: var(--black); font-weight: 600; box-shadow: 0 1px 4px rgba(0,0,0,0.1); }
  .save-pill { background: #dcfce7; color: var(--green); font-size: 0.6rem; font-weight: 700; padding: 2px 6px; border-radius: 6px; margin-left: 6px; }

  .pricing-grid { display: flex; flex-direction: column; gap: 14px; }
  .price-card {
    background: var(--white); border: 1.5px solid var(--line);
    border-radius: 20px; padding: 24px; position: relative; overflow: hidden;
    transition: box-shadow 0.2s;
  }
  .price-card.featured { border-color: var(--brand); box-shadow: 0 0 0 1px var(--brand), 0 8px 32px rgba(230,57,70,0.12); }
  .price-badge {
    display: inline-block; font-size: 0.6rem; font-weight: 700; letter-spacing: 1px;
    text-transform: uppercase; padding: 4px 10px; border-radius: 8px; margin-bottom: 14px;
  }
  .price-badge.red { background: var(--tag-bg); color: var(--brand); }
  .price-badge.orange { background: #fff7f0; color: var(--brand2); }
  .price-name { font-family: 'Fraunces', serif; font-size: 1.4rem; font-weight: 900; color: var(--black); margin-bottom: 6px; }
  .price-amount { display: flex; align-items: baseline; gap: 4px; margin-bottom: 4px; }
  .price-currency { font-size: 1rem; font-weight: 600; color: var(--body); margin-top: 4px; }
  .price-num { font-family: 'Fraunces', serif; font-size: 2.4rem; font-weight: 900; color: var(--black); }
  .price-per { font-size: 0.75rem; color: var(--muted); }
  .price-custom { font-family: 'Fraunces', serif; font-size: 1.8rem; font-weight: 900; color: var(--brand2); margin-bottom: 4px; }
  .price-divider { border: none; border-top: 1px solid var(--line); margin: 18px 0; }
  .price-features { display: flex; flex-direction: column; gap: 8px; margin-bottom: 22px; }
  .price-feature { display: flex; align-items: flex-start; gap: 8px; font-size: 0.8rem; color: var(--body); line-height: 1.4; }
  .feat-check { color: var(--green); font-size: 0.75rem; margin-top: 1px; flex-shrink: 0; }
  .feat-cross { color: #ccc; font-size: 0.75rem; margin-top: 1px; flex-shrink: 0; }
  .feat-strike { color: #bbb; text-decoration: line-through; }
  .price-btn {
    width: 100%; padding: 13px; border-radius: 12px;
    font-family: 'Outfit', sans-serif; font-size: 0.88rem; font-weight: 600;
    cursor: pointer; border: none; transition: all 0.2s;
  }
  .price-btn.dark { background: var(--black); color: white; }
  .price-btn.dark:hover { background: var(--brand); }
  .price-btn.red { background: var(--brand); color: white; box-shadow: 0 4px 16px rgba(230,57,70,0.3); }
  .price-btn.red:hover { background: #c62b38; }
  .price-btn.outline { background: transparent; color: var(--black); border: 1.5px solid var(--line); }
  .price-btn.outline:hover { border-color: var(--brand2); color: var(--brand2); }

  /* ── TESTIMONIALS ── */
  .testimonials-grid { display: flex; flex-direction: column; gap: 14px; margin-top: 32px; }
  .testi-card { background: var(--white); border: 1px solid var(--line); border-radius: 18px; padding: 22px; }
  .testi-stars { color: #f59e0b; font-size: 0.75rem; margin-bottom: 10px; }
  .testi-quote { font-size: 0.88rem; color: var(--body); line-height: 1.7; font-style: italic; margin-bottom: 16px; }
  .testi-author { display: flex; align-items: center; gap: 10px; }
  .testi-avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, var(--brand), var(--brand2)); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.75rem; color: white; flex-shrink: 0; }
  .testi-name { font-size: 0.82rem; font-weight: 600; color: var(--black); }
  .testi-biz { font-size: 0.7rem; color: var(--muted); }

  /* ── FAQ ── */
  .faq-list { display: flex; flex-direction: column; gap: 0; margin-top: 32px; border: 1px solid var(--line); border-radius: 18px; overflow: hidden; }
  .faq-item { border-bottom: 1px solid var(--line); background: var(--white); }
  .faq-item:last-child { border-bottom: none; }
  .faq-q { display: flex; justify-content: space-between; align-items: center; padding: 18px 20px; cursor: pointer; gap: 12px; }
  .faq-q-text { font-size: 0.88rem; font-weight: 600; color: var(--black); line-height: 1.4; }
  .faq-icon { font-size: 1rem; color: var(--muted); flex-shrink: 0; transition: transform 0.2s; }
  .faq-icon.open { transform: rotate(45deg); color: var(--brand); }
  .faq-a { font-size: 0.82rem; color: var(--body); line-height: 1.7; padding: 0 20px 18px; }

  /* ── SIGNUP FLOW ── */
  .signup-overlay {
    position: fixed; inset: 0; z-index: 500;
    background: rgba(13,13,13,0.7); backdrop-filter: blur(6px);
    display: flex; align-items: flex-end; justify-content: center;
    animation: fadeIn 0.2s ease;
  }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  .signup-sheet {
    background: var(--bg); border-radius: 24px 24px 0 0;
    width: 100%; max-width: 600px; max-height: 92vh;
    overflow-y: auto; padding: 32px 24px 48px;
    animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
  @keyframes slideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
  .sheet-handle { width: 40px; height: 4px; background: var(--line); border-radius: 2px; margin: 0 auto 28px; }
  .sheet-title { font-family: 'Fraunces', serif; font-weight: 900; font-size: 1.6rem; color: var(--black); margin-bottom: 6px; letter-spacing: -0.5px; }
  .sheet-sub { font-size: 0.85rem; color: var(--body); margin-bottom: 28px; }

  .biz-type-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
  .biz-type-card {
    border: 2px solid var(--line); border-radius: 16px; padding: 20px 14px;
    text-align: center; cursor: pointer; transition: all 0.2s; background: white;
  }
  .biz-type-card.selected { border-color: var(--brand); background: var(--tag-bg); }
  .biz-type-icon { font-size: 2rem; margin-bottom: 8px; }
  .biz-type-name { font-size: 0.85rem; font-weight: 700; color: var(--black); }
  .biz-type-desc { font-size: 0.7rem; color: var(--muted); margin-top: 3px; line-height: 1.4; }

  .form-field { margin-bottom: 16px; }
  .form-label { font-size: 0.75rem; font-weight: 600; color: var(--body); margin-bottom: 6px; display: block; letter-spacing: 0.3px; }
  .form-input {
    width: 100%; padding: 12px 14px; border: 1.5px solid var(--line);
    border-radius: 10px; font-family: 'Outfit', sans-serif; font-size: 0.88rem;
    color: var(--black); background: white; outline: none; transition: border-color 0.2s;
  }
  .form-input:focus { border-color: var(--brand); }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .form-select {
    width: 100%; padding: 12px 14px; border: 1.5px solid var(--line);
    border-radius: 10px; font-family: 'Outfit', sans-serif; font-size: 0.88rem;
    color: var(--black); background: white; outline: none; cursor: pointer;
    -webkit-appearance: none; transition: border-color 0.2s;
  }
  .form-select:focus { border-color: var(--brand); }

  .step-progress { display: flex; gap: 8px; margin-bottom: 28px; }
  .prog-dot { flex: 1; height: 3px; border-radius: 2px; background: var(--line); transition: background 0.3s; }
  .prog-dot.done { background: var(--brand); }

  .submit-btn {
    width: 100%; padding: 15px; background: var(--brand); color: white;
    font-family: 'Outfit', sans-serif; font-size: 0.95rem; font-weight: 700;
    border: none; border-radius: 12px; cursor: pointer; transition: all 0.2s;
    margin-top: 8px; box-shadow: 0 4px 20px rgba(230,57,70,0.3);
  }
  .submit-btn:hover { background: #c62b38; }
  .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .back-link { text-align: center; font-size: 0.8rem; color: var(--muted); cursor: pointer; margin-top: 14px; }
  .back-link:hover { color: var(--body); }

  /* ── DASHBOARD ── */
  .dashboard { min-height: 100vh; background: var(--bg); }
  .dash-nav {
    background: white; border-bottom: 1px solid var(--line);
    padding: 0 20px; height: 54px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 100;
  }
  .dash-logo { font-family: 'Fraunces', serif; font-weight: 900; font-size: 1.1rem; }
  .dash-logo span { color: var(--brand); }
  .dash-outlet {
    display: flex; align-items: center; gap: 8px;
    background: var(--bg); border: 1px solid var(--line); border-radius: 20px;
    padding: 5px 12px; font-size: 0.75rem; font-weight: 500; cursor: pointer;
  }
  .outlet-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--green); }

  .dash-tabs { display: flex; gap: 0; border-bottom: 1px solid var(--line); background: white; padding: 0 20px; overflow-x: auto; }
  .dash-tab {
    padding: 12px 16px; font-size: 0.78rem; font-weight: 500; cursor: pointer;
    color: var(--muted); border: none; background: none;
    border-bottom: 2px solid transparent; white-space: nowrap; transition: all 0.2s;
  }
  .dash-tab.active { color: var(--brand); border-bottom-color: var(--brand); font-weight: 600; }

  .dash-body { padding: 20px; }

  .dash-kpis { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
  .dash-kpi {
    background: white; border: 1px solid var(--line); border-radius: 16px; padding: 16px;
    transition: box-shadow 0.2s;
  }
  .dash-kpi:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
  .kpi-label-d { font-size: 0.68rem; color: var(--muted); font-weight: 500; margin-bottom: 6px; letter-spacing: 0.3px; }
  .kpi-val-d { font-family: 'Fraunces', serif; font-size: 1.6rem; font-weight: 900; color: var(--black); }
  .kpi-delta-d { font-size: 0.68rem; font-weight: 600; margin-top: 4px; }
  .kpi-delta-d.up { color: var(--green); }
  .kpi-delta-d.down { color: var(--brand); }

  .dash-section-title { font-size: 0.72rem; font-weight: 700; color: var(--body); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px; }

  .orders-dash { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
  .order-dash-row {
    background: white; border: 1px solid var(--line); border-radius: 14px;
    padding: 14px; display: flex; align-items: center; gap: 12px;
  }
  .order-status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .order-dash-info { flex: 1; }
  .order-dash-id { font-size: 0.72rem; font-weight: 700; color: var(--muted); font-family: 'DM Mono', monospace; }
  .order-dash-customer { font-size: 0.85rem; font-weight: 600; color: var(--black); }
  .order-dash-items { font-size: 0.72rem; color: var(--muted); }
  .order-dash-right { text-align: right; }
  .order-dash-amount { font-size: 0.88rem; font-weight: 700; color: var(--black); }
  .order-dash-status { font-size: 0.65rem; font-weight: 700; margin-top: 2px; }

  .menu-dash { display: flex; flex-direction: column; gap: 8px; }
  .menu-dash-row {
    background: white; border: 1px solid var(--line); border-radius: 14px;
    padding: 12px 14px; display: flex; align-items: center; gap: 12px;
  }
  .menu-item-emoji { font-size: 1.5rem; }
  .menu-item-info { flex: 1; }
  .menu-item-name-d { font-size: 0.85rem; font-weight: 600; }
  .menu-item-meta { font-size: 0.7rem; color: var(--muted); margin-top: 2px; }
  .menu-item-price { font-weight: 700; color: var(--brand2); font-size: 0.88rem; }
  .avail-toggle {
    width: 36px; height: 20px; border-radius: 10px; cursor: pointer; border: none;
    transition: background 0.2s; flex-shrink: 0; position: relative;
  }
  .avail-toggle::after {
    content: ''; position: absolute; top: 3px; left: 3px;
    width: 14px; height: 14px; border-radius: 50%; background: white;
    transition: left 0.2s;
  }
  .avail-toggle.on { background: var(--green); }
  .avail-toggle.on::after { left: 19px; }
  .avail-toggle.off { background: #ddd; }

  .driver-dash { display: flex; flex-direction: column; gap: 8px; }
  .driver-dash-row {
    background: white; border: 1px solid var(--line); border-radius: 14px;
    padding: 14px; display: flex; align-items: center; gap: 12px;
  }
  .driver-dash-avatar {
    width: 40px; height: 40px; border-radius: 50%;
    background: linear-gradient(135deg, var(--brand), var(--brand2));
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 0.82rem; color: white; flex-shrink: 0;
  }
  .driver-dash-info { flex: 1; }
  .driver-dash-name { font-size: 0.88rem; font-weight: 600; }
  .driver-dash-meta { font-size: 0.7rem; color: var(--muted); margin-top: 2px; }
  .driver-dash-stats { text-align: right; }
  .driver-dash-earn { font-weight: 700; font-size: 0.88rem; color: var(--green); }
  .driver-dash-trips { font-size: 0.68rem; color: var(--muted); }

  .analytics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; }
  .analytics-card { background: white; border: 1px solid var(--line); border-radius: 14px; padding: 14px; }
  .analytics-card.wide { grid-column: span 2; }
  .analytics-label { font-size: 0.68rem; color: var(--muted); margin-bottom: 8px; letter-spacing: 0.3px; }
  .analytics-val { font-family: 'Fraunces', serif; font-size: 1.4rem; font-weight: 900; color: var(--black); }
  .mini-bar-chart { display: flex; align-items: flex-end; gap: 4px; height: 48px; margin-top: 10px; }
  .mini-bar { flex: 1; border-radius: 3px 3px 0 0; background: linear-gradient(180deg, var(--brand), rgba(230,57,70,0.3)); min-height: 4px; }
  .day-label { font-size: 0.55rem; color: var(--muted); text-align: center; margin-top: 3px; }

  .promo-dash { display: flex; flex-direction: column; gap: 10px; }
  .promo-card { background: white; border: 1px solid var(--line); border-radius: 14px; padding: 14px; }
  .promo-code { font-family: 'DM Mono', monospace; font-size: 1rem; font-weight: 500; color: var(--brand); letter-spacing: 2px; margin-bottom: 4px; }
  .promo-meta { font-size: 0.72rem; color: var(--muted); }
  .promo-usage { font-size: 0.72rem; color: var(--body); margin-top: 6px; display: flex; justify-content: space-between; }
  .add-promo-btn {
    width: 100%; padding: 13px; background: transparent; color: var(--brand);
    border: 1.5px dashed var(--brand); border-radius: 14px; font-size: 0.85rem;
    font-weight: 600; cursor: pointer; transition: all 0.2s;
  }
  .add-promo-btn:hover { background: var(--tag-bg); }

  /* ── SUCCESS ── */
  .success-screen {
    display: flex; flex-direction: column; align-items: center; text-align: center;
    padding: 48px 24px; gap: 16px;
  }
  .success-icon { font-size: 4rem; animation: popIn 0.5s cubic-bezier(0.175,0.885,0.32,1.275); }
  @keyframes popIn { from{transform:scale(0.3);opacity:0} to{transform:scale(1);opacity:1} }
  .success-title { font-family: 'Fraunces', serif; font-weight: 900; font-size: 1.8rem; color: var(--black); }
  .success-sub { font-size: 0.88rem; color: var(--body); max-width: 300px; line-height: 1.6; }

  /* ── FOOTER CTA ── */
  .footer-cta {
    background: var(--black); padding: 56px 24px; text-align: center;
    position: relative; overflow: hidden;
  }
  .footer-cta::before {
    content: ''; position: absolute; top: -60px; left: 50%; transform: translateX(-50%);
    width: 400px; height: 200px; border-radius: 50%;
    background: radial-gradient(circle, rgba(230,57,70,0.2) 0%, transparent 70%);
  }
  .footer-cta-title { font-family: 'Fraunces', serif; font-weight: 900; font-size: clamp(1.6rem, 5vw, 2.4rem); color: white; margin-bottom: 14px; letter-spacing: -0.5px; position: relative; }
  .footer-cta-sub { font-size: 0.9rem; color: rgba(255,255,255,0.5); margin-bottom: 32px; position: relative; }
  .footer-bottom { background: var(--black); border-top: 1px solid rgba(255,255,255,0.08); padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; }
  .footer-copy { font-size: 0.72rem; color: rgba(255,255,255,0.3); }
  .footer-links { display: flex; gap: 16px; }
  .footer-link { font-size: 0.72rem; color: rgba(255,255,255,0.3); cursor: pointer; }
`;

// ─── MINI COMPONENTS ─────────────────────────────────
function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="faq-item">
      <div className="faq-q" onClick={() => setOpen(o => !o)}>
        <span className="faq-q-text">{q}</span>
        <span className={`faq-icon ${open ? "open" : ""}`}>+</span>
      </div>
      {open && <div className="faq-a">{a}</div>}
    </div>
  );
}

function MenuToggleRow({ item }) {
  const [on, setOn] = useState(true);
  return (
    <div className="menu-dash-row">
      <span className="menu-item-emoji">{item.img}</span>
      <div className="menu-item-info">
        <div className="menu-item-name-d">{item.name}</div>
        <div className="menu-item-meta">{item.category} · {on ? "Available" : "Unavailable"}</div>
      </div>
      <span className="menu-item-price">रू{item.price}</span>
      <button className={`avail-toggle ${on ? "on" : "off"}`} onClick={() => setOn(o => !o)} />
    </div>
  );
}

// ─── SIGNUP MODAL ─────────────────────────────────────
function SignupModal({ plan, onClose, onSuccess }) {
  const [step, setStep] = useState(1); // 1=type, 2=details, 3=brand
  const [bizType, setBizType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ bizName: "", ownerName: "", phone: "", email: "", city: "", outlets: "1", zone: "", logo: "" });

  const handleSubmit = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); onSuccess({ ...form, bizType, plan }); }, 1800);
  };

  return (
    <div className="signup-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="signup-sheet">
        <div className="sheet-handle" />

        {/* Progress */}
        <div className="step-progress">
          {[1,2,3].map(s => <div key={s} className={`prog-dot ${step >= s ? "done" : ""}`} />)}
        </div>

        {step === 1 && (
          <>
            <div className="sheet-title">Join TooFan Business</div>
            <div className="sheet-sub">What kind of business are you registering?</div>
            <div className="biz-type-grid">
              {[
                { id: "restaurant", icon: "🍱", name: "Restaurant / Food Outlet", desc: "Manage menu, orders & delivery from your kitchen" },
                { id: "fleet", icon: "🛵", name: "Driver Fleet / Logistics", desc: "Manage drivers, zones, earnings & assignments" },
                { id: "franchise", icon: "🏪", name: "Food Franchise", desc: "Multiple restaurant outlets under one brand" },
                { id: "hybrid", icon: "🌐", name: "Restaurant + Fleet", desc: "Own both the kitchen and the delivery operation" },
              ].map(t => (
                <div key={t.id} className={`biz-type-card ${bizType === t.id ? "selected" : ""}`} onClick={() => setBizType(t.id)}>
                  <div className="biz-type-icon">{t.icon}</div>
                  <div className="biz-type-name">{t.name}</div>
                  <div className="biz-type-desc">{t.desc}</div>
                </div>
              ))}
            </div>
            {plan && <div style={{background:"var(--tag-bg)",border:"1px solid rgba(230,57,70,0.15)",borderRadius:10,padding:"10px 14px",fontSize:"0.78rem",marginBottom:16}}>
              <span style={{color:"var(--muted)"}}>Selected plan: </span>
              <strong style={{color:"var(--brand)"}}>{plan.name} — रू{plan.price.monthly?.toLocaleString() || "Custom"}/mo</strong>
            </div>}
            <button className="submit-btn" disabled={!bizType} onClick={() => setStep(2)}>Continue →</button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="sheet-title">Your Business Details</div>
            <div className="sheet-sub">Tell us about your operation so we can set you up correctly.</div>
            <div className="form-field">
              <label className="form-label">Business Name *</label>
              <input className="form-input" placeholder="e.g. Sharma Food Chain" value={form.bizName} onChange={e => setForm(f => ({...f, bizName: e.target.value}))} />
            </div>
            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Owner / Contact Name *</label>
                <input className="form-input" placeholder="Full name" value={form.ownerName} onChange={e => setForm(f => ({...f, ownerName: e.target.value}))} />
              </div>
              <div className="form-field">
                <label className="form-label">Phone Number *</label>
                <input className="form-input" placeholder="98XXXXXXXX" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} />
              </div>
            </div>
            <div className="form-field">
              <label className="form-label">Business Email *</label>
              <input className="form-input" type="email" placeholder="you@yourbiz.com" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} />
            </div>
            <div className="form-row">
              <div className="form-field">
                <label className="form-label">City / District</label>
                <select className="form-select" value={form.city} onChange={e => setForm(f => ({...f, city: e.target.value}))}>
                  <option value="">Select city</option>
                  {["Kathmandu","Lalitpur","Bhaktapur","Pokhara","Chitwan","Butwal","Biratnagar","Dharan"].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label className="form-label">No. of Outlets / Drivers</label>
                <select className="form-select" value={form.outlets} onChange={e => setForm(f => ({...f, outlets: e.target.value}))}>
                  {["1","2-3","4-10","10+"].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            </div>
            <div className="form-field">
              <label className="form-label">Delivery Zone / Area</label>
              <input className="form-input" placeholder="e.g. Thamel, Lazimpat, Baneshwor" value={form.zone} onChange={e => setForm(f => ({...f, zone: e.target.value}))} />
            </div>
            <button className="submit-btn" disabled={!form.bizName || !form.ownerName || !form.phone} onClick={() => setStep(3)}>Continue →</button>
            <div className="back-link" onClick={() => setStep(1)}>← Back</div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="sheet-title">Brand & Go Live 🚀</div>
            <div className="sheet-sub">Customise how your business appears on TooFan.</div>
            <div className="form-field">
              <label className="form-label">Brand Colour</label>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {["#E63946","#FF6B35","#1d9e6a","#4A9EFF","#F5C842","#7c3aed","#0D0D0D"].map(c => (
                  <div key={c} onClick={() => setForm(f => ({...f, logo: c}))}
                    style={{width:32,height:32,borderRadius:"50%",background:c,cursor:"pointer",border:form.logo===c?"3px solid var(--black)":"3px solid transparent",boxSizing:"border-box"}}/>
                ))}
              </div>
            </div>
            <div className="form-field">
              <label className="form-label">Upload Logo</label>
              <div style={{border:"1.5px dashed var(--line)",borderRadius:12,padding:"20px",textAlign:"center",background:"white",cursor:"pointer",fontSize:"0.82rem",color:"var(--muted)"}}>
                📎 Tap to upload logo (PNG / SVG)
              </div>
            </div>
            <div className="form-field">
              <label className="form-label">Short Description (shown to customers)</label>
              <input className="form-input" placeholder="e.g. Fresh momos delivered in 25 minutes" />
            </div>
            <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:12,padding:"12px 14px",fontSize:"0.78rem",color:"#166534",marginBottom:16}}>
              ✅ Everything looks good! You're ready to go live on TooFan.
            </div>
            <button className="submit-btn" disabled={loading} onClick={handleSubmit}>
              {loading ? "Setting up your account..." : "🚀 Launch My TooFan Business"}
            </button>
            <div className="back-link" onClick={() => setStep(2)}>← Back</div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── BUSINESS DASHBOARD ──────────────────────────────
const DASH_ORDERS = [
  { id: "TF-2001", customer: "Aarav S.", items: "Veg Momo x2, Jhol Momo x1", amount: 550, status: "Preparing", color: "#F5C842" },
  { id: "TF-2002", customer: "Priya R.", items: "Dal Bhat Set x1", amount: 350, status: "On the Way", color: "#4A9EFF" },
  { id: "TF-2003", customer: "Rohan G.", items: "Chicken Momo x2", amount: 400, status: "Delivered", color: "#1d9e6a" },
  { id: "TF-2004", customer: "Sunita T.", items: "Fried Momo x1, Masala Chiya", amount: 280, status: "Delivered", color: "#1d9e6a" },
];

const DASH_MENU = [
  { img: "🥟", name: "Veg Momo (8 pcs)", price: 150, category: "Starters" },
  { img: "🥟", name: "Chicken Momo (8 pcs)", price: 200, category: "Starters" },
  { img: "🍲", name: "Jhol Momo", price: 250, category: "Mains" },
  { img: "🥟", name: "Fried Momo", price: 220, category: "Starters" },
  { img: "☕", name: "Masala Chiya", price: 60, category: "Drinks" },
];

const DASH_DRIVERS = [
  { name: "Bikash T.", phone: "9801234567", status: "On Delivery", earn: 1280, trips: 9 },
  { name: "Sanjay KC", phone: "9807654321", status: "Idle", earn: 860, trips: 6 },
  { name: "Ritu S.", phone: "9812345678", status: "Offline", earn: 0, trips: 0 },
];

const DASH_PROMOS = [
  { code: "TOOFAN20", discount: "20% off", usage: "42 / 100 used", expiry: "Expires Apr 5" },
  { code: "FIRST50", discount: "रू50 off 1st order", usage: "188 / 500 used", expiry: "Expires Apr 30" },
];

function BusinessDashboard({ bizData, onLogout }) {
  const [tab, setTab] = useState("overview");
  const name = bizData?.bizName || "Sharma Food Chain";

  const barHeights = [38, 52, 44, 71, 60, 85, 67];

  return (
    <div className="dashboard">
      <div className="dash-nav">
        <div className="dash-logo">Too<span>Fan</span> <span style={{fontFamily:"Outfit",fontSize:"0.65rem",fontWeight:600,color:"var(--muted)",marginLeft:4}}>BUSINESS</span></div>
        <div className="dash-outlet">
          <div className="outlet-dot" />
          <span>{name}</span>
          <span style={{color:"var(--muted)"}}>▾</span>
        </div>
      </div>

      <div className="dash-tabs">
        {[
          {id:"overview", label:"📊 Overview"},
          {id:"orders",   label:"📦 Orders"},
          {id:"menu",     label:"🍽️ Menu"},
          {id:"drivers",  label:"🛵 Drivers"},
          {id:"analytics",label:"📈 Analytics"},
          {id:"promos",   label:"🏷️ Promos"},
        ].map(t => (
          <button key={t.id} className={`dash-tab ${tab===t.id?"active":""}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="dash-body">

        {tab === "overview" && (
          <>
            <div style={{marginBottom:16}}>
              <div style={{fontFamily:"Fraunces",fontWeight:900,fontSize:"1.2rem",color:"var(--black)"}}>
                Good morning, {bizData?.ownerName?.split(" ")[0] || "Ramesh"} 👋
              </div>
              <div style={{fontSize:"0.78rem",color:"var(--muted)",marginTop:2}}>Here's how {name} is doing today</div>
            </div>
            <div className="dash-kpis">
              {[
                {label:"Orders Today", val:"24", delta:"↑ 6 from yesterday", up:true},
                {label:"Revenue Today", val:"रू9.4k", delta:"↑ 18% from yesterday", up:true},
                {label:"Active Drivers", val:"2", delta:"1 offline right now", up:false},
                {label:"Avg Delivery", val:"26 min", delta:"↓ 3 min faster", up:true},
              ].map((k,i) => (
                <div key={i} className="dash-kpi">
                  <div className="kpi-label-d">{k.label}</div>
                  <div className="kpi-val-d">{k.val}</div>
                  <div className={`kpi-delta-d ${k.up?"up":"down"}`}>{k.delta}</div>
                </div>
              ))}
            </div>
            <div className="dash-section-title">Recent Orders</div>
            <div className="orders-dash">
              {DASH_ORDERS.slice(0,3).map(o => (
                <div key={o.id} className="order-dash-row">
                  <div className="order-status-dot" style={{background:o.color}} />
                  <div className="order-dash-info">
                    <div className="order-dash-id">{o.id}</div>
                    <div className="order-dash-customer">{o.customer}</div>
                    <div className="order-dash-items">{o.items}</div>
                  </div>
                  <div className="order-dash-right">
                    <div className="order-dash-amount">रू{o.amount}</div>
                    <div className="order-dash-status" style={{color:o.color}}>{o.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === "orders" && (
          <>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div className="dash-section-title" style={{margin:0}}>All Orders</div>
              <div style={{display:"flex",gap:6}}>
                {["All","Live","Delivered"].map(f => (
                  <div key={f} style={{fontSize:"0.7rem",fontWeight:600,padding:"4px 10px",borderRadius:8,background:f==="All"?"var(--brand)":"var(--bg)",color:f==="All"?"white":"var(--muted)",border:"1px solid var(--line)",cursor:"pointer"}}>{f}</div>
                ))}
              </div>
            </div>
            <div className="orders-dash">
              {DASH_ORDERS.map(o => (
                <div key={o.id} className="order-dash-row">
                  <div className="order-status-dot" style={{background:o.color}} />
                  <div className="order-dash-info">
                    <div className="order-dash-id">{o.id}</div>
                    <div className="order-dash-customer">{o.customer}</div>
                    <div className="order-dash-items">{o.items}</div>
                  </div>
                  <div className="order-dash-right">
                    <div className="order-dash-amount">रू{o.amount}</div>
                    <div className="order-dash-status" style={{color:o.color}}>{o.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === "menu" && (
          <>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div className="dash-section-title" style={{margin:0}}>Menu Items</div>
              <button style={{fontSize:"0.78rem",fontWeight:600,padding:"7px 14px",borderRadius:8,background:"var(--brand)",color:"white",border:"none",cursor:"pointer"}}>+ Add Item</button>
            </div>
            <div className="menu-dash">
              {DASH_MENU.map((item, i) => <MenuToggleRow key={i} item={item} />)}
            </div>
          </>
        )}

        {tab === "drivers" && (
          <>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div className="dash-section-title" style={{margin:0}}>Your Drivers</div>
              <button style={{fontSize:"0.78rem",fontWeight:600,padding:"7px 14px",borderRadius:8,background:"var(--brand)",color:"white",border:"none",cursor:"pointer"}}>+ Add Driver</button>
            </div>
            <div style={{background:"white",border:"1px solid var(--line)",borderRadius:16,overflow:"hidden",marginBottom:16}}>
              <div style={{padding:"12px 14px",fontSize:"0.78rem",fontWeight:600,borderBottom:"1px solid var(--line)",display:"flex",justifyContent:"space-between"}}>
                <span>🗺️ Live Driver Map</span>
                <span style={{color:"var(--green)",fontSize:"0.68rem"}}>● 2 Active</span>
              </div>
              <div style={{position:"relative",height:200}}>
                <iframe
                  title="Driver Map"
                  width="100%" height="200"
                  style={{border:"none",display:"block",filter:"saturate(0.6) brightness(0.9)"}}
                  loading="lazy"
                  src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d28516.37899487185!2d85.31714!3d27.70169!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2snp!4v1711000000000!5m2!1sen!2snp"
                />
                {[{t:"35%",l:"45%",c:"#E63946",n:"B"},{t:"58%",l:"62%",c:"#FF6B35",n:"S"}].map((p,i) => (
                  <div key={i} style={{position:"absolute",top:p.t,left:p.l,transform:"translate(-50%,-50%)",width:28,height:28,borderRadius:"50%",background:p.c,border:"2.5px solid white",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.65rem",fontWeight:700,color:"white",boxShadow:`0 2px 8px ${p.c}88`,zIndex:10}}>
                    {p.n}
                  </div>
                ))}
              </div>
            </div>
            <div className="driver-dash">
              {DASH_DRIVERS.map((d,i) => (
                <div key={i} className="driver-dash-row">
                  <div className="driver-dash-avatar">{d.name.split(" ").map(n=>n[0]).join("")}</div>
                  <div className="driver-dash-info">
                    <div className="driver-dash-name">{d.name}</div>
                    <div className="driver-dash-meta">
                      📞 {d.phone} ·
                      <span style={{color: d.status==="On Delivery"?"var(--brand2)": d.status==="Idle"?"var(--green)":"var(--muted)", marginLeft:4}}>{d.status}</span>
                    </div>
                  </div>
                  <div className="driver-dash-stats">
                    <div className="driver-dash-earn">रू{d.earn}</div>
                    <div className="driver-dash-trips">{d.trips} trips today</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === "analytics" && (
          <>
            <div className="dash-section-title">Performance Analytics</div>
            <div className="analytics-grid">
              <div className="analytics-card">
                <div className="analytics-label">Total Revenue (This Month)</div>
                <div className="analytics-val">रू1.28L</div>
                <div style={{fontSize:"0.68rem",color:"var(--green)",marginTop:4}}>↑ 24% from last month</div>
              </div>
              <div className="analytics-card">
                <div className="analytics-label">Total Orders</div>
                <div className="analytics-val">342</div>
                <div style={{fontSize:"0.68rem",color:"var(--green)",marginTop:4}}>↑ 31 more than last month</div>
              </div>
              <div className="analytics-card wide">
                <div className="analytics-label">Daily Orders — This Week</div>
                <div className="mini-bar-chart">
                  {barHeights.map((h,i) => (
                    <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                      <div className="mini-bar" style={{height:`${h}%`,width:"100%"}} />
                      <div className="day-label">{["M","T","W","T","F","S","S"][i]}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="analytics-card">
                <div className="analytics-label">Top Item</div>
                <div className="analytics-val" style={{fontSize:"1.1rem"}}>🥟 Chicken Momo</div>
                <div style={{fontSize:"0.68rem",color:"var(--muted)",marginTop:4}}>87 orders this month</div>
              </div>
              <div className="analytics-card">
                <div className="analytics-label">Customer Rating</div>
                <div className="analytics-val" style={{color:"#f59e0b"}}>4.8 ⭐</div>
                <div style={{fontSize:"0.68rem",color:"var(--muted)",marginTop:4}}>Based on 124 reviews</div>
              </div>
              <div className="analytics-card">
                <div className="analytics-label">Avg Order Value</div>
                <div className="analytics-val">रू374</div>
              </div>
              <div className="analytics-card">
                <div className="analytics-label">Cancellation Rate</div>
                <div className="analytics-val" style={{color:"var(--brand)"}}>8.2%</div>
                <div style={{fontSize:"0.68rem",color:"var(--green)",marginTop:4}}>↓ Improved from 11%</div>
              </div>
            </div>
          </>
        )}

        {tab === "promos" && (
          <>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div className="dash-section-title" style={{margin:0}}>Promotions</div>
            </div>
            <div className="promo-dash">
              {DASH_PROMOS.map((p,i) => (
                <div key={i} className="promo-card">
                  <div className="promo-code">{p.code}</div>
                  <div style={{fontWeight:700,fontSize:"0.88rem",marginBottom:4}}>{p.discount}</div>
                  <div className="promo-usage">
                    <span>{p.usage}</span>
                    <span style={{color:"var(--muted)"}}>{p.expiry}</span>
                  </div>
                  <div style={{marginTop:8,height:4,background:"var(--bg)",borderRadius:2,overflow:"hidden"}}>
                    <div style={{height:"100%",width: i===0?"42%":"38%", background:"var(--brand)",borderRadius:2}} />
                  </div>
                </div>
              ))}
              <button className="add-promo-btn">+ Create New Promotion</button>
            </div>
          </>
        )}

        {/* Logout */}
        <div style={{marginTop:32,paddingTop:20,borderTop:"1px solid var(--line)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:"0.72rem",color:"var(--muted)"}}>TooFan Business · Growth Plan</div>
          <button onClick={onLogout} style={{fontSize:"0.75rem",color:"var(--muted)",background:"none",border:"none",cursor:"pointer"}}>Sign out →</button>
        </div>
      </div>
    </div>
  );
}

// ─── LANDING PAGE ─────────────────────────────────────
function LandingPage({ onSignup, onLogin }) {
  const [billing, setBilling] = useState("monthly");
  const [showSignup, setShowSignup] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [success, setSuccess] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [showDash, setShowDash] = useState(false);

  if (showDash) {
    return <BusinessDashboard bizData={successData} onLogout={() => { setShowDash(false); setSuccess(false); setSuccessData(null); }} />;
  }

  if (success) {
    return (
      <div className="screen">
        <div className="success-screen">
          <div className="success-icon">🎉</div>
          <div className="success-title">You're Live on TooFan!</div>
          <div className="success-sub">
            Welcome aboard, <strong>{successData?.bizName}</strong>! Your business is now on TooFan. We've sent setup instructions to <strong>{successData?.email}</strong>.
          </div>
          <button className="btn-primary" style={{marginTop:8}} onClick={() => setShowDash(true)}>
            Open My Dashboard →
          </button>
          <div style={{fontSize:"0.78rem",color:"var(--muted)",marginTop:8,cursor:"pointer"}} onClick={() => { setSuccess(false); setShowSignup(false); }}>
            ← Back to home
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* NAV */}
      <nav className="bp-nav">
        <div className="bp-logo">TooFan<span>Biz</span><sup>PARTNER</sup></div>
        <div className="nav-links">
          <button className="nav-link" onClick={() => document.getElementById('pricing')?.scrollIntoView({behavior:'smooth'})}>Pricing</button>
          <button className="nav-link" onClick={() => document.getElementById('features')?.scrollIntoView({behavior:'smooth'})}>Features</button>
        </div>
        <button className="nav-cta" onClick={() => { setSelectedPlan(null); setShowSignup(true); }}>Get Started</button>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-eyebrow">🌪️ For Restaurant & Fleet Owners</div>
        <h1 className="hero-title">
          Grow your business<br/>
          on <em>TooFan</em>
        </h1>
        <p className="hero-sub">
          Join hundreds of restaurants and driver franchises already using TooFan to manage orders, track drivers, and grow revenue — all from one powerful dashboard.
        </p>
        <div className="hero-actions">
          <button className="btn-primary" onClick={() => { setSelectedPlan(null); setShowSignup(true); }}>
            Start for Free →
          </button>
          <button className="btn-outline" onClick={() => { setSuccessData({ bizName: "Demo Business", ownerName: "Nabin" }); setShowDash(true); }}>
            View Demo Dashboard
          </button>
        </div>
        <div className="hero-stats">
          <div>
            <div className="hero-stat-val">400+</div>
            <div className="hero-stat-label">Business Partners</div>
          </div>
          <div>
            <div className="hero-stat-val">रू2.4Cr</div>
            <div className="hero-stat-label">Processed Monthly</div>
          </div>
          <div>
            <div className="hero-stat-val">98%</div>
            <div className="hero-stat-label">Partner Satisfaction</div>
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* HOW IT WORKS */}
      <section className="section" id="how">
        <div className="section-label">How it works</div>
        <div className="section-title">Live in 4 simple steps</div>
        <p className="section-sub">No technical skills required. Set up your restaurant or fleet and start receiving orders the same day.</p>
        <div className="steps-grid">
          {STEPS.map((s, i) => (
            <div key={i} className="step-card">
              <div className="step-num">0{i+1}</div>
              <div className="step-icon">{s.icon}</div>
              <div className="step-title">{s.title}</div>
              <div className="step-desc">{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <hr className="section-divider" />

      {/* FEATURES BENTO */}
      <section className="section" id="features">
        <div className="section-label">Everything you need</div>
        <div className="section-title">Built for serious operators</div>
        <div className="bento">
          <div className="bento-card dark">
            <div className="bento-tag">Live</div>
            <div className="bento-icon">🗺️</div>
            <div className="bento-title">Real-Time Driver Tracking</div>
            <div className="bento-desc">Watch your drivers live on Google Maps. See who's idle, on delivery, or offline — from anywhere.</div>
          </div>
          <div className="bento-card">
            <div className="bento-icon">🍽️</div>
            <div className="bento-title">Menu Management</div>
            <div className="bento-desc">Add, edit, or pause items instantly. Run flash promos and update prices in seconds.</div>
          </div>
          <div className="bento-card red">
            <div className="bento-tag">Growth</div>
            <div className="bento-icon">📈</div>
            <div className="bento-title">Revenue Analytics</div>
            <div className="bento-desc">Daily, weekly, and monthly revenue breakdowns. See your top items, peak hours, and growth trends.</div>
          </div>
          <div className="bento-card">
            <div className="bento-icon">🎨</div>
            <div className="bento-title">Your Brand, Your App</div>
            <div className="bento-desc">On Growth & Enterprise plans, customers see your logo and colours — not TooFan's. Full white-label experience.</div>
          </div>
          <div className="bento-card wide">
            <div className="bento-icon">💳</div>
            <div className="bento-title">Driver Payouts & Earnings Management</div>
            <div className="bento-desc">Set your own per-delivery or per-km rates. TooFan auto-calculates earnings for each driver. Review and approve weekly payouts from your dashboard — no spreadsheets needed.</div>
          </div>
          <div className="bento-card">
            <div className="bento-icon">🏷️</div>
            <div className="bento-title">Promo & Discount Engine</div>
            <div className="bento-desc">Create coupon codes, flat discounts, and first-order offers. Track usage and set expiry limits.</div>
          </div>
          <div className="bento-card">
            <div className="bento-icon">📲</div>
            <div className="bento-title">WhatsApp Notifications</div>
            <div className="bento-desc">Customers get real-time order updates via WhatsApp — no app download needed on their end.</div>
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* PRICING */}
      <section className="section" id="pricing">
        <div className="section-label">Pricing</div>
        <div className="section-title">Simple, honest pricing</div>
        <p className="section-sub">No hidden fees. No commission per order. Pay a flat monthly fee and keep all your revenue.</p>
        <div style={{marginTop:28,textAlign:"center"}}>
          <div className="billing-toggle">
            <button className={`toggle-btn ${billing==="monthly"?"active":""}`} onClick={() => setBilling("monthly")}>Monthly</button>
            <button className={`toggle-btn ${billing==="yearly"?"active":""}`} onClick={() => setBilling("yearly")}>
              Yearly <span className="save-pill">Save 20%</span>
            </button>
          </div>
        </div>
        <div className="pricing-grid">
          {PLANS.map(plan => (
            <div key={plan.id} className={`price-card ${plan.id==="growth"?"featured":""}`}>
              {plan.tag && <div className={`price-badge ${plan.id==="growth"?"red":"orange"}`}>{plan.tag}</div>}
              <div className="price-name">{plan.name}</div>
              {plan.price.monthly ? (
                <div className="price-amount">
                  <span className="price-currency">रू</span>
                  <span className="price-num">{billing==="monthly" ? plan.price.monthly.toLocaleString() : plan.price.yearly.toLocaleString()}</span>
                  <span className="price-per">/month</span>
                </div>
              ) : (
                <div className="price-custom">Talk to us</div>
              )}
              {billing === "yearly" && plan.price.monthly && (
                <div style={{fontSize:"0.7rem",color:"var(--green)",marginBottom:6}}>
                  Save रू{((plan.price.monthly - plan.price.yearly) * 12).toLocaleString()} per year
                </div>
              )}
              <hr className="price-divider" />
              <div className="price-features">
                {plan.features.map((f,i) => (
                  <div key={i} className="price-feature"><span className="feat-check">✓</span>{f}</div>
                ))}
                {plan.notIncluded.map((f,i) => (
                  <div key={i} className="price-feature"><span className="feat-cross">✗</span><span className="feat-strike">{f}</span></div>
                ))}
              </div>
              <button
                className={`price-btn ${plan.id==="growth"?"red": plan.id==="enterprise"?"outline":"dark"}`}
                onClick={() => { setSelectedPlan(plan); setShowSignup(true); }}
              >
                {plan.id==="enterprise" ? "Contact Sales →" : "Get Started →"}
              </button>
            </div>
          ))}
        </div>
      </section>

      <hr className="section-divider" />

      {/* TESTIMONIALS */}
      <section className="section">
        <div className="section-label">Partner Stories</div>
        <div className="section-title">Loved by businesses across Nepal</div>
        <div className="testimonials-grid">
          {TESTIMONIALS.map((t,i) => (
            <div key={i} className="testi-card">
              <div className="testi-stars">{"★".repeat(t.stars)}</div>
              <div className="testi-quote">"{t.quote}"</div>
              <div className="testi-author">
                <div className="testi-avatar">{t.avatar}</div>
                <div>
                  <div className="testi-name">{t.name}</div>
                  <div className="testi-biz">{t.biz}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <hr className="section-divider" />

      {/* FAQ */}
      <section className="section">
        <div className="section-label">FAQ</div>
        <div className="section-title">Common questions</div>
        <div className="faq-list">
          {FAQS.map((f,i) => <FaqItem key={i} q={f.q} a={f.a} />)}
        </div>
      </section>

      {/* FOOTER CTA */}
      <div className="footer-cta">
        <div className="footer-cta-title">Ready to grow with TooFan?</div>
        <div className="footer-cta-sub">Join 400+ restaurants and fleets already on the platform.</div>
        <button className="btn-primary" style={{position:"relative"}} onClick={() => { setSelectedPlan(null); setShowSignup(true); }}>
          Start for Free — No Credit Card
        </button>
      </div>
      <div className="footer-bottom">
        <div className="footer-copy">© 2026 TooFan · All rights reserved</div>
        <div className="footer-links">
          <span className="footer-link">Privacy</span>
          <span className="footer-link">Terms</span>
          <span className="footer-link">Support</span>
        </div>
      </div>

      {/* SIGNUP MODAL */}
      {showSignup && (
        <SignupModal
          plan={selectedPlan}
          onClose={() => setShowSignup(false)}
          onSuccess={(data) => { setSuccessData(data); setShowSignup(false); setSuccess(true); }}
        />
      )}
    </>
  );
}

// ─── ROOT ─────────────────────────────────────────────
export default function TooFanBizPortal() {
  return (
    <>
      <style>{css}</style>
      <LandingPage />
    </>
  );
}
