import mixpanel from "mixpanel-browser";

// biome-ignore lint/suspicious/noExplicitAny: We want to be able to send any data to Mixpanel
type ILogBody = Record<string, any>;

class Logger {
  isInitialized = false;
  enableLogger = !import.meta.env.DEV;

  /**
   * TODO: We'll probably need to move from mixpanel as our logger as its considered a tracker by some browsers and may be blocked.
   */


  /**
   * TODO: if we can move from auth context we could send the user.
   */
  init() {
    if (!this.enableLogger) return;

    try {
      mixpanel.init(import.meta.env.VITE_MIXPANEL_TOKEN, {
        debug: import.meta.env.DEV,
        track_pageview: false,
        persistence: "localStorage",
        autocapture: false,
        autotrack: false,
      });
      this.isInitialized = true;
    } catch (e) {
      console.error("Error initializing Mixpanel:", e);
    }
  }

  track(event: string, body: ILogBody = {}) {
    if (!this.isLogEnabled(event, body, undefined)) return;

    mixpanel.track(event, body);
  }

  log(event: string, body: ILogBody = {}) {
    if (!this.isLogEnabled(event, body, "log")) return;

    mixpanel.track(`INFO: ${event}`, body);
  }

  warn(event: string, body: ILogBody = {}) {
    if (!this.isLogEnabled(event, body, "warn")) return;

    mixpanel.track(`WARN: ${event}`, body);
  }

  error(event: string, body: ILogBody = {}) {
    if (!this.isLogEnabled(event, body, "error")) return;

    mixpanel.track(`ERROR: ${event}`, body);
  }

  isLogEnabled(event: string, body: ILogBody = {}, type: "log" | "warn" | "error" | undefined) {
    if (!this.isInitialized) {
      if (type === "log") {
        console.log(event, body);
      } else if (type === "warn") {
        console.warn(event, body);
      } else if (type === "error") {
        console.error(event, body);
      }

      return false;
    }

    return true;
  }
}

export default new Logger();
