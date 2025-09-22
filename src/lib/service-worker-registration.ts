export async function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register("sw.js", { scope: "/" });

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
