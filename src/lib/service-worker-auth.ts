/**
 * Service Worker Authentication Utilities
 * 
 * Handles passing auth tokens to service workers for API calls
 */

// Function to send token to service worker
export const broadcastToken = async (token: string): Promise<void> => {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'AUTH_TOKEN_UPDATE',
      token
    });
  }
};

// Send API URL to service worker
export const broadcastApiUrl = async (apiUrl: string): Promise<void> => {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'API_URL_UPDATE',
      url: apiUrl
    });
  }
};

// Setup service worker auth - call this after successful login/registration
export const setupServiceWorkerAuth = async (token: string): Promise<void> => {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker not supported');
    return;
  }

  // Wait for service worker to be ready
  await navigator.serviceWorker.ready;

  // Send API URL first (from environment variable)
  if (import.meta.env.VITE_PUBLIC_API_URL) {
    await broadcastApiUrl(import.meta.env.VITE_PUBLIC_API_URL);
  }

  // Send token immediately if service worker is already controlling
  await broadcastToken(token);

  // Listen for when service worker becomes active/changes
  const handleControllerChange = async () => {
    // Re-send API URL and token when service worker changes
    if (import.meta.env.VITE_PUBLIC_API_URL) {
      await broadcastApiUrl(import.meta.env.VITE_PUBLIC_API_URL);
    }
    await broadcastToken(token);
  };

  // Remove any existing listener to avoid duplicates
  navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
  
  // Add the listener
  navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

  // Also handle service worker updates
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data.type === 'REQUEST_AUTH_TOKEN') {
      // Re-send API URL and token when requested
      if (import.meta.env.VITE_PUBLIC_API_URL) {
        broadcastApiUrl(import.meta.env.VITE_PUBLIC_API_URL);
      }
      broadcastToken(token);
    }
  });
};

// Call this when user logs out to clear token from service worker
export const clearServiceWorkerAuth = async (): Promise<void> => {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'AUTH_TOKEN_CLEAR'
    });
  }
};