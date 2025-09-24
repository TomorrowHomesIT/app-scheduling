/**
 * Service Worker Authentication Utilities
 *
 * Handles passing auth tokens to service workers for API calls
 */


// Function to send token to service worker
export const broadcastToken = async (token: string): Promise<void> => {
  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: "AUTH_TOKEN_UPDATE",
      token,
    });
  }
};

// Setup service worker auth - call this after successful login/registration
export const setupServiceWorkerAuth = async (token: string): Promise<void> => {
  if (!("serviceWorker" in navigator)) {
    console.warn("Service Worker not supported");
    return;
  }

  // Wait for service worker to be ready
  await navigator.serviceWorker.ready;

  // Send token immediately if service worker is already controlling
  await broadcastToken(token);

  // Listen for when service worker becomes active/changes
  const handleControllerChange = async () => {
    await broadcastToken(token);
  };

  // Remove any existing listener to avoid duplicates
  navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);

  // Add the listener
  navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);
};

// Call this when user logs out to clear token from service worker
export const clearServiceWorkerAuth = async (): Promise<void> => {
  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: "AUTH_TOKEN_CLEAR",
    });
  }
};
