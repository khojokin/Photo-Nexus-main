import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import path from "path";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import router from "./routes";
import { logger } from "./lib/logger";
import { authMiddleware } from "./middlewares/authMiddleware";
import { logSecurityEvent } from "./lib/securityLogger";
import { ipBlockMiddleware } from "./middlewares/ipBlockMiddleware";

const app: Express = express();

// Trust the Replit reverse proxy (required for accurate IP detection in rate limiting)
app.set("trust proxy", 1);

// ── Security headers ──────────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc:  ["'self'"],
        scriptSrc:   ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
        styleSrc:    ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc:     ["'self'", "https://fonts.gstatic.com"],
        imgSrc:      ["'self'", "data:", "blob:", "https:", "http:"],
        connectSrc:  ["'self'", "https://api.stripe.com"],
        frameSrc:    ["https://js.stripe.com", "https://hooks.stripe.com"],
        objectSrc:   ["'none'"],
        upgradeInsecureRequests: process.env.NODE_ENV === "production" ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// ── Global rate limiting ──────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down." },
  skip: (req) => req.path.startsWith("/uploads") || req.path.startsWith("/assets"),
  handler: (req: Request, res: Response) => {
    logSecurityEvent({
      eventType: "rate_limited",
      severity: "warn",
      message: `Global rate limit exceeded: ${req.method} ${req.path}`,
      ipAddress: req.ip,
      path: req.path,
      method: req.method,
      statusCode: 429,
      userAgent: req.headers["user-agent"] ?? null,
      userId: req.authUser?.id ?? null,
    });
    res.status(429).json({ error: "Too many requests. Please slow down." });
  },
});

// Stricter limiter for auth / write endpoints
const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests on this endpoint. Please try again shortly." },
  handler: (req: Request, res: Response) => {
    logSecurityEvent({
      eventType: "rate_limited",
      severity: "error",
      message: `Write endpoint rate limit exceeded: ${req.method} ${req.path}`,
      ipAddress: req.ip,
      path: req.path,
      method: req.method,
      statusCode: 429,
      userAgent: req.headers["user-agent"] ?? null,
      userId: req.authUser?.id ?? null,
    });
    res.status(429).json({ error: "Too many requests on this endpoint. Please try again shortly." });
  },
});

// Upload limiter
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Upload limit reached. You can upload up to 20 photos per hour." },
  handler: (req: Request, res: Response) => {
    logSecurityEvent({
      eventType: "rate_limited",
      severity: "error",
      message: `Upload rate limit exceeded — ${req.ip} hit 20/hr cap`,
      ipAddress: req.ip,
      path: req.path,
      method: req.method,
      statusCode: 429,
      userAgent: req.headers["user-agent"] ?? null,
      userId: req.authUser?.id ?? null,
    });
    res.status(429).json({ error: "Upload limit reached. You can upload up to 20 photos per hour." });
  },
});

app.use("/api", globalLimiter);
app.use("/api/auth", writeLimiter);
app.use("/api/photos/:id/like", writeLimiter);
app.use("/api/photos/:id/download", writeLimiter);
app.use("/api/upload", uploadLimiter);

// ── Logging ───────────────────────────────────────────────────────────────────
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({ credentials: true, origin: true }));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use("/api/subscription/webhook", express.raw({ type: "application/json" }));
app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// ── Suspicious-input detection ────────────────────────────────────────────────
const SQL_INJECTION = /(\bUNION\b|\bSELECT\b|\bDROP\b|\bINSERT\b|\bDELETE\b|\bOR\b\s+['"]?\d+['"]?\s*=\s*['"]?\d)/i;
const XSS_PATTERN   = /<script[\s\S]*?>[\s\S]*?<\/script>|javascript:/i;

app.use((req: Request, res: Response, next: NextFunction) => {
  const raw = JSON.stringify({ body: req.body, query: req.query, params: req.params });

  if (SQL_INJECTION.test(raw)) {
    logger.warn({ ip: req.ip, path: req.path }, "Possible SQL injection attempt blocked");
    logSecurityEvent({
      eventType: "sql_injection_attempt",
      severity: "critical",
      message: `SQL injection pattern detected on ${req.method} ${req.path}`,
      ipAddress: req.ip,
      path: req.path,
      method: req.method,
      statusCode: 400,
      userAgent: req.headers["user-agent"] ?? null,
      userId: req.authUser?.id ?? null,
      metadata: { rawSnippet: raw.slice(0, 200) },
    });
    res.status(400).json({ error: "Invalid input detected." });
    return;
  }

  if (XSS_PATTERN.test(raw)) {
    logger.warn({ ip: req.ip, path: req.path }, "Possible XSS attempt blocked");
    logSecurityEvent({
      eventType: "xss_attempt",
      severity: "critical",
      message: `XSS pattern detected on ${req.method} ${req.path}`,
      ipAddress: req.ip,
      path: req.path,
      method: req.method,
      statusCode: 400,
      userAgent: req.headers["user-agent"] ?? null,
      userId: req.authUser?.id ?? null,
      metadata: { rawSnippet: raw.slice(0, 200) },
    });
    res.status(400).json({ error: "Invalid input detected." });
    return;
  }

  next();
});

// ── Auth middleware ───────────────────────────────────────────────────────────
app.use(authMiddleware);

// ── IP block enforcement ──────────────────────────────────────────────────────
// Runs after auth so we always log the IP; admin routes are exempt from blocking
app.use("/api", async (req, res, next) => {
  // Exempt admin routes from IP blocking (so admins can unblock themselves)
  if (req.path.startsWith("/admin")) { next(); return; }
  await ipBlockMiddleware(req, res, next);
});

// ── 401/403 response interceptor ─────────────────────────────────────────────
// Hooks into responses AFTER routes run, capturing auth failures & forbidden access.
app.use((req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json.bind(res);
  res.json = function (body: unknown) {
    const code = res.statusCode;
    if (code === 401) {
      logSecurityEvent({
        eventType: "auth_failure",
        severity: "warn",
        message: `Unauthorized: ${req.method} ${req.path}`,
        ipAddress: req.ip,
        path: req.path,
        method: req.method,
        statusCode: 401,
        userAgent: req.headers["user-agent"] ?? null,
        userId: req.authUser?.id ?? null,
      });
    } else if (code === 403) {
      logSecurityEvent({
        eventType: "forbidden",
        severity: "warn",
        message: `Forbidden: ${req.method} ${req.path}`,
        ipAddress: req.ip,
        path: req.path,
        method: req.method,
        statusCode: 403,
        userAgent: req.headers["user-agent"] ?? null,
        userId: req.authUser?.id ?? null,
      });
    }
    return originalJson(body);
  };
  next();
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/uploads", express.static(path.resolve(process.cwd(), "public", "uploads")));
app.use("/api", router);

// ── Serve SPA (production) ────────────────────────────────────────────────────
import fs from "fs";
const siteDist = path.resolve(process.cwd(), "artifacts/photo-site/dist/public");
if (fs.existsSync(siteDist)) {
  app.use(express.static(siteDist));
  app.use((_req, res) => {
    res.sendFile(path.join(siteDist, "index.html"));
  });
}

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error(err, "Unhandled server error");
  logSecurityEvent({
    eventType: "api_error",
    severity: "error",
    message: `Unhandled error: ${err.message}`,
    ipAddress: req.ip,
    path: req.path,
    method: req.method,
    statusCode: 500,
    userAgent: req.headers["user-agent"] ?? null,
    userId: req.authUser?.id ?? null,
    metadata: { stack: err.stack?.slice(0, 500) },
  });
  res.status(500).json({ error: "Internal server error." });
});

export default app;
