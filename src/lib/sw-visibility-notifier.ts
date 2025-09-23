/**
 * Service Worker Visibility Notifier
 *
 * Notifies the service worker when the app visibility changes
 * so it can process the queue when the user returns
 */

class SwVisibilityNotifier {
  private isInitialized = false;

  public initialize() {
    if (this.isInitialized) return;

    document.addEventListener("visibilitychange", this.handleVisibilityChange);
    window.addEventListener("online", this.handleOnline);

    this.isInitialized = true;
    console.log("SW visibility notifier initialized");
  }

  private handleVisibilityChange = () => {
    if (!document.hidden) {
      this.notifyServiceWorker("VISIBILITY_CHANGE", { visible: true });
    }
  };

  private handleOnline = () => {
    this.notifyServiceWorker("ONLINE_CHANGE", { online: true });
  };

  private notifyServiceWorker(type: string, data: { online?: boolean; visible?: boolean }) {
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type,
        ...data,
      });
    }
  }

  public destroy() {
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    window.removeEventListener("online", this.handleOnline);
    this.isInitialized = false;
  }
}

// Export singleton instance
export const swVisibilityNotifier = new SwVisibilityNotifier();
