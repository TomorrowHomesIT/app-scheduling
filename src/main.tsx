import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import { App } from "./app/app";

const domNode = document.getElementById("root");
if (!domNode) {
  throw new Error("Root element not found");
}

createRoot(domNode).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
