import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import DevPortal from "./DevPortal.jsx";

const isDevPortal = window.location.pathname.startsWith("/dev");

const root = document.getElementById("root");
if (!root) throw new Error("#root element missing from index.html");

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    {isDevPortal ? <DevPortal /> : <App />}
  </React.StrictMode>
);
