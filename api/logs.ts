// api/logs.ts - Vercel Serverless Function for Vite/React Router SPA
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

interface LogEntry {
  level: string;
  message: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
  url?: string;
  sessionId?: string;
  userId?: string;
  userName?: string;
}

interface LogPayload {
  logs: LogEntry[];
  meta?: {
    timestamp: string;
    sessionId: string;
    count: number;
    sendMethod?: string;
  };
}

interface RequestMeta {
  ip: string;
  referer?: string;
  timestamp: string;
}

interface EnrichedLog extends LogEntry {
  request: RequestMeta;
  batch?: LogPayload["meta"];
  processedAt: string;
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  // Set CORS headers for SPA
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    // Extract and validate auth token
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (authHeader && typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);

      try {
        // Validate the JWT token with Supabase
        const {
          data: { user: authUser },
          error: authError,
        } = await supabase.auth.getUser(token);

        if (authError || !authUser) {
          res.status(401).json({ error: "Unauthorized - Invalid token" });
          return;
        }
      } catch {
        res.status(401).json({ error: "Unauthorized - Token validation failed" });
        return;
      }
    }

    // Parse and validate request body
    const body = req.body as LogPayload;
    if (!body.logs || !Array.isArray(body.logs)) {
      res.status(400).json({ error: "Invalid logs payload" });
      return;
    }

    const { logs, meta } = body;

    // Extract request metadata
    const requestMeta: RequestMeta = {
      ip:
        (Array.isArray(req.headers["x-forwarded-for"])
          ? req.headers["x-forwarded-for"][0]
          : req.headers["x-forwarded-for"]) ||
        req.socket?.remoteAddress ||
        "unknown",
      referer: Array.isArray(req.headers.referer) ? req.headers.referer[0] : req.headers.referer,
      timestamp: new Date().toISOString(),
    };

    // Process each log entry
    for (const logEntry of logs) {
      // Create enriched log object
      const enrichedLog: EnrichedLog = {
        // Original log data
        ...logEntry,

        // Request metadata
        request: requestMeta,

        // Batch metadata
        batch: meta,

        // Processing timestamp
        processedAt: new Date().toISOString(),
      };

      // Log out to Vercel via console.log
      if (logEntry.level === "error") {
        // Alert errors to Slack
        await sendAlert(enrichedLog);
        console.error(enrichedLog.message, JSON.stringify(enrichedLog));
      } else if (logEntry.level === "warn") {
        console.warn(enrichedLog.message, JSON.stringify(enrichedLog));
      } else {
        console.log(enrichedLog.message, JSON.stringify(enrichedLog));
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error processing logs:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    res.status(500).json({ success: false });
  }
}

interface SlackMessage {
  text: string;
  blocks: Array<{
    type: string;
    text: {
      type: string;
      text: string;
    };
  }>;
}

// Optional: Send alerts for critical errors
async function sendAlert(logEntry: EnrichedLog): Promise<void> {
  if (!process.env.SLACK_WEBHOOK_URL) {
    return;
  }

  try {
    // Example: Send to Slack webhook
    const slackWebhook = process.env.SLACK_WEBHOOK_URL;

    if (slackWebhook) {
      const userName = logEntry?.userName || logEntry.userId || "Unknown";
      const slackMessage: SlackMessage = {
        text: "BASD Onsite Alert",
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*app-basd-onsite*`,
            },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `
                *Error:* ${logEntry.message}\n
                *User:* ${userName}\n
                *URL:* ${logEntry.url}\n
                *Time:* ${logEntry.timestamp}
              `,
            },
          },
        ],
      };

      const response = await fetch(slackWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(slackMessage),
      });

      if (!response.ok) {
        console.error("Failed to send Slack notification:", response.status, response.statusText);
      }
    }

    // Example: Send email alert using a service like SendGrid, Resend, etc.
    // await sendEmailAlert(logEntry, user);
  } catch (error) {
    console.error("Failed to send alert:", error);
  }
}
