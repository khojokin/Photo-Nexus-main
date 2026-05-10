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

export default app;
