import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import { App } from "./app/app";

// Register service worker
import { registerSW } from "virtual:pwa-register";
import useAppStore from "./store/app.store";

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
    
    // Use app store to show the update dialog
    useAppStore.getState().showServiceWorkerUpdateDialog();
  },
  onOfflineReady() {
    console.log("App is ready to work offline");
  },
});
