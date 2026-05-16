import { type Request, type Response, type NextFunction } from "express";
import { logSecurityEvent } from "../lib/securityLogger";

const ADMIN_EMAILS = new Set(
  (process.env.ADMIN_EMAILS ?? "kingsfordkojo7@gmail.com,kingsfordkojo7@icloud.com,photographer@affuaa.com")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
);

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.authUser) {
    logSecurityEvent({
      eventType: "auth_failure",
      severity: "warn",
      message: `Unauthenticated admin attempt: ${req.method} ${req.path}`,
      ipAddress: req.ip,
      path: req.path,
      method: req.method,
      statusCode: 401,
      userAgent: req.headers["user-agent"] ?? null,
    });
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  if (!req.authUser.emailVerified) {
    logSecurityEvent({
      eventType: "forbidden",
      severity: "warn",
      message: `Admin attempt with unverified email (${req.authUser.email ?? "unknown"}): ${req.method} ${req.path}`,
      ipAddress: req.ip,
      path: req.path,
      method: req.method,
      statusCode: 403,
      userAgent: req.headers["user-agent"] ?? null,
      userId: req.authUser.id,
    });
    res.status(403).json({ error: "Verified email required for admin access" });
    return;
  }

  const email = (req.authUser.email ?? "").toLowerCase();
  if (!ADMIN_EMAILS.has(email)) {
    logSecurityEvent({
      eventType: "forbidden",
      severity: "error",
      message: `Non-admin user attempted admin access (${email}): ${req.method} ${req.path}`,
      ipAddress: req.ip,
      path: req.path,
      method: req.method,
      statusCode: 403,
      userAgent: req.headers["user-agent"] ?? null,
      userId: req.authUser.id,
      metadata: { email },
    });
    res.status(403).json({ error: "Admin access required" });
    return;
  }

  next();
}
