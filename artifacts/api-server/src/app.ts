import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import path from "path";
import router from "./routes";
import { logger } from "./lib/logger";
import { setupReplitAuth } from "./replitAuth";
import { authMiddleware } from "./middlewares/authMiddleware";

const app: Express = express();

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
app.use(cors({ credentials: true, origin: true }));
app.use("/api/subscription/webhook", express.raw({ type: "application/json" }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

await setupReplitAuth(app);

app.use(authMiddleware);

app.use("/uploads", express.static(path.resolve(process.cwd(), "public", "uploads")));
app.use("/api", router);

// Serve the compiled photo-site SPA when the dist folder is present (production)
import fs from "fs";
const siteDist = path.resolve(process.cwd(), "artifacts/photo-site/dist/public");
if (fs.existsSync(siteDist)) {
  app.use(express.static(siteDist));
  // SPA fallback — all non-API routes serve index.html
  app.use((_req, res) => {
    res.sendFile(path.join(siteDist, "index.html"));
  });
}

export default app;
