import { db } from "@workspace/db";
import { securityEventsTable } from "@workspace/db";
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

/**
 * Fire-and-forget security event logger.
 * Never throws — all errors are swallowed to avoid disrupting request handling.
 */
export function logSecurityEvent(payload: SecurityEventPayload): void {
  setImmediate(async () => {
    try {
      await db.insert(securityEventsTable).values({
        eventType: payload.eventType,
        severity: payload.severity,
        ipAddress: payload.ipAddress ?? null,
        userId: payload.userId ?? null,
        userAgent: payload.userAgent ?? null,
        path: payload.path ?? null,
        method: payload.method ?? null,
        statusCode: payload.statusCode ?? null,
        message: payload.message,
        metadata: payload.metadata ?? {},
      });
    } catch (err) {
      logger.debug({ err }, "Security event logging failed (non-fatal)");
    }
  });
}
