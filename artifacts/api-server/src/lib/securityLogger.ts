import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "./logger";

export type SecurityEventType =
  | "auth_failure"
  | "auth_success"
  | "rate_limited"
  | "forbidden"
  | "suspicious_input"
  | "admin_action"
  | "upload_rejected"
  | "sql_injection_attempt"
  | "xss_attempt"
  | "api_error"
  | "other";

export type SecuritySeverity = "info" | "warn" | "error" | "critical";

export interface SecurityEventPayload {
  eventType: SecurityEventType;
  severity: SecuritySeverity;
  message: string;
  ipAddress?: string | null;
  userId?: string | null;
  userAgent?: string | null;
  path?: string | null;
  method?: string | null;
  statusCode?: number | null;
  metadata?: Record<string, unknown>;
}

// Track whether the table exists so we avoid hammering the DB with checks
let tableChecked = false;
let tableExists = false;

async function checkTableExists(): Promise<boolean> {
  if (tableChecked) return tableExists;
  try {
    const result = await db.execute<{ exists: boolean }>(sql`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'security_events'
      ) AS exists
    `);
    tableExists = result?.rows?.[0]?.exists === true;
    tableChecked = true;
    if (!tableExists) {
      logger.info("security_events table not found — security logging disabled. Run sql/affuaa-supabase-full-schema.sql to enable it.");
    }
  } catch {
    tableChecked = true;
    tableExists = false;
  }
  return tableExists;
}

/**
 * Fire-and-forget security event logger.
 * Never throws — all errors are swallowed to avoid disrupting request handling.
 */
export function logSecurityEvent(payload: SecurityEventPayload): void {
  setImmediate(async () => {
    try {
      const exists = await checkTableExists();
      if (!exists) return;

      await db.execute(sql`
        INSERT INTO security_events (
          event_type, severity, ip_address, user_id,
          user_agent, path, method, status_code, message, metadata
        ) VALUES (
          ${payload.eventType},
          ${payload.severity},
          ${payload.ipAddress ?? null},
          ${payload.userId ?? null},
          ${payload.userAgent ?? null},
          ${payload.path ?? null},
          ${payload.method ?? null},
          ${payload.statusCode ?? null},
          ${payload.message},
          ${JSON.stringify(payload.metadata ?? {})}
        )
      `);
    } catch (err) {
      // Never let logging errors surface to the caller
      logger.debug({ err }, "Security event logging failed (non-fatal)");
    }
  });
}
