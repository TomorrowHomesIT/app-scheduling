import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import { App } from "./app/app";

// Register service worker
import { registerSW } from "virtual:pwa-register";

const domNode = document.getElementById("root");
if (!domNode) {
  throw new Error("Root element not found");
}

createRoot(domNode).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register service worker with auto-update
registerSW({
  onNeedRefresh() {
    console.log("New content available, will refresh when all tabs are closed");
  },
  onOfflineReady() {
    console.log("App is ready to work offline");
  },
});
