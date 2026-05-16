import { Router, type IRouter, type Request, type Response } from "express";
import {
  GetCurrentAuthUserResponse,
  LogoutUserResponse,
} from "@workspace/api-zod";
import {
  loginHandler,
  callbackHandler,
  logoutHandler,
} from "../replitAuth/index";

const router: IRouter = Router();

router.get("/auth/user", (req: Request, res: Response) => {
  res.set("Cache-Control", "no-store");
  res.json(
    GetCurrentAuthUserResponse.parse({
      user: req.authUser ?? null,
    }),
  );
});

router.post("/auth/logout", async (req: Request, res: Response) => {
  await logoutHandler(req, res, () => {});
  if (!res.headersSent) {
    res.json(LogoutUserResponse.parse({ success: true }));
  }
});

router.get("/auth/error", (_req: Request, res: Response) => {
  res.redirect("/?auth_error=1");
});

router.get("/auth/callback", callbackHandler);

router.get("/login", loginHandler);
router.get("/api/login", loginHandler);

router.get("/logout", logoutHandler);
router.get("/api/logout", logoutHandler);

router.post("/auth/demo-login", (req: Request, res: Response) => {
  res.json({
    success: true,
    user: req.authUser ?? null,
  });
});

export default router;
