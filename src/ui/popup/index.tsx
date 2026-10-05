import React from "react";
import ReactDOM from "react-dom/client";
import { PopupApp } from "./PopupApp";
import "../index.css";

const rootEl = document.getElementById("root");
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl);
  root.render(
    <React.StrictMode>
      <PopupApp />
    </React.StrictMode>
  );
}
