import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import DevPortal from "./DevPortal.jsx";

const isDevPortal = window.location.pathname.startsWith("/dev");

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {isDevPortal ? <DevPortal /> : <App />}
  </React.StrictMode>
);
