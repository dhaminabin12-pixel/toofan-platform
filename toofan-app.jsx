import { useState, useEffect, useRef } from "react";

// ══════════════════════════════════════════════════════════════════════
//  TOOFAN  ·  Full App — Khana · Driver · Admin
//  NEW features vs Blinkit + Rapido:
//  KHANA:  Live search+suggestions, Flash deals, TooFan Coins,
//          Wallet, Promo/coupon at checkout, Favourites hearts,
//          Reorder last order, Order history, Schedule delivery,
//          In-app chat with driver, SOS safety tab, Bottom nav
//  DRIVER: Incentive/bonus tracker, Rain bonus, Weekly target,
//          Surge zone map, Trip history tab
// ══════════════════════════════════════════════════════════════════════

const RESTAURANTS = [
  { id:1,name:"Momo House",      cuisine:"Nepali",     rating:4.8,time:"20-30",img:"🥟",tag:"Popular",discount:20 },
  { id:2,name:"Dal Bhat Palace", cuisine:"Traditional",rating:4.6,time:"25-35",img:"🍛",tag:"Veg",    discount:0  },
  { id:3,name:"Tandoor Express", cuisine:"Indian",     rating:4.5,time:"30-40",img:"🍗",tag:"Spicy",  discount:15 },
  { id:4,name:"Chiya & Snacks",  cuisine:"Cafe",       rating:4.9,time:"10-15",img:"☕",tag:"New",    discount:0  },
  { id:5,name:"Pizza Adda",      cuisine:"Fast Food",  rating:4.3,time:"25-35",img:"🍕",tag:"",       discount:30 },
  { id:6,name:"Biryani Hub",     cuisine:"Mughlai",    rating:4.7,time:"35-45",img:"🍚",tag:"Best",   discount:0  },
];

const MENU = {
  1:[{id:101,name:"Veg Momo (8 pcs)",price:150,img:"🥟"},{id:102,name:"Chicken Momo (8 pcs)",price:200,img:"🥟"},{id:103,name:"Jhol Momo",price:250,img:"🍲"},{id:104,name:"Fried Momo",price:220,img:"🥟"}],
  2:[{id:201,name:"Dal Bhat Set",price:350,img:"🍛"},{id:202,name:"Thukpa",price:200,img:"🍜"},{id:203,name:"Gundruk Soup",price:120,img:"🥣"}],
  3:[{id:301,name:"Chicken Tikka",price:450,img:"🍗"},{id:302,name:"Paneer Butter Masala",price:380,img:"🧀"},{id:303,name:"Garlic Naan",price:80,img:"🫓"}],
  4:[{id:401,name:"Masala Chiya",price:60,img:"☕"},{id:402,name:"Sel Roti",price:80,img:"🍩"},{id:403,name:"Samosa (2 pcs)",price:50,img:"🥟"}],
  5:[{id:501,name:"Margherita Pizza",price:600,img:"🍕"},{id:502,name:"Pepperoni Pizza",price:750,img:"🍕"},{id:503,name:"Garlic Bread",price:150,img:"🥖"}],
  6:[{id:601,name:"Chicken Biryani",price:550,img:"🍚"},{id:602,name:"Mutton Biryani",price:650,img:"🍚"},{id:603,name:"Veg Biryani",price:400,img:"🌿"}],
};

const ALL_ITEMS = Object.values(MENU).flat();

const FLASH_DEALS = [
  {id:"F1",title:"50% OFF First Order",sub:"Code: TOOFAN50 · Ends 2h 14m",color:"#E63946",icon:"🔥"},
  {id:"F2",title:"Free Delivery on Momos",sub:"Order above रू300 · Today only",color:"#FF6B35",icon:"🥟"},
  {id:"F3",title:"Buy 2 Get 1 Free",sub:"Masala Chiya · Chiya & Snacks",color:"#4A9EFF",icon:"☕"},
];

const COUPONS = {
  "TOOFAN50":{type:"pct",val:50,max:200,desc:"50% off (max रू200)"},
  "FLAT100": {type:"flat",val:100,desc:"रू100 flat off"},
  "NEWUSER": {type:"pct",val:30,max:150,desc:"30% off for new users"},
};

const ORDER_HISTORY = [
  {id:"TF-1891",rest:"Momo House",      items:"Veg Momo x2",        total:370, date:"Yesterday",  status:"Delivered",restId:1},
  {id:"TF-1834",rest:"Dal Bhat Palace", items:"Dal Bhat Set x1",    total:420, date:"3 days ago", status:"Delivered",restId:2},
  {id:"TF-1760",rest:"Pizza Adda",      items:"Margherita x1",      total:750, date:"1 week ago", status:"Delivered",restId:5},
  {id:"TF-1720",rest:"Biryani Hub",     items:"Chicken Biryani x1", total:620, date:"2 weeks ago",status:"Cancelled",restId:6},
];

const ORDERS_MOCK = [
  {id:"TF-1001",customer:"Aarav Sharma", driver:"Bikash Tamang",restaurant:"Momo House",      items:"Veg Momo x2",    total:300,status:"Delivered", time:"12:30 PM"},
  {id:"TF-1002",customer:"Priya Rai",    driver:"Sanjay KC",    restaurant:"Dal Bhat Palace", items:"Dal Bhat Set x1",total:350,status:"On the Way",time:"1:15 PM"},
  {id:"TF-1003",customer:"Rohan Gurung", driver:"Unassigned",   restaurant:"Tandoor Express", items:"Chicken Tikka",  total:530,status:"Preparing", time:"1:45 PM"},
  {id:"TF-1004",customer:"Sunita Thapa", driver:"Bikash Tamang",restaurant:"Pizza Adda",      items:"Margherita x1",  total:750,status:"Delivered", time:"11:00 AM"},
  {id:"TF-1005",customer:"Deepak Lama",  driver:"Ritu Shrestha",restaurant:"Biryani Hub",     items:"Biryani x2",     total:1100,status:"Cancelled",time:"2:00 PM"},
];

const DRIVERS_MOCK = [
  {id:"D01",name:"Bikash Tamang",  phone:"9801234567",vehicle:"Motorcycle",status:"Active", trips:124,rating:4.9,earnings:8400, location:"Lalitpur"},
  {id:"D02",name:"Sanjay KC",      phone:"9807654321",vehicle:"Motorcycle",status:"Active", trips:89, rating:4.7,earnings:6200, location:"Kathmandu"},
  {id:"D03",name:"Ritu Shrestha",  phone:"9812345678",vehicle:"Scooter",   status:"Offline",trips:56, rating:4.5,earnings:3900, location:"Bhaktapur"},
  {id:"D04",name:"Naresh Maharjan",phone:"9845678901",vehicle:"Motorcycle",status:"Active", trips:201,rating:4.8,earnings:14200,location:"Patan"},
];

const DRIVER_POOL = [
  {id:"D01",name:"Bikash Tamang",  initials:"BT",rating:4.9,trips:124,distKm:0.8,status:"online", vehicle:"Motorcycle",color:"#FF6B35"},
  {id:"D02",name:"Sanjay KC",      initials:"SK",rating:4.7,trips:89, distKm:1.4,status:"online", vehicle:"Motorcycle",color:"#4A9EFF"},
  {id:"D03",name:"Ritu Shrestha",  initials:"RS",rating:4.5,trips:56, distKm:2.1,status:"online", vehicle:"Scooter",   color:"#A855F7"},
  {id:"D04",name:"Naresh Maharjan",initials:"NM",rating:4.8,trips:201,distKm:3.3,status:"online", vehicle:"Motorcycle",color:"#2EC27E"},
  {id:"D05",name:"Anil Tamang",    initials:"AT",rating:4.2,trips:31, distKm:4.6,status:"online", vehicle:"Scooter",   color:"#EAB308"},
  {id:"D06",name:"Priya Lama",     initials:"PL",rating:3.9,trips:18, distKm:5.8,status:"online", vehicle:"Scooter",   color:"#6B7280"},
  {id:"D07",name:"Deepak Rai",     initials:"DR",rating:4.6,trips:77, distKm:6.2,status:"offline",vehicle:"Motorcycle",color:"#6B7280"},
];

const DISPATCH_RADIUS_KM = 5;
const calcScore = d => {
  if (d.distKm > DISPATCH_RADIUS_KM || d.status==="offline") return -1;
  return Math.round((1 - d.distKm/DISPATCH_RADIUS_KM)*60 + ((d.rating-1)/4)*40);
};

const TRIP_HISTORY = [
  {id:"TF-2091",rest:"Momo House",     customer:"Aarav S.", earn:65,dist:2.4,time:"1:32 PM", date:"Today"},
  {id:"TF-2084",rest:"Dal Bhat Palace",customer:"Priya R.", earn:55,dist:1.9,time:"11:20 AM",date:"Today"},
  {id:"TF-2077",rest:"Chiya & Snacks", customer:"Rohan G.", earn:40,dist:1.2,time:"9:45 AM", date:"Today"},
  {id:"TF-2071",rest:"Biryani Hub",    customer:"Sunita T.",earn:90,dist:3.8,time:"7:55 PM", date:"Yesterday"},
  {id:"TF-2065",rest:"Pizza Adda",     customer:"Deepak L.",earn:80,dist:3.2,time:"5:30 PM", date:"Yesterday"},
];

const SURGE_ZONES = [
  {name:"Thamel",   top:"35%",left:"42%",surge:"2.1x",color:"#EF4444",size:52},
  {name:"Lazimpat", top:"25%",left:"60%",surge:"1.8x",color:"#F97316",size:40},
  {name:"Baneshwor",top:"58%",left:"68%",surge:"1.5x",color:"#EAB308",size:36},
  {name:"Kirtipur", top:"62%",left:"28%",surge:"1.3x",color:"#EAB308",size:30},
];

const STAGE_DATA = [
  {key:"confirmed",label:"Order Confirmed",    icon:"✅",sub:"Restaurant received your order"},
  {key:"preparing",label:"Preparing Your Food",icon:"🍳",sub:"Kitchen is making your order"},
  {key:"pickedup", label:"Driver Picked Up",   icon:"🛵",sub:"On the way to you — track live"},
  {key:"delivered",label:"Delivered!",         icon:"🎉",sub:"Enjoy your meal"},
];

const WAYPOINTS = [
  {t:70,l:36},{t:64,l:39},{t:58,l:42},{t:52,l:46},{t:46,l:50},{t:40,l:55},{t:34,l:60}
];

