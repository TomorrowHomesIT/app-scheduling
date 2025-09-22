/**
 * This allows us full control over the service worker registration
 * We need a bit of extra config for this to work in development
 * @returns
 */
export async function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    try {
      // In development, use the Vite PWA dev path
      const isDev = import.meta.env.DEV;
      const swPath = isDev ? "./dev-sw.js?dev-sw" : "./sw.js";

      const registration = await navigator.serviceWorker.register(swPath, { type: isDev ? "module" : "classic" });

      registration.addEventListener("updatefound", () => {
        console.log("Service worker update found");
      });

      console.log("Service worker registered successfully");
      return registration;
    } catch (error) {
      console.error("Service worker registration failed:", error);
    }
  }
}

export function unregisterServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.unregister();
    });
  }
}
