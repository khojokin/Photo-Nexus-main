import { type Request, type Response, type NextFunction } from "express";
import { db } from "@workspace/db";
import { blockedIpsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logSecurityEvent } from "../lib/securityLogger";

// Simple in-memory cache to avoid DB lookup on every request
const blockedIpCache = new Map<string, Date | null>();
let lastCacheRefresh = 0;
const CACHE_TTL_MS = 60_000; // refresh every 60s

async function refreshCache(): Promise<void> {
  try {
    const rows = await db.select().from(blockedIpsTable);
    blockedIpCache.clear();
    const now = new Date();
    for (const row of rows) {
      if (!row.expiresAt || row.expiresAt > now) {
        blockedIpCache.set(row.ipAddress, row.expiresAt ?? null);
      }
    }
    lastCacheRefresh = Date.now();
  } catch {
    // Non-critical — if DB is unavailable just allow the request
  }
}

export async function ipBlockMiddleware(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip ?? "";
  if (!ip) { next(); return; }

  // Refresh cache periodically
  if (Date.now() - lastCacheRefresh > CACHE_TTL_MS) {
    await refreshCache();
  }

  if (blockedIpCache.has(ip)) {
    const expires = blockedIpCache.get(ip);
    if (!expires || expires > new Date()) {
      logSecurityEvent({
        eventType: "forbidden",
        severity: "warn",
        message: `Blocked IP attempted access: ${ip} → ${req.method} ${req.path}`,
        ipAddress: ip,
        path: req.path,
        method: req.method,
        statusCode: 403,
        userAgent: req.headers["user-agent"] ?? null,
      });
      res.status(403).json({ error: "Access denied." });
      return;
    } else {
      // Expired — remove from cache
      blockedIpCache.delete(ip);
    }
  }

  next();
}

// Export so admin routes can force a refresh after blocking/unblocking
export function invalidateIpBlockCache() {
  lastCacheRefresh = 0;
}
