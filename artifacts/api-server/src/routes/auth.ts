import { Router, type IRouter, type Request, type Response } from "express";
import {
  GetCurrentAuthUserResponse,
  LogoutUserResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/auth/user", (req: Request, res: Response) => {
  res.set("Cache-Control", "no-store");
  res.json(
    GetCurrentAuthUserResponse.parse({
      user: req.authUser ?? null,
    }),
  );
});

router.post("/auth/logout", (_req: Request, res: Response) => {
  res.json(LogoutUserResponse.parse({ success: true }));
});

router.get("/auth/error", (_req: Request, res: Response) => {
  res.redirect("/?auth_error=1");
});

router.get("/login", (_req: Request, res: Response) => {
  res.redirect("/");
});

router.get("/api/login", (_req: Request, res: Response) => {
  res.redirect("/");
});

router.get("/api/logout", (_req: Request, res: Response) => {
  res.redirect("/");
});

router.get("/logout", (_req: Request, res: Response) => {
  res.redirect("/");
});

router.post("/auth/demo-login", (req: Request, res: Response) => {
  res.json({
    success: true,
    user: req.authUser,
  });
});

export default router;