const DRIVER_PINS = [
  {name:"Bikash",top:"38%",left:"47%",color:"#FF6B35",status:"On Delivery"},
  {name:"Sanjay",top:"55%",left:"60%",color:"#4A9EFF",status:"Idle"},
  {name:"Ritu",  top:"44%",left:"35%",color:"#2EC27E",status:"On Delivery"},
  {name:"Naresh",top:"65%",left:"52%",color:"#FF6B35",status:"On Delivery"},
  {name:"Anil",  top:"29%",left:"63%",color:"#2EC27E",status:"Idle"},
];

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
  *{margin:0;padding:0;box-sizing:border-box;}
  :root{
    --red:#E63946;--orange:#FF6B35;--dark:#0A0A0F;--darker:#06060A;
    --card:#12121A;--card2:#1A1A25;--border:rgba(255,255,255,0.07);
    --text:#F0EBE3;--muted:rgba(240,235,227,0.45);
    --green:#2EC27E;--yellow:#F5C842;--blue:#4A9EFF;--purple:#A855F7;
  }
  body{font-family:'DM Sans',sans-serif;background:var(--dark);color:var(--text);overflow-x:hidden;}
  ::-webkit-scrollbar{width:4px;}
  ::-webkit-scrollbar-track{background:var(--darker);}
  ::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px;}

  .app-nav{display:flex;align-items:center;background:var(--darker);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:100;padding:0 12px;}
  .nav-logo{font-family:'Syne',sans-serif;font-weight:800;font-size:1.05rem;padding:14px 12px 14px 0;color:var(--red);white-space:nowrap;}
  .nav-logo span{color:var(--text);}
  .nav-tabs{display:flex;flex:1;overflow-x:auto;}
  .nav-tab{padding:15px 14px;font-size:0.78rem;font-weight:500;cursor:pointer;color:var(--muted);border:none;background:none;border-bottom:2px solid transparent;white-space:nowrap;transition:all 0.2s;}
  .nav-tab.active{color:var(--text);border-bottom-color:var(--red);}
  .nav-tab.driver.active{border-bottom-color:var(--orange);}
  .nav-tab.admin.active{border-bottom-color:var(--blue);}
  .screen{min-height:calc(100vh - 51px);}

  /* BOTTOM NAV */
  .bottom-nav{position:fixed;bottom:0;left:0;right:0;background:var(--darker);border-top:1px solid var(--border);display:flex;z-index:90;}
  .bnav-item{flex:1;display:flex;flex-direction:column;align-items:center;padding:9px 4px;cursor:pointer;font-size:0.58rem;color:var(--muted);gap:2px;border:none;background:none;}
  .bnav-item.active{color:var(--red);}
  .bnav-icon{font-size:1.15rem;}

  /* KHANA HERO */
  .khana-hero{background:linear-gradient(135deg,#1a0a0a 0%,#0A0A0F 60%);padding:18px 14px 15px;border-bottom:1px solid var(--border);}
  .khana-greeting{font-size:0.7rem;color:var(--muted);margin-bottom:2px;}
  .khana-title{font-family:'Syne',sans-serif;font-weight:800;font-size:1.3rem;line-height:1.1;margin-bottom:12px;}
  .khana-title span{color:var(--red);}

  /* SEARCH */
  .search-wrap{position:relative;}
  .search-input{width:100%;padding:10px 12px 10px 36px;background:var(--card);border:1px solid var(--border);border-radius:11px;font-size:0.85rem;color:var(--text);outline:none;font-family:'DM Sans',sans-serif;transition:border-color 0.2s;}
  .search-input:focus{border-color:var(--red);}
  .search-icon{position:absolute;left:11px;top:50%;transform:translateY(-50%);font-size:0.85rem;pointer-events:none;}
  .search-suggestions{position:absolute;top:calc(100% + 4px);left:0;right:0;background:var(--card);border:1px solid var(--border);border-radius:11px;z-index:50;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,0.4);}
  .sug-item{display:flex;align-items:center;gap:9px;padding:9px 13px;cursor:pointer;font-size:0.8rem;border-bottom:1px solid rgba(255,255,255,0.04);}
  .sug-item:last-child{border-bottom:none;}
  .sug-item:hover{background:var(--card2);}

  /* WALLET */
  .wallet-strip{display:flex;gap:8px;padding:10px 14px;overflow-x:auto;}
  .wallet-card{background:var(--card);border:1px solid var(--border);border-radius:11px;padding:9px 12px;display:flex;align-items:center;gap:8px;white-space:nowrap;flex-shrink:0;}
  .wallet-val{font-family:'Syne',sans-serif;font-size:0.95rem;font-weight:800;}
  .wallet-lbl{font-size:0.57rem;color:var(--muted);margin-top:1px;}

  /* FLASH DEALS */
  .flash-scroll{display:flex;gap:9px;overflow-x:auto;padding-bottom:2px;}
  .flash-card{border-radius:13px;padding:11px 13px;min-width:190px;flex-shrink:0;cursor:pointer;position:relative;overflow:hidden;}
  .flash-card::after{content:'';position:absolute;top:0;left:-60%;width:40%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent);animation:shimmer 2.5s infinite;}
  @keyframes shimmer{from{left:-60%}to{left:120%}}
  .flash-title{font-weight:700;font-size:0.8rem;color:white;margin-bottom:2px;}
  .flash-sub{font-size:0.6rem;color:rgba(255,255,255,0.7);}

  /* CATS */
  .categories{display:flex;gap:7px;padding:12px 14px 4px;overflow-x:auto;}
  .cat-pill{padding:6px 13px;border-radius:18px;font-size:0.72rem;font-weight:500;border:1px solid var(--border);background:var(--card);color:var(--muted);cursor:pointer;white-space:nowrap;transition:all 0.2s;}
  .cat-pill.active{background:var(--red);color:white;border-color:var(--red);}

  /* RESTAURANT GRID */
  .section-title{font-family:'Syne',sans-serif;font-size:0.9rem;font-weight:700;padding:12px 14px 8px;}
  .restaurant-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:0 14px 100px;}
  .rest-card{background:var(--card);border:1px solid var(--border);border-radius:13px;overflow:hidden;cursor:pointer;transition:transform 0.2s;}
  .rest-card:hover{transform:translateY(-2px);}
  .rest-img-box{font-size:2rem;background:var(--card2);padding:16px;text-align:center;position:relative;}
  .rest-tag{position:absolute;top:6px;right:6px;background:var(--red);color:white;font-size:0.52rem;font-weight:600;padding:2px 5px;border-radius:4px;}
  .rest-disc{position:absolute;top:6px;left:6px;background:var(--green);color:white;font-size:0.52rem;font-weight:600;padding:2px 5px;border-radius:4px;}
  .rest-fav{position:absolute;bottom:6px;right:6px;font-size:0.95rem;cursor:pointer;background:none;border:none;}
  .rest-info{padding:7px 9px 9px;}
  .rest-name{font-weight:600;font-size:0.8rem;margin-bottom:2px;}
  .rest-meta{font-size:0.64rem;color:var(--muted);display:flex;gap:5px;}

  /* MENU */
  .menu-header{display:flex;align-items:center;gap:11px;padding:12px 14px;border-bottom:1px solid var(--border);background:var(--card);}
  .back-btn{width:32px;height:32px;border-radius:50%;background:var(--card2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:0.9rem;flex-shrink:0;}
  .menu-rest-name{font-family:'Syne',sans-serif;font-size:1rem;font-weight:700;}
  .menu-items{padding:9px 13px;display:flex;flex-direction:column;gap:7px;padding-bottom:80px;}
  .menu-item{display:flex;align-items:center;gap:9px;background:var(--card);border:1px solid var(--border);border-radius:11px;padding:9px 11px;}
  .item-emoji{font-size:1.5rem;}
  .item-name{font-size:0.82rem;font-weight:500;flex:1;}
  .item-price{font-size:0.78rem;font-weight:600;color:var(--orange);margin-right:7px;}
  .add-btn{width:27px;height:27px;border-radius:6px;background:var(--red);border:none;color:white;font-size:1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;font-weight:700;}
  .qty-ctrl{display:flex;align-items:center;gap:5px;}
  .qty-num{font-size:0.8rem;font-weight:600;min-width:13px;text-align:center;}
  .qty-btn{width:25px;height:25px;border-radius:5px;border:1px solid var(--border);background:var(--card2);color:var(--text);cursor:pointer;font-size:0.9rem;display:flex;align-items:center;justify-content:center;}

  /* CART */
  .cart-bar{position:fixed;bottom:58px;left:0;right:0;background:var(--red);padding:11px 16px;display:flex;justify-content:space-between;align-items:center;z-index:50;cursor:pointer;}
  .cart-info{font-size:0.78rem;font-weight:500;color:white;}
  .cart-total{font-family:'Syne',sans-serif;font-size:0.88rem;font-weight:700;color:white;}
  .order-confirm{padding:13px;display:flex;flex-direction:column;gap:11px;padding-bottom:90px;}
  .order-section{background:var(--card);border:1px solid var(--border);border-radius:13px;padding:13px;}
  .order-section-title{font-size:0.6rem;font-weight:700;color:var(--muted);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;}
  .order-item-row{display:flex;justify-content:space-between;font-size:0.8rem;padding:2px 0;}
  .order-divider{border:none;border-top:1px solid var(--border);margin:7px 0;}
  .order-total-row{display:flex;justify-content:space-between;font-size:0.9rem;font-weight:700;}
  .place-btn{width:100%;padding:13px;background:var(--red);color:white;border:none;border-radius:11px;font-family:'Syne',sans-serif;font-size:0.9rem;font-weight:700;cursor:pointer;}
  .place-btn:disabled{opacity:0.4;}
  .coupon-row{display:flex;gap:7px;}
  .coupon-input{flex:1;padding:8px 11px;background:var(--card2);border:1px solid var(--border);border-radius:7px;font-size:0.8rem;color:var(--text);outline:none;font-family:'DM Sans',sans-serif;}
  .coupon-input:focus{border-color:var(--green);}
  .coupon-btn{padding:8px 12px;background:var(--green);color:white;border:none;border-radius:7px;font-size:0.74rem;font-weight:700;cursor:pointer;}
  .schedule-row{display:flex;gap:6px;flex-wrap:wrap;}
  .schedule-pill{padding:5px 11px;border-radius:16px;font-size:0.7rem;font-weight:500;border:1px solid var(--border);background:var(--card2);color:var(--muted);cursor:pointer;}
  .schedule-pill.active{border-color:var(--blue);color:var(--blue);}

  /* CHAT */
  .chat-wrap{display:flex;flex-direction:column;height:300px;}
  .chat-messages{flex:1;overflow-y:auto;padding:10px 13px;display:flex;flex-direction:column;gap:7px;}
  .chat-bubble{max-width:74%;padding:7px 11px;border-radius:11px;font-size:0.78rem;line-height:1.4;}
  .chat-bubble.driver{background:var(--card2);border-radius:11px 11px 11px 3px;align-self:flex-start;}
  .chat-bubble.me{background:var(--red);border-radius:11px 11px 3px 11px;align-self:flex-end;}
  .chat-time{font-size:0.57rem;color:var(--muted);margin-top:2px;}
  .chat-input-row{display:flex;gap:7px;padding:9px 13px;border-top:1px solid var(--border);}
  .chat-input{flex:1;background:var(--card2);border:1px solid var(--border);border-radius:18px;padding:7px 13px;font-size:0.8rem;color:var(--text);outline:none;font-family:'DM Sans',sans-serif;}
  .chat-send{width:32px;height:32px;border-radius:50%;background:var(--red);border:none;color:white;cursor:pointer;display:flex;align-items:center;justify-content:center;}

  /* DRIVER APP */
  .driver-hero{background:linear-gradient(135deg,#0d0a05 0%,#0A0A0F 60%);padding:18px 14px;}
  .driver-status-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;}
  .driver-name{font-family:'Syne',sans-serif;font-size:1.2rem;font-weight:800;}
  .driver-status-toggle{display:flex;align-items:center;gap:5px;background:var(--card);border:1px solid var(--border);border-radius:17px;padding:5px 11px;cursor:pointer;}
  .status-dot{width:7px;height:7px;border-radius:50%;}
  .status-dot.online{background:var(--green);box-shadow:0 0 5px var(--green);}
  .status-dot.offline{background:var(--muted);}
  .status-text{font-size:0.72rem;font-weight:500;}
  .driver-stats{display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;}
  .stat-card{background:var(--card);border:1px solid var(--border);border-radius:11px;padding:11px 7px;text-align:center;}
  .stat-val{font-family:'Syne',sans-serif;font-size:1.1rem;font-weight:800;color:var(--orange);}
  .stat-label{font-size:0.6rem;color:var(--muted);margin-top:2px;}
  .driver-tabs{display:flex;border-bottom:1px solid var(--border);background:var(--darker);padding:0 10px;overflow-x:auto;}
  .d-tab{padding:10px 13px;font-size:0.72rem;font-weight:500;cursor:pointer;color:var(--muted);border:none;background:none;border-bottom:2px solid transparent;white-space:nowrap;}
  .d-tab.active{color:var(--orange);border-bottom-color:var(--orange);}
  .accept-btn{flex:1;padding:11px;background:var(--green);color:white;border:none;border-radius:8px;font-weight:700;font-size:0.82rem;cursor:pointer;}
  .reject-btn{flex:1;padding:11px;background:var(--card2);color:var(--muted);border:1px solid var(--border);border-radius:8px;font-weight:600;font-size:0.82rem;cursor:pointer;}
  .delivered-btn{width:calc(100% - 26px);margin:0 13px 13px;padding:12px;background:linear-gradient(135deg,var(--orange),var(--red));color:white;border:none;border-radius:10px;font-family:'Syne',sans-serif;font-weight:800;font-size:0.9rem;cursor:pointer;}
  .earnings-section{padding:0 13px 14px;}
  .earnings-card{background:linear-gradient(135deg,#0d1a0a,#0A0A0F);border:1px solid rgba(46,194,126,0.2);border-radius:14px;padding:16px;}
  .earnings-title{font-size:0.6rem;color:var(--muted);letter-spacing:1px;text-transform:uppercase;margin-bottom:5px;}
  .earnings-amount{font-family:'Syne',sans-serif;font-size:1.9rem;font-weight:800;color:var(--green);}
  .earnings-sub{font-size:0.7rem;color:var(--muted);margin-top:2px;}
  .progress-track{background:rgba(255,255,255,0.15);border-radius:4px;height:5px;margin:10px 0 5px;overflow:hidden;}
  .progress-inner{height:100%;border-radius:4px;background:white;transition:width 0.5s;}

  /* ADMIN */
  .admin-header{background:var(--darker);border-bottom:1px solid var(--border);padding:13px 14px;display:flex;align-items:center;justify-content:space-between;}
  .admin-title{font-family:'Syne',sans-serif;font-size:1rem;font-weight:800;}
  .admin-badge{background:rgba(74,158,255,0.15);color:var(--blue);font-size:0.62rem;font-weight:600;padding:3px 7px;border-radius:16px;border:1px solid rgba(74,158,255,0.2);}
  .admin-kpis{display:grid;grid-template-columns:1fr 1fr;gap:9px;padding:13px;}
  .kpi-card{background:var(--card);border:1px solid var(--border);border-radius:11px;padding:13px;position:relative;overflow:hidden;}
  .kpi-bg{position:absolute;right:-7px;bottom:-7px;font-size:3.2rem;opacity:0.05;}
  .kpi-icon{font-size:1.2rem;margin-bottom:5px;}
  .kpi-val{font-family:'Syne',sans-serif;font-size:1.35rem;font-weight:800;}
  .kpi-label{font-size:0.62rem;color:var(--muted);margin-top:1px;}
  .kpi-delta{font-size:0.62rem;font-weight:600;margin-top:4px;}
  .kpi-delta.up{color:var(--green);}.kpi-delta.down{color:var(--red);}
  .admin-tabs{display:flex;border-bottom:1px solid var(--border);padding:0 13px;gap:2px;overflow-x:auto;}
  .admin-tab{padding:9px 13px;font-size:0.72rem;font-weight:500;cursor:pointer;color:var(--muted);border:none;background:none;border-bottom:2px solid transparent;white-space:nowrap;}
  .admin-tab.active{color:var(--blue);border-bottom-color:var(--blue);}
  .revenue-chart{margin:0 13px 13px;background:var(--card);border:1px solid var(--border);border-radius:13px;padding:13px;}
  .chart-title{font-size:0.62rem;font-weight:600;color:var(--muted);letter-spacing:1px;text-transform:uppercase;margin-bottom:12px;}
  .bar-chart{display:flex;align-items:flex-end;gap:4px;height:68px;}
  .bar-wrap{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;}
  .bar{width:100%;border-radius:3px 3px 0 0;background:linear-gradient(180deg,var(--blue),rgba(74,158,255,0.3));}
  .bar-day{font-size:0.52rem;color:var(--muted);}
  .orders-list{padding:9px 13px;display:flex;flex-direction:column;gap:6px;}
  .order-row{background:var(--card);border:1px solid var(--border);border-radius:11px;padding:11px;}
  .order-row-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;}
  .order-id{font-size:0.7rem;font-weight:700;color:var(--blue);}
  .status-badge{font-size:0.55rem;font-weight:700;padding:2px 5px;border-radius:4px;letter-spacing:0.5px;text-transform:uppercase;}
  .status-badge.delivered{background:rgba(46,194,126,0.15);color:var(--green);border:1px solid rgba(46,194,126,0.2);}
  .status-badge.on-the-way{background:rgba(74,158,255,0.15);color:var(--blue);border:1px solid rgba(74,158,255,0.2);}
  .status-badge.preparing{background:rgba(245,200,66,0.15);color:var(--yellow);border:1px solid rgba(245,200,66,0.2);}
  .status-badge.cancelled{background:rgba(230,57,70,0.1);color:var(--red);border:1px solid rgba(230,57,70,0.2);}
  .order-row-details{display:flex;gap:4px;flex-wrap:wrap;}
  .detail-tag{font-size:0.64rem;color:var(--muted);background:var(--card2);padding:2px 6px;border-radius:4px;}
  .order-row-footer{display:flex;justify-content:space-between;margin-top:6px;}
  .order-amount{font-size:0.82rem;font-weight:700;color:var(--orange);}
  .order-time{font-size:0.64rem;color:var(--muted);}
  .drivers-list{padding:9px 13px;display:flex;flex-direction:column;gap:6px;}
  .driver-row{background:var(--card);border:1px solid var(--border);border-radius:11px;padding:11px;display:flex;align-items:center;gap:9px;}
  .driver-avatar{width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,var(--orange),var(--red));display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-weight:800;font-size:0.82rem;color:white;flex-shrink:0;}
  .driver-info{flex:1;min-width:0;}
  .driver-row-name{font-size:0.82rem;font-weight:600;}
  .driver-row-meta{font-size:0.64rem;color:var(--muted);margin-top:1px;}
  .driver-row-stats{text-align:right;flex-shrink:0;}
  .driver-earn{font-family:'Syne',sans-serif;font-size:0.88rem;font-weight:700;color:var(--green);}
  .driver-trips{font-size:0.62rem;color:var(--muted);}

  @keyframes radarSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
  @keyframes fadeSlideIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
  @keyframes borderPulse{0%,100%{box-shadow:0 0 0 0 rgba(255,107,53,0)}50%{box-shadow:0 0 0 6px rgba(255,107,53,0.12)}}
  @keyframes glowSweep{from{left:-100%}to{left:200%}}
  @keyframes popIn{from{transform:scale(0.3);opacity:0}to{transform:scale(1);opacity:1}}
  @keyframes spinAnim{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
  @keyframes drvPulse{0%{transform:translate(-50%,-50%) scale(0.8);opacity:0.6}70%{transform:translate(-50%,-50%) scale(2);opacity:0}100%{transform:translate(-50%,-50%) scale(0.8);opacity:0}}
  @keyframes surgeBreath{0%,100%{opacity:0.3}50%{opacity:0.55}}
  @keyframes pingD{0%,100%{transform:translate(-50%,-50%) scale(1);opacity:0.3}50%{transform:translate(-50%,-50%) scale(2.2);opacity:0}}
`;

// ── LIVE TRACKING ─────────────────────────────────────────────────────
function LiveTrackingScreen({ onDone, restaurant }) {
  const [stage, setStage]         = useState(0);
  const [wpIdx, setWpIdx]         = useState(0);
  const [eta, setEta]             = useState(18);
  const [trackTab, setTrackTab]   = useState("map");
  const [chatMsgs, setChatMsgs]   = useState([
    {from:"driver", text:"Namaste! Picked up from Momo House. On my way! 🛵", time:"1:32 PM"}
  ]);
  const [chatInput, setChatInput] = useState("");
  const [callVis, setCallVis]     = useState(false);
  const [rated, setRated]         = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  const chatEnd = useRef(null);

  useEffect(() => {
    if (stage >= 3) return;
    const t = setTimeout(() => setStage(s => s + 1), [3000, 5000, 14000][stage]);
    return () => clearTimeout(t);
  }, [stage]);

  useEffect(() => {
    if (stage !== 2 || wpIdx >= WAYPOINTS.length - 1) return;
    const t = setInterval(() => {
      setWpIdx(i => i < WAYPOINTS.length - 1 ? i + 1 : i);
      setEta(e => Math.max(1, e - 2));
    }, 2000);
    return () => clearInterval(t);
  }, [stage]);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMsgs]);

  const sendChat = () => {
    if (!chatInput.trim()) return;
    setChatMsgs(m => [...m, { from: "me", text: chatInput.trim(), time: "Now" }]);
    setChatInput("");
    setTimeout(() => setChatMsgs(m => [...m, { from: "driver", text: "OK, coming shortly! 🛵", time: "Now" }]), 1200);
  };

  if (submitted) return (
    <div className="screen" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:400,gap:16,padding:24,textAlign:"center"}}>
      <div style={{fontSize:"3rem"}}>💛</div>
      <div style={{fontFamily:"Syne",fontSize:"1.2rem",fontWeight:800}}>Thanks for rating!</div>
      <div style={{fontSize:"0.8rem",color:"var(--muted)"}}>+20 TooFan Coins earned 🪙</div>
      <button className="place-btn" style={{marginTop:8}} onClick={onDone}>Back to Home</button>
    </div>
  );

  if (stage === 3) return (
    <div className="screen" style={{paddingBottom:20}}>
      <div style={{background:"linear-gradient(135deg,#0d1a0a,#0A0A0F)",padding:"22px 14px",textAlign:"center"}}>
        <div style={{fontSize:"2.6rem",marginBottom:9,animation:"popIn 0.5s cubic-bezier(0.175,0.885,0.32,1.275)"}}>🎉</div>
        <div style={{fontFamily:"Syne",fontSize:"1.15rem",fontWeight:800,marginBottom:3}}>Order Delivered!</div>
        <div style={{fontSize:"0.76rem",color:"var(--muted)"}}>Bikash Tamang delivered your order</div>
      </div>
      <div style={{padding:"13px",display:"flex",flexDirection:"column",gap:10}}>
        <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,padding:12}}>
          <div style={{fontSize:"0.6rem",fontWeight:700,color:"var(--muted)",letterSpacing:"1px",textTransform:"uppercase",marginBottom:8}}>Summary</div>
          {[["Order","#TF-2077"],["From",restaurant?.name||"Momo House"],["Driver","Bikash Tamang"],["Time","17 min ⚡"]].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:"0.78rem",marginBottom:4}}>
              <span style={{color:"var(--muted)"}}>{k}</span>
              <span style={{fontWeight:600,color:k==="Time"?"var(--green)":undefined}}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{background:"rgba(245,200,66,0.07)",border:"1px solid rgba(245,200,66,0.2)",borderRadius:10,padding:"9px 12px",textAlign:"center",fontSize:"0.7rem",color:"var(--yellow)",fontWeight:700}}>
          🪙 +20 TooFan Coins earned this order!
        </div>
        <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,padding:12,textAlign:"center"}}>
          <div style={{fontSize:"0.68rem",fontWeight:600,color:"var(--muted)",marginBottom:8}}>Rate your driver</div>
          <div style={{display:"flex",justifyContent:"center",gap:7,marginBottom:12}}>
            {[1,2,3,4,5].map(s=>(
              <span key={s} onClick={()=>setRated(s)} style={{fontSize:"1.5rem",cursor:"pointer",opacity:s<=rated?1:0.2,transition:"all 0.15s"}}>⭐</span>
            ))}
          </div>
          <button className="place-btn" disabled={rated===0} onClick={()=>setSubmitted(true)} style={{opacity:rated===0?0.4:1}}>Submit Rating</button>
        </div>
        <button onClick={onDone} style={{background:"none",border:"1px solid var(--border)",borderRadius:10,padding:10,color:"var(--muted)",fontSize:"0.76rem",cursor:"pointer"}}>Back to Home</button>
      </div>
    </div>
  );

  const wp = WAYPOINTS[wpIdx];

  return (
    <div className="screen">
      <div className="menu-header" style={{position:"sticky",top:0,zIndex:20}}>
        <div className="back-btn" onClick={onDone}>←</div>
        <div className="menu-rest-name">{stage < 2 ? "Order Status" : "Live Tracking"}</div>
        {stage === 2 && (
          <div style={{marginLeft:"auto",fontSize:"0.65rem",color:"var(--green)",fontWeight:700,display:"flex",alignItems:"center",gap:4}}>
            <span style={{width:6,height:6,borderRadius:"50%",background:"var(--green)",display:"inline-block"}}/>LIVE
          </div>
        )}
      </div>

      {/* STAGES 0-1: Status screen */}
      {stage < 2 && (
        <div style={{padding:"18px 13px",display:"flex",flexDirection:"column",gap:12}}>
          <div style={{textAlign:"center",padding:"20px 0"}}>
            <div style={{fontSize:"2.8rem",animation:"spinAnim 2s linear infinite",display:"inline-block"}}>
              {stage === 0 ? "⏳" : "🍳"}
            </div>
            <div style={{fontFamily:"Syne",fontSize:"1.1rem",fontWeight:800,marginTop:11}}>{STAGE_DATA[stage].label}</div>
            <div style={{fontSize:"0.77rem",color:"var(--muted)",marginTop:3}}>{STAGE_DATA[stage].sub}</div>
          </div>
          {/* Timeline */}
          <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,padding:"13px 14px"}}>
            {STAGE_DATA.slice(0,4).map((s,i)=>{
              const done = i < stage, active = i === stage;
              return (
                <div key={s.key} style={{display:"flex",gap:11,paddingBottom:i<3?14:0,position:"relative"}}>
                  {i<3 && <div style={{position:"absolute",left:11,top:24,width:2,height:"calc(100% - 6px)",background:done?"var(--green)":"var(--border)",zIndex:0}}/>}
                  <div style={{width:24,height:24,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.72rem",zIndex:1,background:done?"var(--green)":active?"var(--orange)":"var(--card2)",border:`2px solid ${done?"var(--green)":active?"var(--orange)":"var(--border)"}`,boxShadow:active?"0 0 8px var(--orange)":"none"}}>
                    {done?"✓":s.icon}
                  </div>
                  <div style={{paddingTop:2}}>
                    <div style={{fontSize:"0.8rem",fontWeight:active?700:500,color:done||active?"var(--text)":"var(--muted)"}}>{s.label}</div>
                    {active && <div style={{fontSize:"0.65rem",color:"var(--orange)",marginTop:1}}>{s.sub}</div>}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Driver card shown from stage 1 */}
          {stage >= 1 && (
            <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,padding:12}}>
              <div style={{fontSize:"0.6rem",fontWeight:700,color:"var(--muted)",letterSpacing:"1px",textTransform:"uppercase",marginBottom:8}}>Your Driver</div>
              <div style={{display:"flex",alignItems:"center",gap:11}}>
                <div style={{width:44,height:44,borderRadius:"50%",background:"linear-gradient(135deg,var(--orange),var(--red))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.1rem",fontWeight:800,color:"white",flexShrink:0}}>B</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:"0.9rem"}}>Bikash Tamang</div>
                  <div style={{fontSize:"0.65rem",color:"var(--muted)",marginTop:1}}>⭐ 4.9 · 124 trips · Motorcycle</div>
                  <div style={{fontSize:"0.65rem",color:"var(--orange)",marginTop:2,fontWeight:600}}>ETA: ~{eta} min</div>
                </div>
                <button onClick={()=>setCallVis(v=>!v)} style={{width:36,height:36,borderRadius:"50%",background:"rgba(46,194,126,0.15)",border:"1px solid rgba(46,194,126,0.3)",fontSize:"1rem",cursor:"pointer"}}>📞</button>
              </div>
              {callVis && <div style={{marginTop:8,background:"var(--card2)",borderRadius:8,padding:"8px 11px",fontSize:"0.74rem",display:"flex",justifyContent:"space-between"}}>
                <span style={{color:"var(--muted)"}}>98-0123-4567</span>
                <span style={{color:"var(--green)",fontWeight:600}}>Tap to Call</span>
              </div>}
            </div>
          )}
        </div>
      )}

      {/* STAGE 2: Live map */}
      {stage === 2 && (
        <div>
          {/* ETA banner */}
          <div style={{background:"linear-gradient(135deg,var(--orange),var(--red))",padding:"11px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:"0.6rem",fontWeight:700,color:"rgba(255,255,255,0.7)",textTransform:"uppercase",letterSpacing:"1px"}}>ETA</div>
              <div style={{fontFamily:"Syne",fontSize:"1.55rem",fontWeight:900,color:"white",lineHeight:1.1}}>{eta} min</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:"0.65rem",color:"rgba(255,255,255,0.7)",marginBottom:1}}>Driver en route</div>
              <div style={{fontSize:"0.8rem",fontWeight:700,color:"white"}}>Bikash Tamang 🛵</div>
            </div>
          </div>

          {/* Tab bar: Map / Chat / SOS */}
          <div style={{display:"flex",background:"var(--darker)",borderBottom:"1px solid var(--border)"}}>
            {[["map","🗺️ Track"],["chat","💬 Chat"],["sos","🆘 Safety"]].map(([t,l])=>(
              <button key={t} onClick={()=>setTrackTab(t)} style={{flex:1,padding:"9px 4px",fontSize:"0.7rem",fontWeight:600,border:"none",background:"none",cursor:"pointer",color:trackTab===t?"var(--orange)":"var(--muted)",borderBottom:`2px solid ${trackTab===t?"var(--orange)":"transparent"}`}}>{l}</button>
            ))}
          </div>

          {/* MAP TAB */}
          {trackTab === "map" && (
            <div>
              <div style={{position:"relative",height:260}}>
                <iframe title="Live Tracking" width="100%" height="260"
                  style={{border:"none",display:"block",filter:"saturate(0.85) brightness(0.9)"}}
                  loading="lazy"
                  src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d3000!2d85.3135!3d27.7185!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f15!5e0!3m2!1sen!2snp!4v1711000000000!5m2!1sen!2snp"
                />
                {/* Customer pin */}
                <div style={{position:"absolute",top:"28%",left:"62%",transform:"translate(-50%,-100%)",zIndex:10,textAlign:"center"}}>
                  <div style={{background:"var(--green)",color:"white",padding:"3px 6px",borderRadius:6,fontSize:"0.55rem",fontWeight:700,whiteSpace:"nowrap",marginBottom:2}}>📍 You</div>
                  <div style={{width:0,height:0,borderLeft:"4px solid transparent",borderRight:"4px solid transparent",borderTop:"6px solid var(--green)",margin:"0 auto"}}/>
                </div>
                {/* Restaurant pin */}
                <div style={{position:"absolute",top:"72%",left:"37%",transform:"translate(-50%,-100%)",zIndex:10,textAlign:"center"}}>
                  <div style={{background:"var(--card)",border:"1px solid var(--border)",padding:"3px 6px",borderRadius:6,fontSize:"0.55rem",fontWeight:700,whiteSpace:"nowrap",marginBottom:2}}>🍱 {restaurant?.name||"Momo House"}</div>
                  <div style={{width:0,height:0,borderLeft:"4px solid transparent",borderRight:"4px solid transparent",borderTop:"6px solid var(--card)",margin:"0 auto"}}/>
                </div>
                {/* Moving driver pin */}
                <div style={{position:"absolute",top:`${wp.t}%`,left:`${wp.l}%`,transform:"translate(-50%,-50%)",zIndex:20,transition:"top 1.8s ease,left 1.8s ease"}}>
                  <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:40,height:40,borderRadius:"50%",background:"rgba(255,107,53,0.25)",animation:"drvPulse 1.5s ease-out infinite"}}/>
                  <div style={{width:32,height:32,borderRadius:"50%",background:"linear-gradient(135deg,var(--orange),var(--red))",border:"3px solid white",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.9rem",boxShadow:"0 3px 12px rgba(255,107,53,0.6)",position:"relative",zIndex:2}}>🛵</div>
                </div>
                <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:5}}>
                  <line x1="37%" y1="70%" x2="62%" y2="28%" stroke="var(--orange)" strokeWidth="2" strokeDasharray="6 4" opacity="0.45"/>
                </svg>
              </div>

              {/* Driver + timeline */}
              <div style={{padding:"11px 13px",display:"flex",flexDirection:"column",gap:9}}>
                <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,padding:11,display:"flex",alignItems:"center",gap:11}}>
                  <div style={{width:42,height:42,borderRadius:"50%",background:"linear-gradient(135deg,var(--orange),var(--red))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1rem",fontWeight:800,color:"white",flexShrink:0}}>B</div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:"0.85rem"}}>Bikash Tamang</div>
                    <div style={{fontSize:"0.63rem",color:"var(--muted)",marginTop:1}}>⭐ 4.9 · Motorcycle · Honda CB</div>
                    <div style={{fontSize:"0.63rem",marginTop:2,display:"flex",gap:5}}>
                      <span style={{background:"rgba(255,107,53,0.15)",color:"var(--orange)",padding:"2px 5px",borderRadius:3,fontWeight:600}}>On Delivery</span>
                      <span style={{color:"var(--muted)"}}>2.4 km away</span>
                    </div>
                  </div>
                  <button onClick={()=>setCallVis(v=>!v)} style={{width:36,height:36,borderRadius:"50%",background:"rgba(46,194,126,0.15)",border:"1px solid rgba(46,194,126,0.3)",fontSize:"0.95rem",cursor:"pointer"}}>📞</button>
                </div>
                {callVis && (
                  <div style={{background:"var(--card)",border:"1px solid rgba(46,194,126,0.3)",borderRadius:10,padding:"10px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div><div style={{fontSize:"0.6rem",color:"var(--muted)"}}>Driver Phone</div><div style={{fontWeight:700,fontSize:"0.85rem",marginTop:1}}>98-0123-4567</div></div>
                    <button style={{background:"var(--green)",color:"white",border:"none",borderRadius:8,padding:"6px 12px",fontWeight:700,fontSize:"0.72rem",cursor:"pointer"}}>📞 Call</button>
                  </div>
                )}
                {/* Step tracker */}
                <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:11,padding:"10px 12px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    {STAGE_DATA.map((s,i)=>(
                      <div key={s.key} style={{flex:1,textAlign:"center",position:"relative"}}>
                        {i < STAGE_DATA.length-1 && <div style={{position:"absolute",top:11,left:"50%",right:"-50%",height:2,background:i<stage?"var(--orange)":"var(--border)",zIndex:0}}/>}
                        <div style={{width:24,height:24,borderRadius:"50%",margin:"0 auto 4px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.68rem",position:"relative",zIndex:1,background:i<=stage?"var(--orange)":"var(--card2)",border:`2px solid ${i<=stage?"var(--orange)":"var(--border)"}`,boxShadow:i===stage?"0 0 7px var(--orange)":"none"}}>
                          {i<stage?"✓":s.icon}
                        </div>
                        <div style={{fontSize:"0.5rem",color:i<=stage?"var(--text)":"var(--muted)",fontWeight:i===stage?700:400}}>{s.label.split(" ")[0]}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CHAT TAB */}
          {trackTab === "chat" && (
            <div className="chat-wrap">
              <div className="chat-messages">
                {chatMsgs.map((m,i)=>(
                  <div key={i}>
                    <div className={`chat-bubble ${m.from}`}>{m.text}</div>
                    <div className="chat-time" style={{textAlign:m.from==="me"?"right":"left"}}>{m.time}</div>
                  </div>
                ))}
                <div ref={chatEnd}/>
              </div>
              <div style={{padding:"5px 13px 3px",display:"flex",gap:5,flexWrap:"wrap"}}>
                {["On my way 👍","Please hurry!","Wait at gate 2","Call me"].map(q=>(
                  <button key={q} onClick={()=>setChatMsgs(m=>[...m,{from:"me",text:q,time:"Now"}])} style={{fontSize:"0.62rem",padding:"3px 8px",borderRadius:10,background:"var(--card2)",border:"1px solid var(--border)",color:"var(--muted)",cursor:"pointer"}}>{q}</button>
                ))}
              </div>
              <div className="chat-input-row">
                <input className="chat-input" placeholder="Message driver…" value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendChat()}/>
                <button className="chat-send" onClick={sendChat}>➤</button>
              </div>
            </div>
          )}

          {/* SOS TAB */}
          {trackTab === "sos" && (
            <div style={{padding:"16px 13px",display:"flex",flexDirection:"column",gap:11}}>
              <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,padding:13}}>
                <div style={{fontSize:"0.6rem",fontWeight:700,color:"var(--muted)",letterSpacing:"1px",textTransform:"uppercase",marginBottom:8}}>Emergency SOS</div>
                <div style={{fontSize:"0.78rem",color:"var(--muted)",marginBottom:12,lineHeight:1.6}}>Your ride is being tracked. Tap SOS to instantly alert TooFan safety team and emergency services.</div>
                <button onClick={()=>setSosActive(v=>!v)} style={{width:"100%",padding:"13px",background:sosActive?"rgba(239,68,68,0.12)":"var(--red)",color:"white",border:sosActive?"2px solid var(--red)":"none",borderRadius:10,fontFamily:"Syne",fontWeight:800,fontSize:"0.92rem",cursor:"pointer"}}>
                  {sosActive?"🚨 SOS SENT — Help on the way":"🆘 Send SOS Emergency Alert"}
                </button>
                {sosActive && <div style={{marginTop:6,fontSize:"0.68rem",color:"var(--red)",fontWeight:600,textAlign:"center"}}>Safety Team notified · Police: 100 · Ambulance: 102</div>}
              </div>
              <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,padding:13}}>
                <div style={{fontSize:"0.6rem",fontWeight:700,color:"var(--muted)",letterSpacing:"1px",textTransform:"uppercase",marginBottom:8}}>Share Trip</div>
                {["Share live location with family","Share details via WhatsApp"].map(a=>(
                  <div key={a} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                    <span style={{fontSize:"0.78rem"}}>{a}</span>
                    <button style={{background:"var(--card2)",border:"1px solid var(--border)",borderRadius:6,padding:"4px 9px",color:"var(--text)",fontSize:"0.65rem",cursor:"pointer",fontWeight:600}}>Share</button>
                  </div>
                ))}
              </div>
              <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,padding:13}}>
                <div style={{fontSize:"0.6rem",fontWeight:700,color:"var(--muted)",letterSpacing:"1px",textTransform:"uppercase",marginBottom:8}}>Emergency Numbers</div>
                {[["🚔 Police","100"],["🚑 Ambulance","102"],["🔥 Fire","101"],["📞 TooFan","1660-TOOFAN"]].map(([n,num])=>(
                  <div key={n} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid rgba(255,255,255,0.04)",fontSize:"0.78rem"}}>
                    <span>{n}</span><span style={{color:"var(--blue)",fontWeight:600}}>{num}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── KHANA APP ─────────────────────────────────────────────────────────
function KhanaApp() {
  const [view, setView]             = useState("home");
  const [activeRest, setActiveRest] = useState(null);
  const [cart, setCart]             = useState({});
  const [activeCat, setActiveCat]   = useState("All");
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [searchQ, setSearchQ]       = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [coupon, setCoupon]         = useState("");
  const [appliedCoupon, setApplied] = useState(null);
  const [couponErr, setCouponErr]   = useState("");
  const [schedule, setSchedule]     = useState("Now");
  const [favs, setFavs]             = useState(new Set([1,6]));
  const [coins, setCoins]           = useState(340);
  const [wallet, setWallet]         = useState(500);
  const [bnav, setBnav]             = useState("home");

  const cartCount = Object.values(cart).reduce((a,b)=>a+b,0);
  const cartTotal = activeRest ? (MENU[activeRest.id]||[]).reduce((s,i)=>s+(cart[i.id]||0)*i.price,0) : 0;
  const addItem    = id => setCart(c => ({...c,[id]:(c[id]||0)+1}));
  const removeItem = id => setCart(c => { const n={...c}; if(n[id]>1) n[id]--; else delete n[id]; return n; });

  const applyDisc = sub => {
    if (!appliedCoupon) return 0;
    const c = COUPONS[appliedCoupon];
    return c.type==="pct" ? Math.min(Math.round(sub*c.val/100), c.max||9999) : c.val;
  };

  const handleCoupon = () => {
    const k = coupon.trim().toUpperCase();
    if (COUPONS[k]) { setApplied(k); setCouponErr(""); }
    else setCouponErr("Invalid code. Try: TOOFAN50 · FLAT100");
  };

  const toggleFav = (id, e) => {
    e.stopPropagation();
    setFavs(f => { const n = new Set(f); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const suggestions = searchQ.length > 0 ? [
    ...RESTAURANTS.filter(r=>r.name.toLowerCase().includes(searchQ.toLowerCase())).map(r=>({type:"rest",label:r.name,sub:r.cuisine,img:r.img,id:r.id})),
    ...ALL_ITEMS.filter(i=>i.name.toLowerCase().includes(searchQ.toLowerCase())).slice(0,3).map(i=>({type:"item",label:i.name,sub:`रू${i.price}`,img:i.img})),
  ] : [];

  if (orderPlaced) {
    return <LiveTrackingScreen onDone={()=>{setOrderPlaced(false);setView("home");setCart({});setCoins(c=>c+20);}} restaurant={activeRest}/>;
  }

  // CART VIEW
  if (view === "cart") {
    const items = (MENU[activeRest?.id]||[]).filter(i=>cart[i.id]);
    const sub   = items.reduce((s,i)=>s+cart[i.id]*i.price, 0);
    const disc  = applyDisc(sub);
    const total = sub + 70 - disc;
    return (
      <div className="screen" style={{paddingBottom:80}}>
        <div className="menu-header">
          <div className="back-btn" onClick={()=>setView("menu")}>←</div>
          <div className="menu-rest-name">Your Cart</div>
        </div>
        <div className="order-confirm">
          <div className="order-section">
            <div className="order-section-title">Items from {activeRest?.name}</div>
            {items.map(i=>(
              <div key={i.id} className="order-item-row">
                <span>{i.img} {i.name} × {cart[i.id]}</span>
                <span style={{color:"var(--orange)",fontWeight:600}}>रू{i.price*cart[i.id]}</span>
              </div>
            ))}
            <hr className="order-divider"/>
            <div className="order-item-row"><span>Subtotal</span><span>रू{sub}</span></div>
            <div className="order-item-row"><span style={{color:"var(--muted)"}}>Delivery + Platform Fee</span><span style={{color:"var(--muted)"}}>रू70</span></div>
            {disc>0 && <div className="order-item-row"><span style={{color:"var(--green)"}}>🏷️ {appliedCoupon}</span><span style={{color:"var(--green)"}}>−रू{disc}</span></div>}
            <hr className="order-divider"/>
            <div className="order-total-row"><span>Total</span><span style={{color:"var(--red)"}}>रू{total}</span></div>
          </div>

          {/* PROMO CODE */}
          <div className="order-section">
            <div className="order-section-title">Promo Code</div>
            {appliedCoupon ? (
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{color:"var(--green)",fontSize:"0.8rem",fontWeight:600}}>✓ {COUPONS[appliedCoupon].desc}</span>
                <button onClick={()=>{setApplied(null);setCoupon("");}} style={{background:"none",border:"none",color:"var(--muted)",fontSize:"0.72rem",cursor:"pointer"}}>Remove</button>
              </div>
            ) : (
              <>
                <div className="coupon-row">
                  <input className="coupon-input" placeholder="Enter code e.g. TOOFAN50" value={coupon} onChange={e=>setCoupon(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleCoupon()}/>
                  <button className="coupon-btn" onClick={handleCoupon}>Apply</button>
                </div>
                {couponErr && <div style={{fontSize:"0.65rem",color:"var(--red)",marginTop:3}}>{couponErr}</div>}
                <div style={{display:"flex",gap:5,marginTop:7,flexWrap:"wrap"}}>
                  {Object.keys(COUPONS).map(k=>(
                    <span key={k} onClick={()=>setCoupon(k)} style={{fontSize:"0.6rem",background:"var(--card2)",border:"1px dashed var(--border)",padding:"2px 7px",borderRadius:5,cursor:"pointer",color:"var(--muted)"}}>{k}</span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* SCHEDULE */}
          <div className="order-section">
            <div className="order-section-title">Delivery Time</div>
            <div className="schedule-row">
              {["Now","In 30 min","In 1 hour","Schedule"].map(s=>(
                <div key={s} className={`schedule-pill ${schedule===s?"active":""}`} onClick={()=>setSchedule(s)}>{s}</div>
              ))}
            </div>
          </div>

          {/* ADDRESS + PAYMENT */}
          <div className="order-section">
            <div className="order-section-title">Address · Payment</div>
            <div style={{fontSize:"0.8rem",marginBottom:7}}>📍 Thamel, Kathmandu, 44600</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {["💵 Cash","💳 eSewa","🏦 Khalti"].map(p=>(
                <div key={p} style={{fontSize:"0.65rem",background:"var(--card2)",border:"1px solid var(--border)",borderRadius:6,padding:"4px 9px",cursor:"pointer",color:"var(--muted)"}}>{p}</div>
              ))}
            </div>
            {wallet >= total && <div style={{marginTop:7,fontSize:"0.7rem",color:"var(--blue)"}}>💰 Wallet: रू{wallet} available</div>}
          </div>

          <button className="place-btn" onClick={()=>{setOrderPlaced(true);setWallet(w=>Math.max(0,w-total));}}>
            Place Order{schedule!=="Now"?` · ${schedule}`:""} · रू{total}
          </button>
        </div>
      </div>
    );
  }

  // MENU VIEW
  if (view === "menu" && activeRest) {
    const items = MENU[activeRest.id]||[];
    return (
      <div className="screen" style={{paddingBottom:cartCount>0?115:55}}>
        <div className="menu-header">
          <div className="back-btn" onClick={()=>setView("home")}>←</div>
          <div style={{flex:1}}>
            <div className="menu-rest-name">{activeRest.img} {activeRest.name}</div>
            <div style={{fontSize:"0.64rem",color:"var(--muted)"}}>⭐ {activeRest.rating} · {activeRest.time} min</div>
          </div>
          <button onClick={e=>toggleFav(activeRest.id,e)} style={{background:"none",border:"none",fontSize:"1.1rem",cursor:"pointer"}}>{favs.has(activeRest.id)?"❤️":"🤍"}</button>
        </div>
        {activeRest.discount>0 && (
          <div style={{background:"rgba(46,194,126,0.1)",border:"1px solid rgba(46,194,126,0.2)",margin:"9px 13px",borderRadius:9,padding:"7px 11px",fontSize:"0.7rem",color:"var(--green)",fontWeight:600}}>
            🎉 {activeRest.discount}% OFF on this restaurant today!
          </div>
        )}
        <div className="menu-items">
          {items.map(item=>(
            <div key={item.id} className="menu-item">
              <span className="item-emoji">{item.img}</span>
              <span className="item-name">{item.name}</span>
              <span className="item-price">रू{item.price}</span>
              {cart[item.id] ? (
                <div className="qty-ctrl">
                  <button className="qty-btn" onClick={()=>removeItem(item.id)}>−</button>
                  <span className="qty-num">{cart[item.id]}</span>
                  <button className="qty-btn" style={{background:"var(--red)",color:"white",border:"none"}} onClick={()=>addItem(item.id)}>+</button>
                </div>
              ) : (
                <button className="add-btn" onClick={()=>addItem(item.id)}>+</button>
              )}
            </div>
          ))}
        </div>
        {cartCount > 0 && (
          <div className="cart-bar" onClick={()=>setView("cart")}>
            <div className="cart-info">{cartCount} item{cartCount>1?"s":""} · {activeRest.name}</div>
            <div className="cart-total">रू{cartTotal} →</div>
          </div>
        )}
      </div>
    );
  }

  // ORDER HISTORY
  if (bnav === "history") return (
    <div className="screen" style={{paddingBottom:70}}>
      <div style={{padding:"16px 14px 9px",fontFamily:"Syne",fontWeight:800,fontSize:"1rem"}}>Order History</div>
      {ORDER_HISTORY.map(o=>(
        <div key={o.id} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,padding:12,margin:"0 13px 8px"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
            <div style={{fontWeight:600,fontSize:"0.84rem"}}>{o.rest}</div>
            <span style={{fontSize:"0.58rem",fontWeight:700,padding:"2px 6px",borderRadius:4,background:o.status==="Delivered"?"rgba(46,194,126,0.15)":"rgba(239,68,68,0.1)",color:o.status==="Delivered"?"var(--green)":"var(--red)"}}>{o.status}</span>
          </div>
          <div style={{fontSize:"0.7rem",color:"var(--muted)",marginBottom:7}}>{o.items} · रू{o.total} · {o.date}</div>
          <button onClick={()=>{setActiveRest(RESTAURANTS.find(r=>r.id===o.restId));setView("menu");setCart({});setBnav("home");}} style={{width:"100%",padding:"7px",background:"var(--card2)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text)",fontSize:"0.74rem",fontWeight:600,cursor:"pointer"}}>🔄 Reorder</button>
        </div>
      ))}
      <div style={{height:70}}/>
      <div className="bottom-nav">
        {[["home","🏠","Home"],["search","🔍","Search"],["history","📦","Orders"],["profile","👤","Profile"]].map(([id,ico,lbl])=>(
          <button key={id} className={`bnav-item ${bnav===id?"active":""}`} onClick={()=>setBnav(id)}><span className="bnav-icon">{ico}</span>{lbl}</button>
        ))}
      </div>
    </div>
  );

  // PROFILE
  if (bnav === "profile") return (
    <div className="screen" style={{paddingBottom:70}}>
      <div style={{background:"linear-gradient(135deg,#1a0a0a,#0A0A0F)",padding:"22px 14px 16px",textAlign:"center"}}>
        <div style={{width:56,height:56,borderRadius:"50%",background:"linear-gradient(135deg,var(--red),var(--orange))",margin:"0 auto 9px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.3rem",fontWeight:800,color:"white"}}>N</div>
        <div style={{fontFamily:"Syne",fontWeight:800,fontSize:"1rem"}}>Nabin Sharma</div>
        <div style={{fontSize:"0.68rem",color:"var(--muted)",marginTop:2}}>nabin@example.com</div>
      </div>
      <div style={{padding:"12px 13px 0",display:"flex",gap:9}}>
        <div style={{flex:1,background:"var(--card)",border:"1px solid rgba(245,200,66,0.2)",borderRadius:11,padding:12,textAlign:"center"}}>
          <div style={{fontSize:"1.1rem",marginBottom:2}}>🪙</div>
          <div style={{fontFamily:"Syne",fontWeight:800,fontSize:"1.1rem",color:"var(--yellow)"}}>{coins}</div>
          <div style={{fontSize:"0.57rem",color:"var(--muted)",marginTop:1}}>TooFan Coins · रू{Math.floor(coins/10)} off</div>
        </div>
        <div style={{flex:1,background:"var(--card)",border:"1px solid rgba(74,158,255,0.2)",borderRadius:11,padding:12,textAlign:"center"}}>
          <div style={{fontSize:"1.1rem",marginBottom:2}}>💰</div>
          <div style={{fontFamily:"Syne",fontWeight:800,fontSize:"1.1rem",color:"var(--blue)"}}>रू{wallet}</div>
          <div style={{fontSize:"0.57rem",color:"var(--muted)",marginTop:1}}>TooFan Wallet</div>
        </div>
      </div>
      <div style={{padding:"11px 13px",display:"flex",flexDirection:"column",gap:6}}>
        {[["📦 My Orders","All past orders"],["📍 Saved Addresses","Home, Work…"],["💳 Payments","eSewa, Khalti, Cards"],["🎁 Refer & Earn","रू100 per referral"],["⚙️ Settings","Notifications, Privacy"],["🆘 Help","Chat, Call, FAQ"]].map(([t,s])=>(
          <div key={t} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:11,padding:"11px 12px",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}}>
            <div><div style={{fontSize:"0.82rem",fontWeight:500}}>{t}</div><div style={{fontSize:"0.63rem",color:"var(--muted)",marginTop:1}}>{s}</div></div>
            <span style={{color:"var(--muted)"}}>›</span>
          </div>
        ))}
      </div>
      <div className="bottom-nav">
        {[["home","🏠","Home"],["search","🔍","Search"],["history","📦","Orders"],["profile","👤","Profile"]].map(([id,ico,lbl])=>(
          <button key={id} className={`bnav-item ${bnav===id?"active":""}`} onClick={()=>setBnav(id)}><span className="bnav-icon">{ico}</span>{lbl}</button>
        ))}
      </div>
    </div>
  );

  // HOME
  const cats    = ["All","Nepali","Indian","Fast Food","Cafe","Mughlai"];
  const filtered = activeCat==="All" ? RESTAURANTS : RESTAURANTS.filter(r=>r.cuisine===activeCat);

  return (
    <div className="screen" style={{paddingBottom:70}}>
      {/* HERO + SEARCH */}
      <div className="khana-hero">
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
          <div className="khana-greeting">🌪️ Namaste! Ke khana mann lagyo?</div>
          <div style={{display:"flex",gap:7,alignItems:"center"}}>
            <span style={{fontSize:"0.67rem",color:"var(--yellow)"}}>🪙 {coins}</span>
            <span style={{fontSize:"0.67rem",color:"var(--blue)"}}>💰 रू{wallet}</span>
          </div>
        </div>
        <div className="khana-title">Order <span>TooFan</span><br/>Fast & Fresh</div>
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input className="search-input" placeholder="Search restaurants or dishes…" value={searchQ}
            onChange={e=>{setSearchQ(e.target.value);setSearchOpen(true);}}
            onFocus={()=>setSearchOpen(true)}
            onBlur={()=>setTimeout(()=>setSearchOpen(false),150)}
          />
          {searchOpen && suggestions.length > 0 && (
            <div className="search-suggestions">
              {suggestions.map((s,i)=>(
                <div key={i} className="sug-item" onClick={()=>{
                  if(s.type==="rest"){const r=RESTAURANTS.find(x=>x.id===s.id);if(r){setActiveRest(r);setView("menu");setCart({});}}
                  setSearchQ(""); setSearchOpen(false);
                }}>
                  <span style={{fontSize:"1.1rem"}}>{s.img}</span>
                  <div>
                    <div style={{fontWeight:600,fontSize:"0.8rem"}}>{s.label}</div>
                    <div style={{fontSize:"0.62rem",color:"var(--muted)"}}>{s.type==="rest"?"🍽️ Restaurant":"🍴 Dish"} · {s.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* WALLET STRIP */}
      <div className="wallet-strip">
        <div className="wallet-card" style={{border:"1px solid rgba(245,200,66,0.2)"}}>
          <span style={{fontSize:"1rem"}}>🪙</span>
          <div><div className="wallet-val" style={{color:"var(--yellow)"}}>{coins} Coins</div><div className="wallet-lbl">= रू{Math.floor(coins/10)} off</div></div>
        </div>
        <div className="wallet-card" style={{border:"1px solid rgba(74,158,255,0.2)"}}>
          <span style={{fontSize:"1rem"}}>💰</span>
          <div><div className="wallet-val" style={{color:"var(--blue)"}}>रू{wallet}</div><div className="wallet-lbl">TooFan Wallet</div></div>
        </div>
        <div className="wallet-card" style={{cursor:"pointer",border:"1px dashed var(--border)"}} onClick={()=>{}}>
          <span style={{fontSize:"1rem"}}>🎁</span>
          <div><div className="wallet-val" style={{color:"var(--green)"}}>Refer</div><div className="wallet-lbl">+रू100 each</div></div>
        </div>
      </div>

      {/* FLASH DEALS */}
      <div style={{padding:"0 14px"}}>
        <div style={{fontFamily:"Syne",fontSize:"0.88rem",fontWeight:700,padding:"8px 0 7px"}}>⚡ Flash Deals</div>
        <div className="flash-scroll">
          {FLASH_DEALS.map(d=>(
            <div key={d.id} className="flash-card" style={{background:d.color}}>
              <div style={{fontSize:"1.4rem",marginBottom:5}}>{d.icon}</div>
              <div className="flash-title">{d.title}</div>
              <div className="flash-sub">{d.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CATEGORIES */}
      <div className="categories">
        {cats.map(c=><div key={c} className={`cat-pill ${activeCat===c?"active":""}`} onClick={()=>setActiveCat(c)}>{c}</div>)}
      </div>

      {/* FAVOURITES */}
      {favs.size > 0 && (
        <div style={{padding:"10px 14px 0"}}>
          <div style={{fontSize:"0.67rem",fontWeight:700,color:"var(--muted)",letterSpacing:"1px",textTransform:"uppercase",marginBottom:7}}>❤️ Favourites</div>
          <div style={{display:"flex",gap:7,overflowX:"auto"}}>
            {RESTAURANTS.filter(r=>favs.has(r.id)).map(r=>(
              <div key={r.id} onClick={()=>{setActiveRest(r);setView("menu");setCart({});}} style={{background:"var(--card)",border:"1px solid rgba(230,57,70,0.2)",borderRadius:10,padding:"7px 11px",display:"flex",alignItems:"center",gap:7,cursor:"pointer",flexShrink:0}}>
                <span style={{fontSize:"1.1rem"}}>{r.img}</span>
                <div><div style={{fontSize:"0.74rem",fontWeight:600}}>{r.name}</div><div style={{fontSize:"0.6rem",color:"var(--muted)"}}>{r.time} min</div></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* REORDER LAST */}
      <div style={{padding:"10px 14px 0"}}>
        <div style={{fontSize:"0.67rem",fontWeight:700,color:"var(--muted)",letterSpacing:"1px",textTransform:"uppercase",marginBottom:7}}>🔄 Reorder Last</div>
        <div onClick={()=>{const o=ORDER_HISTORY[0];const r=RESTAURANTS.find(x=>x.id===o.restId);if(r){setActiveRest(r);setView("menu");setCart({});}}} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:11,padding:"9px 12px",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}}>
          <div>
            <div style={{fontWeight:600,fontSize:"0.82rem"}}>{ORDER_HISTORY[0].rest}</div>
            <div style={{fontSize:"0.64rem",color:"var(--muted)",marginTop:1}}>{ORDER_HISTORY[0].items} · {ORDER_HISTORY[0].date}</div>
          </div>
          <span style={{background:"var(--red)",color:"white",fontSize:"0.67rem",fontWeight:700,padding:"4px 9px",borderRadius:6}}>Reorder</span>
        </div>
      </div>

      {/* RESTAURANT GRID */}
      <div className="section-title">🔥 Restaurants Near You</div>
      <div className="restaurant-grid">
        {filtered.map(r=>(
          <div key={r.id} className="rest-card" onClick={()=>{setActiveRest(r);setView("menu");setCart({});}}>
            <div className="rest-img-box">
              {r.img}
              {r.tag && <div className="rest-tag">{r.tag}</div>}
              {r.discount>0 && <div className="rest-disc">{r.discount}%OFF</div>}
              <button className="rest-fav" onClick={e=>toggleFav(r.id,e)}>{favs.has(r.id)?"❤️":"🤍"}</button>
            </div>
            <div className="rest-info">
              <div className="rest-name">{r.name}</div>
              <div className="rest-meta"><span>⭐ {r.rating}</span><span>🕑 {r.time}m</span></div>
              <div style={{fontSize:"0.62rem",color:"var(--muted)",marginTop:2}}>{r.cuisine}</div>
            </div>
          </div>
        ))}
      </div>

      {/* BOTTOM NAV */}
      <div className="bottom-nav">
        {[["home","🏠","Home"],["search","🔍","Search"],["history","📦","Orders"],["profile","👤","Profile"]].map(([id,ico,lbl])=>(
          <button key={id} className={`bnav-item ${bnav===id?"active":""}`} onClick={()=>setBnav(id)}><span className="bnav-icon">{ico}</span>{lbl}</button>
        ))}
      </div>
    </div>
  );
}

// ── DRIVER APP ────────────────────────────────────────────────────────
function DriverApp() {
  const ME = DRIVER_POOL[0];
  const [online, setOnline]               = useState(true);
  const [dispatchPhase, setDispatchPhase] = useState("idle");
  const [dispatchLog, setDispatchLog]     = useState([]);
  const [offerTimer, setOfferTimer]       = useState(30);
  const [activeDelivery, setActiveDelivery] = useState(null);
  const [completed, setCompleted]         = useState(false);
  const [earnings, setEarnings]           = useState(1280);
  const [todayTrips, setTodayTrips]       = useState(9);
  const [driverTab, setDriverTab]         = useState("dispatch");
  const timerRef = useRef(null);

  const triggerDispatch = () => {
    setDispatchPhase("searching"); setDispatchLog([]); setCompleted(false);
    const eligible = DRIVER_POOL.map(d=>({...d,score:calcScore(d)})).filter(d=>d.score>=0).sort((a,b)=>b.score-a.score);
    let log=[], delay=400;
    eligible.forEach((d,i)=>{setTimeout(()=>{log.push({...d,rank:i+1});setDispatchLog([...log]);},delay);delay+=320;});
    setTimeout(()=>{setDispatchPhase("offering");setOfferTimer(30);},delay+400);
  };

  useEffect(()=>{
    if(dispatchPhase!=="offering") return;
    timerRef.current=setInterval(()=>{setOfferTimer(t=>{if(t<=1){clearInterval(timerRef.current);setDispatchPhase("idle");setDispatchLog([]);return 0;}return t-1;});},1000);
    return ()=>clearInterval(timerRef.current);
  },[dispatchPhase]);

  const acceptOrder = () => {
    clearInterval(timerRef.current); setDispatchPhase("delivering");
    setActiveDelivery({id:"TF-2099",customer:"Aarav Sharma",restaurant:"Momo House",pickup:"Momo House, Thamel",drop:"Lazimpat Gate 4",items:"Veg Momo x2, Jhol Momo x1",earn:65,distKm:2.4});
  };
  const rejectOrder = () => { clearInterval(timerRef.current); setDispatchPhase("idle"); setDispatchLog([]); };
  const markDelivered = () => { setDispatchPhase("done"); setCompleted(true); setEarnings(e=>e+(activeDelivery?.earn||65)); setTodayTrips(t=>t+1); };
  const reset = () => { setDispatchPhase("idle"); setActiveDelivery(null); setCompleted(false); setDispatchLog([]); };

  const ranked = [...DRIVER_POOL].map(d=>({...d,score:calcScore(d)})).sort((a,b)=>b.score-a.score);
  const weeklyTarget=5000, weeklyEarned=3420;

  return (
    <div className="screen" style={{paddingBottom:24}}>
      {/* HERO */}
      <div className="driver-hero">
        <div className="driver-status-row">
          <div>
            <div style={{fontSize:"0.67rem",color:"var(--muted)"}}>TooFan Driver</div>
            <div className="driver-name">{ME.name}</div>
          </div>
          <div className="driver-status-toggle" onClick={()=>{setOnline(o=>!o);if(online)reset();}}>
            <div className={`status-dot ${online?"online":"offline"}`}/>
            <span className="status-text">{online?"Online":"Offline"}</span>
          </div>
        </div>
        <div className="driver-stats">
          <div className="stat-card"><div className="stat-val">{ME.trips+todayTrips-9}</div><div className="stat-label">Total Trips</div></div>
          <div className="stat-card"><div className="stat-val" style={{color:"var(--yellow)"}}>⭐ {ME.rating}</div><div className="stat-label">Rating</div></div>
          <div className="stat-card"><div className="stat-val" style={{color:"var(--green)"}}>रू{(earnings/1000).toFixed(1)}k</div><div className="stat-label">Today</div></div>
        </div>
      </div>

      {/* DRIVER TABS */}
      <div className="driver-tabs">
        {[["dispatch","📡 Dispatch"],["incentives","💰 Incentives"],["surge","🔥 Surge Map"],["history","📋 History"]].map(([id,lbl])=>(
          <button key={id} className={`d-tab ${driverTab===id?"active":""}`} onClick={()=>setDriverTab(id)}>{lbl}</button>
        ))}
      </div>

      {/* DISPATCH TAB */}
      {driverTab==="dispatch" && (
        <>
          {!online && (
            <div style={{margin:13,background:"var(--card)",border:"1px solid var(--border)",borderRadius:13,padding:22,textAlign:"center"}}>
              <div style={{fontSize:"2rem",marginBottom:7}}>😴</div>
              <div style={{fontWeight:600}}>You're Offline</div>
              <div style={{fontSize:"0.75rem",color:"var(--muted)",marginTop:3}}>Go online to receive orders</div>
            </div>
          )}

          {online && dispatchPhase==="idle" && (
            <div style={{margin:13,display:"flex",flexDirection:"column",gap:11}}>
              <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:13,padding:17,textAlign:"center"}}>
                <div style={{fontSize:"1.8rem",marginBottom:6,animation:"radarSpin 3s linear infinite",display:"inline-block"}}>📡</div>
                <div style={{fontWeight:600,fontSize:"0.9rem"}}>Scanning for orders…</div>
                <div style={{fontSize:"0.72rem",color:"var(--muted)",marginTop:3,marginBottom:13}}>Dispatch pool · {DISPATCH_RADIUS_KM} km radius</div>
                <button className="accept-btn" style={{width:"100%"}} onClick={triggerDispatch}>⚡ Simulate New Order</button>
              </div>
              {/* Rankings */}
              <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:13,overflow:"hidden"}}>
                <div style={{padding:"9px 13px",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between"}}>
                  <span style={{fontSize:"0.67rem",fontWeight:700,color:"var(--muted)",letterSpacing:"1px",textTransform:"uppercase"}}>Nearby Rankings</span>
                  <span style={{fontSize:"0.62rem",color:"var(--orange)",fontWeight:600}}>📡 {DISPATCH_RADIUS_KM} km</span>
                </div>
                {ranked.map((d,i)=>{
                  const inRange = d.distKm<=DISPATCH_RADIUS_KM && d.status!=="offline";
                  const isMe    = d.id===ME.id;
                  return (
                    <div key={d.id} style={{display:"flex",alignItems:"center",gap:9,padding:"8px 13px",borderBottom:"1px solid rgba(255,255,255,0.04)",background:isMe?"rgba(255,107,53,0.06)":"transparent",opacity:inRange?1:0.4}}>
                      <div style={{width:21,height:21,borderRadius:"50%",flexShrink:0,background:i===0?"var(--orange)":"transparent",border:`1px solid ${i===0?"var(--orange)":"var(--border)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.58rem",fontWeight:700,color:i===0?"white":"var(--muted)"}}>{inRange?i+1:"—"}</div>
                      <div style={{width:29,height:29,borderRadius:"50%",background:`${d.color}22`,border:`2px solid ${d.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.62rem",fontWeight:700,color:d.color,flexShrink:0}}>{d.initials}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:"0.78rem",fontWeight:600,display:"flex",alignItems:"center",gap:4}}>
                          {d.name}
                          {isMe && <span style={{fontSize:"0.5rem",background:"var(--orange)",color:"white",padding:"1px 4px",borderRadius:3,fontWeight:700}}>YOU</span>}
                        </div>
                        <div style={{fontSize:"0.6rem",color:"var(--muted)"}}>{d.distKm} km · ⭐ {d.rating}</div>
                      </div>
                      {inRange ? (
                        <div style={{textAlign:"right"}}>
                          <div style={{fontSize:"0.67rem",fontWeight:700,color:d.score>=70?"var(--green)":d.score>=50?"var(--orange)":"var(--muted)"}}>{d.score}pts</div>
                          <div style={{width:38,height:3,background:"var(--card2)",borderRadius:2,marginTop:2}}>
                            <div style={{width:`${d.score}%`,height:"100%",borderRadius:2,background:d.score>=70?"var(--green)":d.score>=50?"var(--orange)":"var(--muted)"}}/>
                          </div>
                        </div>
                      ) : <span style={{fontSize:"0.6rem",color:"var(--muted)"}}>{d.status==="offline"?"Offline":"Out of range"}</span>}
                    </div>
                  );
                })}
                <div style={{padding:"7px 13px",borderTop:"1px solid var(--border)",fontSize:"0.57rem",color:"var(--muted)",fontFamily:"monospace"}}>
                  Score = (1−dist/5km)×60 + (rating−1)/4×40
                </div>
              </div>
            </div>
          )}

          {online && dispatchPhase==="searching" && (
            <div style={{margin:13,display:"flex",flexDirection:"column",gap:10}}>
              <div style={{background:"var(--card)",border:"2px solid var(--orange)",borderRadius:13,padding:17,textAlign:"center"}}>
                <div style={{fontSize:"1.8rem",marginBottom:5,animation:"radarSpin 1s linear infinite",display:"inline-block"}}>📡</div>
                <div style={{fontFamily:"Syne",fontWeight:800,fontSize:"0.95rem",color:"var(--orange)"}}>Scanning Nearby Drivers</div>
              </div>
              {dispatchLog.length>0 && (
                <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:13,overflow:"hidden"}}>
                  {dispatchLog.map((d,i)=>(
                    <div key={d.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 13px",borderBottom:"1px solid rgba(255,255,255,0.04)",animation:"fadeSlideIn 0.3s ease"}}>
                      <div style={{fontSize:"0.6rem",fontWeight:700,color:"var(--orange)",minWidth:17,fontFamily:"monospace"}}>#{i+1}</div>
                      <div style={{width:27,height:27,borderRadius:"50%",background:`${d.color}22`,border:`2px solid ${d.color}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.62rem",fontWeight:700,color:d.color,flexShrink:0}}>{d.initials}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:"0.77rem",fontWeight:600}}>{d.name}</div>
                        <div style={{fontSize:"0.58rem",color:"var(--muted)"}}>📍 {d.distKm} km · ⭐ {d.rating}</div>
                      </div>
                      <span style={{fontSize:"0.7rem",fontWeight:700,color:"var(--green)"}}>✓ {d.score}pts</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {online && dispatchPhase==="offering" && (
            <div style={{margin:13}}>
              <div style={{background:"var(--card)",border:"2px solid var(--orange)",borderRadius:15,padding:15,boxShadow:"0 0 18px rgba(255,107,53,0.2)",animation:"borderPulse 1.2s ease-in-out infinite",position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,left:"-100%",width:"60%",height:"100%",background:"linear-gradient(90deg,transparent,rgba(255,107,53,0.06),transparent)",animation:"glowSweep 2s linear infinite",pointerEvents:"none"}}/>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:9}}>
                  <div>
                    <div style={{fontSize:"0.57rem",fontWeight:700,color:"var(--orange)",letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:2}}>🔔 Job Offer · #1 Ranked</div>
                    <div style={{fontFamily:"Syne",fontSize:"1rem",fontWeight:800}}>Order #TF-2099</div>
                  </div>
                  <div style={{position:"relative",width:46,height:46,flexShrink:0}}>
                    <svg width="46" height="46" style={{transform:"rotate(-90deg)"}}>
                      <circle cx="23" cy="23" r="19" fill="none" stroke="var(--card2)" strokeWidth="4"/>
                      <circle cx="23" cy="23" r="19" fill="none" stroke={offerTimer>10?"var(--orange)":"var(--red)"} strokeWidth="4"
                        strokeDasharray={`${2*Math.PI*19}`}
                        strokeDashoffset={`${2*Math.PI*19*(1-offerTimer/30)}`}
                        style={{transition:"stroke-dashoffset 1s linear,stroke 0.3s"}}/>
                    </svg>
                    <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Syne",fontWeight:800,fontSize:"0.92rem",color:offerTimer>10?"var(--orange)":"var(--red)"}}>{offerTimer}</div>
                  </div>
                </div>
                <div style={{background:"rgba(255,107,53,0.08)",border:"1px solid rgba(255,107,53,0.2)",borderRadius:8,padding:"6px 10px",marginBottom:11,fontSize:"0.67rem",display:"flex",gap:9}}>
                  <span>📍 0.8 km</span><span>⭐ {ME.rating}</span><span style={{color:"var(--orange)",fontWeight:700}}>Score: {calcScore(ME)}/100</span>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:11}}>
                  {[["var(--orange)","Momo House, Thamel","Pickup · 0.8 km"],["var(--green)","Lazimpat Gate 4","Drop · 2.4 km total"]].map(([c,name,sub],i)=>(
                    <div key={i} style={{display:"flex",gap:9,alignItems:"flex-start"}}>
                      {i===0&&<><div style={{width:9,height:9,borderRadius:"50%",background:c,flexShrink:0,marginTop:4}}/><div><div style={{fontSize:"0.8rem",fontWeight:600}}>{name}</div><div style={{fontSize:"0.62rem",color:"var(--muted)"}}>{sub}</div></div></>}
                      {i===1&&<><div style={{display:"flex",flexDirection:"column",gap:2,alignItems:"center"}}><div style={{width:2,height:12,background:"var(--border)"}}/><div style={{width:9,height:9,borderRadius:"50%",background:c}}/></div><div><div style={{fontSize:"0.8rem",fontWeight:600}}>{name}</div><div style={{fontSize:"0.62rem",color:"var(--muted)"}}>{sub}</div></div></>}
                    </div>
                  ))}
                </div>
                <div style={{display:"flex",gap:7,marginBottom:13}}>
                  {[["रू65","Your Earnings","var(--green)"],["3","Items",null],["~12min","Est. Time",null]].map(([v,l,c])=>(
                    <div key={l} style={{flex:1,background:c?"rgba(46,194,126,0.1)":"var(--card2)",border:c?"1px solid rgba(46,194,126,0.2)":"none",borderRadius:8,padding:8,textAlign:"center"}}>
                      <div style={{fontFamily:"Syne",fontSize:"0.95rem",fontWeight:800,color:c||"var(--text)"}}>{v}</div>
                      <div style={{fontSize:"0.57rem",color:"var(--muted)",marginTop:1}}>{l}</div>
                    </div>
                  ))}
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button className="accept-btn" style={{flex:2,fontWeight:800}} onClick={acceptOrder}>✓ Accept Job</button>
                  <button className="reject-btn" style={{flex:1}} onClick={rejectOrder}>✗ Skip</button>
                </div>
              </div>
              <div style={{marginTop:9,padding:"8px 12px",background:"var(--card)",border:"1px solid var(--border)",borderRadius:10,fontSize:"0.67rem",color:"var(--muted)"}}>
                ⚠ If skipped → goes to <strong style={{color:"var(--text)"}}>Sanjay KC</strong> (next · 1.4km · ⭐4.7)
              </div>
            </div>
          )}

          {online && dispatchPhase==="delivering" && activeDelivery && (
            <div style={{margin:13,display:"flex",flexDirection:"column",gap:11}}>
              <div style={{background:"var(--card)",border:"2px solid var(--green)",borderRadius:15,padding:15}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:11}}>
                  <div><div style={{fontSize:"0.57rem",fontWeight:700,color:"var(--muted)",letterSpacing:"1px",textTransform:"uppercase",marginBottom:2}}>Active Delivery</div><div style={{fontFamily:"Syne",fontSize:"1rem",fontWeight:800}}>{activeDelivery.id}</div></div>
                  <div style={{display:"flex",alignItems:"center",gap:4,fontSize:"0.7rem",fontWeight:700,color:"var(--green)"}}>
                    <span style={{width:6,height:6,borderRadius:"50%",background:"var(--green)",display:"inline-block"}}/>En Route
                  </div>
                </div>
                <div style={{display:"flex",gap:8,marginBottom:9}}>
                  {[["PICKUP","rgba(255,107,53,0.08)","rgba(255,107,53,0.15)","var(--orange)",activeDelivery.pickup],["DROP","rgba(46,194,126,0.08)","rgba(46,194,126,0.15)","var(--green)",activeDelivery.drop]].map(([lbl,bg,br,c,val])=>(
                    <div key={lbl} style={{flex:1,background:bg,border:`1px solid ${br}`,borderRadius:9,padding:"9px 10px"}}>
                      <div style={{fontSize:"0.57rem",color:c,fontWeight:700,letterSpacing:"1px",marginBottom:3}}>{lbl}</div>
                      <div style={{fontSize:"0.78rem",fontWeight:600}}>{val}</div>
                    </div>
                  ))}
                </div>
                <div style={{background:"var(--card2)",borderRadius:8,padding:"8px 11px",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9}}>
                  <div><div style={{fontSize:"0.6rem",color:"var(--muted)"}}>Customer</div><div style={{fontSize:"0.82rem",fontWeight:600,marginTop:1}}>👤 {activeDelivery.customer}</div></div>
                  <button style={{background:"rgba(74,158,255,0.15)",border:"1px solid rgba(74,158,255,0.2)",borderRadius:7,padding:"5px 10px",color:"var(--blue)",fontSize:"0.7rem",fontWeight:700,cursor:"pointer"}}>📞 Call</button>
                </div>
                <div style={{fontSize:"0.67rem",color:"var(--muted)",marginBottom:11}}>🛍 {activeDelivery.items}</div>
                <div style={{display:"flex",gap:7}}>
                  {[["रू"+activeDelivery.earn,"Earnings","rgba(46,194,126,0.1)","var(--green)"],[activeDelivery.distKm+" km","Distance","var(--card2)",null]].map(([v,l,bg,c])=>(
                    <div key={l} style={{flex:1,background:bg,borderRadius:9,padding:9,textAlign:"center"}}>
                      <div style={{fontFamily:"Syne",fontSize:"1rem",fontWeight:800,color:c||"var(--text)"}}>{v}</div>
                      <div style={{fontSize:"0.58rem",color:"var(--muted)",marginTop:1}}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>
              <button className="delivered-btn" onClick={markDelivered}>📦 Mark as Delivered</button>
            </div>
          )}

          {completed && (
            <div style={{margin:13,background:"var(--card)",border:"1px solid var(--border)",borderRadius:15,padding:20,textAlign:"center"}}>
              <div style={{fontSize:"2.2rem",marginBottom:7}}>🎉</div>
              <div style={{fontFamily:"Syne",fontSize:"1rem",fontWeight:800,marginBottom:4}}>Delivery Complete!</div>
              <div style={{fontSize:"0.78rem",color:"var(--muted)",marginBottom:13}}>रू{activeDelivery?.earn} credited to your account</div>
              <button className="accept-btn" style={{width:"100%"}} onClick={reset}>Back to Dispatch</button>
            </div>
          )}

          <div className="earnings-section" style={{marginTop:8}}>
            <div className="earnings-card">
              <div className="earnings-title">Today's Earnings</div>
              <div className="earnings-amount">रू{earnings.toLocaleString()}</div>
              <div className="earnings-sub">{todayTrips} deliveries today</div>
              <div style={{marginTop:11,display:"flex",gap:5}}>
                {["रू120","रू80","रू60","रू150","रू200","रू90","रू120","रू180","रू280"].map((e,i)=>(
                  <div key={i} style={{flex:1,background:"rgba(46,194,126,0.15)",borderRadius:3,padding:"4px 1px",textAlign:"center",fontSize:"0.5rem",color:"var(--green)"}}>{e}</div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* INCENTIVES TAB */}
      {driverTab==="incentives" && (
        <div style={{padding:"13px",display:"flex",flexDirection:"column",gap:11}}>
          {/* Weekly target */}
          <div style={{background:"linear-gradient(135deg,#0d1a0a,#0A0A0F)",border:"1px solid rgba(46,194,126,0.2)",borderRadius:14,padding:15}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
              <div><div style={{fontSize:"0.6rem",color:"var(--muted)",letterSpacing:"1px",textTransform:"uppercase"}}>Weekly Target</div><div style={{fontFamily:"Syne",fontWeight:800,fontSize:"1.25rem",color:"var(--green)",marginTop:3}}>रू{weeklyEarned.toLocaleString()} / {weeklyTarget.toLocaleString()}</div></div>
              <div style={{textAlign:"right"}}><div style={{fontSize:"0.6rem",color:"var(--muted)"}}>Bonus if hit</div><div style={{fontFamily:"Syne",fontWeight:800,fontSize:"1.05rem",color:"var(--yellow)",marginTop:3}}>+रू500</div></div>
            </div>
            <div className="progress-track"><div className="progress-inner" style={{width:`${(weeklyEarned/weeklyTarget)*100}%`}}/></div>
            <div style={{fontSize:"0.63rem",color:"var(--muted)"}}>{Math.round((weeklyEarned/weeklyTarget)*100)}% done · रू{weeklyTarget-weeklyEarned} to go</div>
          </div>
          {/* Active bonuses */}
          {[
            {icon:"🌧️",title:"Rain Bonus",desc:"Earn 1.5x per delivery in heavy rain",color:"#3B82F6",status:"Active",earn:"+50%"},
            {icon:"⚡",title:"Rush Hour",desc:"Extra रू20 per delivery 6–9 PM",color:"#EAB308",status:"Active",earn:"+रू20"},
            {icon:"🏅",title:"10-Trip Streak",desc:"Complete 10 trips today for रू200 bonus",color:"#A855F7",status:"8/10",earn:"+रू200"},
            {icon:"🎯",title:"Long Pickup Bonus",desc:"रू30 extra for pickups > 3 km away",color:"#FF6B35",status:"Active",earn:"+रू30"},
          ].map((b,i)=>(
            <div key={i} style={{background:"var(--card)",border:`1px solid ${b.color}33`,borderRadius:13,padding:13,display:"flex",alignItems:"center",gap:11}}>
              <div style={{width:40,height:40,borderRadius:"50%",background:`${b.color}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.2rem",flexShrink:0}}>{b.icon}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:"0.84rem"}}>{b.title}</div>
                <div style={{fontSize:"0.67rem",color:"var(--muted)",marginTop:1}}>{b.desc}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontFamily:"Syne",fontWeight:800,fontSize:"0.86rem",color:b.color}}>{b.earn}</div>
                <div style={{fontSize:"0.58rem",color:"var(--muted)",marginTop:1}}>{b.status}</div>
              </div>
            </div>
          ))}
          <div style={{background:"rgba(239,68,68,0.07)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:11,padding:11,fontSize:"0.73rem"}}>
            <div style={{fontWeight:700,color:"var(--red)",marginBottom:2}}>⚠ Cancellation Rate: 4.2%</div>
            <div style={{color:"var(--muted)",lineHeight:1.5}}>Keep below 5% to maintain bonus eligibility.</div>
          </div>
        </div>
      )}

      {/* SURGE MAP TAB */}
      {driverTab==="surge" && (
        <div style={{padding:"13px",display:"flex",flexDirection:"column",gap:11}}>
          <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:13,overflow:"hidden"}}>
            <div style={{padding:"9px 13px",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:"0.67rem",fontWeight:700,color:"var(--muted)",letterSpacing:"1px",textTransform:"uppercase"}}>🔥 Surge Zones — Live</span>
              <span style={{fontSize:"0.6rem",color:"var(--red)",fontWeight:600}}>● Updated 2 min ago</span>
            </div>
            <div style={{position:"relative",height:250}}>
              <iframe title="Surge Map" width="100%" height="250" style={{border:"none",display:"block",filter:"saturate(0.6) brightness(0.8)"}} loading="lazy"
                src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d28516.37899487185!2d85.31714!3d27.70169!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2snp!4v1711000000000!5m2!1sen!2snp"
              />
              {SURGE_ZONES.map((z,i)=>(
                <div key={i} style={{position:"absolute",top:z.top,left:z.left,transform:"translate(-50%,-50%)",zIndex:10}}>
                  <div style={{width:z.size,height:z.size,borderRadius:"50%",background:z.color,opacity:0.3,position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",animation:"surgeBreath 2s ease-in-out infinite"}}/>
                  <div style={{background:z.color,color:"white",padding:"3px 6px",borderRadius:5,fontSize:"0.58rem",fontWeight:800,whiteSpace:"nowrap",position:"relative",zIndex:2,boxShadow:`0 2px 8px ${z.color}88`}}>
                    {z.name} {z.surge}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {SURGE_ZONES.map((z,i)=>(
            <div key={i} style={{background:"var(--card)",border:`1px solid ${z.color}33`,borderRadius:11,padding:"10px 13px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontWeight:700,fontSize:"0.84rem"}}>{z.name}</div>
                <div style={{fontSize:"0.67rem",color:"var(--muted)",marginTop:1}}>High demand — move here for more orders</div>
              </div>
              <div style={{fontFamily:"Syne",fontWeight:800,fontSize:"1rem",color:z.color}}>{z.surge}</div>
            </div>
          ))}
          <div style={{background:"rgba(234,179,8,0.07)",border:"1px solid rgba(234,179,8,0.2)",borderRadius:11,padding:11,fontSize:"0.7rem",color:"var(--muted)",lineHeight:1.6}}>
            💡 Surge zones update every 5 minutes. Move into high-demand zones to earn more per delivery.
          </div>
        </div>
      )}

      {/* TRIP HISTORY TAB */}
      {driverTab==="history" && (
        <div style={{padding:"13px",display:"flex",flexDirection:"column",gap:8}}>
          <div style={{display:"flex",gap:6,marginBottom:4}}>
            {["Today","Yesterday","This Week"].map((f,i)=>(
              <div key={f} style={{fontSize:"0.67rem",fontWeight:600,padding:"4px 9px",borderRadius:7,background:i===0?"var(--orange)":"var(--card)",border:"1px solid var(--border)",color:i===0?"white":"var(--muted)",cursor:"pointer"}}>{f}</div>
            ))}
          </div>
          {TRIP_HISTORY.map((t,i)=>(
            <div key={i} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,padding:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontFamily:"monospace",fontSize:"0.68rem",color:"var(--blue)",fontWeight:700}}>{t.id}</span>
                <span style={{fontFamily:"Syne",fontWeight:800,fontSize:"0.9rem",color:"var(--green)"}}>रू{t.earn}</span>
              </div>
              <div style={{fontSize:"0.77rem",fontWeight:600,marginBottom:2}}>🍱 {t.rest}</div>
              <div style={{fontSize:"0.67rem",color:"var(--muted)",display:"flex",gap:9}}>
                <span>👤 {t.customer}</span><span>📍 {t.dist} km</span><span>🕑 {t.time}</span>
              </div>
            </div>
          ))}
          {/* Summary row */}
          <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,padding:12,display:"flex",justifyContent:"space-between"}}>
            {[["Today's Total","रू"+(TRIP_HISTORY.filter(t=>t.date==="Today").reduce((s,t)=>s+t.earn,0)),"var(--green)"],["Trips Today",TRIP_HISTORY.filter(t=>t.date==="Today").length,null],["Avg Dist","2.2 km",null]].map(([l,v,c])=>(
              <div key={l} style={{textAlign:"center"}}>
                <div style={{fontSize:"0.6rem",color:"var(--muted)",marginBottom:3}}>{l}</div>
                <div style={{fontFamily:"Syne",fontWeight:800,fontSize:"1.05rem",color:c||"var(--text)"}}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── ADMIN PANEL ───────────────────────────────────────────────────────
function LiveDriverMap() {
  const [sel, setSel] = useState(null);
  return (
    <div style={{margin:"13px 13px 0",background:"var(--card)",border:"1px solid var(--border)",borderRadius:13,overflow:"hidden"}}>
      <div style={{padding:"9px 13px",fontSize:"0.74rem",fontWeight:600,borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between"}}>
        <span>🗺️ Live Driver Map — Kathmandu Valley</span>
        <span style={{fontSize:"0.63rem",color:"var(--green)",fontWeight:600}}>● {DRIVER_PINS.filter(d=>d.status==="On Delivery").length} Active</span>
      </div>
      <div style={{position:"relative",height:250}}>
        <iframe title="TooFan Live Map" width="100%" height="250" style={{border:"none",display:"block",filter:"saturate(0.7) brightness(0.85)"}} loading="lazy" allowFullScreen
          src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d28516.37899487185!2d85.31714!3d27.70169!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2snp!4v1711000000000!5m2!1sen!2snp"
        />
        {DRIVER_PINS.map((d,i)=>(
          <div key={i} onClick={()=>setSel(sel===i?null:i)} style={{position:"absolute",top:d.top,left:d.left,transform:"translate(-50%,-50%)",zIndex:10,cursor:"pointer"}}>
            <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:30,height:30,borderRadius:"50%",background:d.color,opacity:0.2,animation:"pingD 1.8s ease-out infinite"}}/>
            <div style={{width:26,height:26,borderRadius:"50%",background:d.color,border:"2.5px solid white",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.75rem",boxShadow:`0 2px 8px ${d.color}88`,position:"relative",zIndex:2}}>🛵</div>
            {sel===i && (
              <div style={{position:"absolute",bottom:"110%",left:"50%",transform:"translateX(-50%)",background:"#1A1A25",border:`1px solid ${d.color}`,borderRadius:6,padding:"5px 8px",fontSize:"0.6rem",fontWeight:600,whiteSpace:"nowrap",boxShadow:"0 4px 16px rgba(0,0,0,0.5)",zIndex:20}}>
                <div style={{color:"white"}}>{d.name}</div>
                <div style={{color:d.color,marginTop:1}}>{d.status}</div>
              </div>
            )}
          </div>
        ))}
        <div style={{position:"absolute",bottom:8,left:8,zIndex:10,background:"rgba(10,10,15,0.85)",borderRadius:6,padding:"4px 8px",fontSize:"0.58rem",display:"flex",gap:7,border:"1px solid rgba(255,255,255,0.08)"}}>
          <span style={{color:"#FF6B35"}}>🛵 On Delivery</span>
          <span style={{color:"#2EC27E"}}>✓ Idle</span>
        </div>
      </div>
      <div style={{display:"flex",borderTop:"1px solid var(--border)"}}>
        {DRIVER_PINS.map((d,i)=>(
          <div key={i} onClick={()=>setSel(sel===i?null:i)} style={{flex:1,padding:"6px 2px",textAlign:"center",cursor:"pointer",borderRight:i<DRIVER_PINS.length-1?"1px solid var(--border)":"none",background:sel===i?"rgba(255,255,255,0.03)":"transparent"}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:d.color,margin:"0 auto 2px",boxShadow:`0 0 4px ${d.color}`}}/>
            <div style={{fontSize:"0.54rem",fontWeight:600}}>{d.name}</div>
            <div style={{fontSize:"0.5rem",color:d.status==="On Delivery"?"var(--orange)":"var(--green)"}}>{d.status==="On Delivery"?"📦":"✓"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminPanel() {
  const [adminTab, setAdminTab] = useState("overview");
  const totalRevenue  = ORDERS_MOCK.filter(o=>o.status!=="Cancelled").reduce((s,o)=>s+o.total,0);
  const activeDrivers = DRIVERS_MOCK.filter(d=>d.status==="Active").length;

  return (
    <div className="screen">
      <div className="admin-header">
        <div>
          <div className="admin-title">TooFan Admin</div>
          <div style={{fontSize:"0.64rem",color:"var(--muted)"}}>Dashboard Overview</div>
        </div>
        <div className="admin-badge">● Live</div>
      </div>

      <div className="admin-kpis">
        {[
          ["📦", ORDERS_MOCK.length,        "Orders Today",   "↑ 12%",true, "🍱"],
          ["💵", `रू${(totalRevenue/1000).toFixed(1)}k`,"Revenue Today","↑ 8%",true,"💰"],
          ["🛵", activeDrivers,              "Active Drivers", "↑ 1",  true, "🛵"],
          ["⭐", "4.7",                      "Avg Rating",     "↓ 0.1",false,"⭐"],
        ].map(([ico,val,lbl,delta,up,bg],i)=>(
          <div key={i} className="kpi-card">
            <div className="kpi-bg">{bg}</div>
            <div className="kpi-icon">{ico}</div>
            <div className="kpi-val">{val}</div>
            <div className="kpi-label">{lbl}</div>
            <div className={`kpi-delta ${up?"up":"down"}`}>{delta} from yesterday</div>
          </div>
        ))}
      </div>

      <div className="revenue-chart">
        <div className="chart-title">Weekly Revenue (रू)</div>
        <div className="bar-chart">
          {[45,62,38,80,55,91,74].map((h,i)=>(
            <div key={i} className="bar-wrap">
              <div className="bar" style={{height:`${h}%`}}/>
              <div className="bar-day">{["M","T","W","T","F","S","S"][i]}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-tabs">
        {["overview","orders","drivers","restaurants"].map(t=>(
          <button key={t} className={`admin-tab ${adminTab===t?"active":""}`} onClick={()=>setAdminTab(t)}>
            {t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      {adminTab==="overview" && (
        <>
          <LiveDriverMap/>
          <div style={{padding:"0 13px 13px",display:"flex",gap:8,marginTop:11}}>
            {[["Pending",ORDERS_MOCK.filter(o=>o.status==="Preparing").length,"var(--yellow)"],["Avg Time","27 min","var(--blue)"],["Cancel","12%","var(--red)"]].map(([l,v,c])=>(
              <div key={l} style={{flex:1,background:"var(--card)",border:"1px solid var(--border)",borderRadius:10,padding:11,fontSize:"0.73rem"}}>
                <div style={{color:"var(--muted)",marginBottom:4}}>{l}</div>
                <div style={{fontFamily:"Syne",fontSize:"1.25rem",fontWeight:800,color:c}}>{v}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {adminTab==="orders" && (
        <div className="orders-list">
          {ORDERS_MOCK.map(o=>{
            const sc = o.status==="Delivered"?"delivered":o.status==="On the Way"?"on-the-way":o.status==="Preparing"?"preparing":"cancelled";
            return (
              <div key={o.id} className="order-row">
                <div className="order-row-header"><span className="order-id">{o.id}</span><span className={`status-badge ${sc}`}>{o.status}</span></div>
                <div className="order-row-details">
                  <span className="detail-tag">👤 {o.customer}</span>
                  <span className="detail-tag">🛵 {o.driver}</span>
                  <span className="detail-tag">🍱 {o.restaurant}</span>
                </div>
                <div className="order-row-footer"><span className="order-amount">रू{o.total}</span><span className="order-time">🕑 {o.time}</span></div>
              </div>
            );
          })}
        </div>
      )}

      {adminTab==="drivers" && (
        <div className="drivers-list">
          {DRIVERS_MOCK.map(d=>(
            <div key={d.id} className="driver-row">
              <div className="driver-avatar">{d.name.split(" ").map(n=>n[0]).join("")}</div>
              <div className="driver-info">
                <div className="driver-row-name">{d.name}</div>
                <div className="driver-row-meta">📞 {d.phone} · {d.vehicle}<br/>📍 {d.location} · ⭐ {d.rating}</div>
                <div style={{marginTop:3}}>
                  <span style={{fontSize:"0.58rem",fontWeight:700,padding:"2px 5px",borderRadius:3,background:d.status==="Active"?"rgba(46,194,126,0.15)":"rgba(255,255,255,0.05)",color:d.status==="Active"?"var(--green)":"var(--muted)",border:`1px solid ${d.status==="Active"?"rgba(46,194,126,0.2)":"var(--border)"}`}}>{d.status}</span>
                </div>
              </div>
              <div className="driver-row-stats">
                <div className="driver-earn">रू{(d.earnings/1000).toFixed(1)}k</div>
                <div className="driver-trips">{d.trips} trips</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {adminTab==="restaurants" && (
        <div style={{padding:"9px 13px",display:"flex",flexDirection:"column",gap:6}}>
          {RESTAURANTS.map(r=>(
            <div key={r.id} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:11,padding:11,display:"flex",gap:9,alignItems:"center"}}>
              <div style={{fontSize:"1.6rem"}}>{r.img}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,fontSize:"0.84rem"}}>{r.name}</div>
                <div style={{fontSize:"0.67rem",color:"var(--muted)"}}>⭐ {r.rating} · {r.cuisine} · {r.time} min{r.discount>0?` · ${r.discount}%OFF`:""}</div>
              </div>
              <div style={{fontSize:"0.58rem",fontWeight:700,padding:"2px 6px",borderRadius:4,background:"rgba(46,194,126,0.15)",color:"var(--green)",border:"1px solid rgba(46,194,126,0.2)"}}>Active</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────
export default function TooFanApp() {
  const [activeApp, setActiveApp] = useState("khana");
  return (
    <>
      <style>{css}</style>
      <nav className="app-nav">
        <div className="nav-logo">🌪️ Too<span>Fan</span></div>
        <div className="nav-tabs">
          <button className={`nav-tab ${activeApp==="khana"?"active":""}`} onClick={()=>setActiveApp("khana")}>🍱 Khana</button>
          <button className={`nav-tab driver ${activeApp==="driver"?"active driver":""}`} onClick={()=>setActiveApp("driver")}>🛵 Driver</button>
          <button className={`nav-tab admin ${activeApp==="admin"?"active admin":""}`} onClick={()=>setActiveApp("admin")}>📊 Admin</button>
        </div>
      </nav>
      {activeApp==="khana" && <KhanaApp/>}
      {activeApp==="driver" && <DriverApp/>}
      {activeApp==="admin" && <AdminPanel/>}
    </>
  );
}
