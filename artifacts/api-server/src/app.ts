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
  windowMs: 60 * 1000,   // 1 minute
  max: 200,              // 200 requests/IP/min — generous for a photo platform
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down." },
  skip: (req) => {
    // Skip rate limiting for static assets
    return req.path.startsWith("/uploads") || req.path.startsWith("/assets");
  },
});

// Stricter limiter for auth / write endpoints
const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests on this endpoint. Please try again shortly." },
});

// Upload limiter
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Upload limit reached. You can upload up to 20 photos per hour." },
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
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
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

// ── Basic suspicious-input detection ─────────────────────────────────────────
const SQL_INJECTION = /(\bUNION\b|\bSELECT\b|\bDROP\b|\bINSERT\b|\bDELETE\b|\bOR\b\s+['"]?\d+['"]?\s*=\s*['"]?\d)/i;
const XSS_PATTERN   = /<script[\s\S]*?>[\s\S]*?<\/script>|javascript:/i;

app.use((req: Request, res: Response, next: NextFunction) => {
  const raw = JSON.stringify({ body: req.body, query: req.query, params: req.params });
  if (SQL_INJECTION.test(raw)) {
    logger.warn({ ip: req.ip, path: req.path }, "Possible SQL injection attempt blocked");
    res.status(400).json({ error: "Invalid input detected." });
    return;
  }
  if (XSS_PATTERN.test(raw)) {
    logger.warn({ ip: req.ip, path: req.path }, "Possible XSS attempt blocked");
    res.status(400).json({ error: "Invalid input detected." });
    return;
  }
  next();
});

// ── Auth middleware ───────────────────────────────────────────────────────────
app.use(authMiddleware);

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
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(err, "Unhandled server error");
  res.status(500).json({ error: "Internal server error." });
});

export default app;
