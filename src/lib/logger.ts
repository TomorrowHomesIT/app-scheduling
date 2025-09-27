import type { IUserProfile } from "@/models/auth.model";

// biome-ignore lint/suspicious/noExplicitAny: We want to be able to send any data to logs
type ILogBody = Record<string, any>;

interface LogEntry {
  level: string;
  message: string;
  metadata?: ILogBody;
  timestamp: string;
  url?: string;
  userAgent?: string;
  sessionId?: string;
  userId?: string;
  userName?: string;
}

interface LoggerConfig {
  endpoint?: string;
  flushInterval?: number;
  maxQueueSize?: number;
}

class Logger {
  private logs: LogEntry[] = [];
  private isOnline: boolean = navigator.onLine;
  private flushTimer?: NodeJS.Timeout;
  private sessionId: string = this.generateSessionId();
  private user?: IUserProfile | null;
  private accessToken: string = "";

  // Configuration
  private config: Required<LoggerConfig> = {
    endpoint: import.meta.env.VITE_LOGGING_URL,
    flushInterval: 10000,
    maxQueueSize: 100,
  };

  isInitialized = false;
  enableLogger = !import.meta.env.DEV && this.config.endpoint;

  init() {
    if (!this.enableLogger) return;

    this.isInitialized = true;

    this.setupConnectivityHandlers();
    this.startFlushTimer();
    this.setupUnloadHandler();
    this.setupVisibilityChangeHandler();
  }

  setAccessToken(accessToken: string) {
    this.accessToken = accessToken;
  }

  setUser(user: IUserProfile | null) {
    this.user = user;
  }

  log(event: string, body: ILogBody = {}) {
    if (!this.isLogEnabled(event, body, "info")) return;
    this.storeLog("info", event, body);
  }

  warn(event: string, body: ILogBody = {}) {
    if (!this.isLogEnabled(event, body, "warn")) return;
    this.storeLog("warn", event, body);
  }

  error(event: string, body: ILogBody = {}) {
    if (!this.isLogEnabled(event, body, "error")) return;
    this.storeLog("error", event, body);

    // Immediately flush errors for faster debugging
    this.flush();
  }

  // Get current queue size
  getQueueSize() {
    return this.logs.length;
  }

  // Clear all queued logs
  clearQueue() {
    this.logs = [];
  }

  private isLogEnabled(event: string, body: ILogBody = {}, type: "info" | "warn" | "error") {
    const shouldConsoleLog = import.meta.env.DEV;

    if (shouldConsoleLog) {
      if (type === "info") {
        console.log(event, body);
      } else if (type === "warn") {
        console.warn(event, body);
      } else if (type === "error") {
        console.error(event, body);
      }
      return false;
    }

    return this.isInitialized;
  }

  private storeLog(level: string, message: string, metadata: ILogBody = {}) {
    // Prevent queue from growing too large
    if (this.logs.length >= this.config.maxQueueSize) {
      // Remove oldest logs
      this.logs.splice(0, Math.floor(this.config.maxQueueSize * 0.2));
    }

    const logEntry: LogEntry = {
      level,
      message,
      metadata,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      sessionId: this.sessionId,
      userId: this.user?.id,
      userName: this.user?.name,
    };

    this.logs.push(logEntry);
  }

  private async flush() {
    if (this.logs.length === 0 || !this.isOnline) return;

    const logsToSend = [...this.logs];
    this.logs = [];

    try {
      const response = await fetch(this.config.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Logger-Version": "1.0.0",
          "X-Access-Token": this.accessToken,
        },
        body: JSON.stringify({
          logs: logsToSend,
          meta: {
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            count: logsToSend.length,
          },
        }),
        keepalive: true,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch {
      // Re-queue failed logs at the beginning
      this.logs.unshift(...logsToSend);
    }
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupConnectivityHandlers() {
    window.addEventListener("online", () => {
      this.isOnline = true;
      // Wait a bit for connection to stabilize
      setTimeout(() => this.flush(), 1000);
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
    });
  }

  private startFlushTimer() {
    this.flushTimer = setInterval(() => {
      if (this.isOnline && this.logs.length > 0) {
        this.flush();
      }
    }, this.config.flushInterval);
  }

  private setupUnloadHandler() {
    window.addEventListener("beforeunload", () => {
      this.flush();
      this.cleanup();
    });

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        this.flush();
      }
    });
  }

  private setupVisibilityChangeHandler() {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && this.isOnline) {
        setTimeout(() => this.flush(), 100);
      }
    });
  }

  private cleanup() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }
  }
}

// Export singleton instance with default config
export default new Logger();
