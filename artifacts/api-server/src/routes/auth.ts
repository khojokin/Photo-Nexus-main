import { Router, type IRouter, type Request, type Response } from "express";
import {
  GetCurrentAuthUserResponse,
  LogoutUserResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/auth/google", (_req: Request, res: Response) => {
  res.redirect("/signin");
});

router.get("/auth/google/callback", (_req: Request, res: Response) => {
  res.redirect("/signin");
});

router.get("/auth/apple", (_req: Request, res: Response) => {
  res.redirect("/signin");
});

router.get("/auth/user", (req: Request, res: Response) => {
  res.json(
    GetCurrentAuthUserResponse.parse({
      user: req.isAuthenticated() ? req.user : null,
    }),
  );
});

router.post("/auth/login", (_req: Request, res: Response) => {
  res.status(410).json({
    error: "Password login has been replaced by Clerk. Use /signin in the frontend.",
  });
});

router.post("/auth/register", (_req: Request, res: Response) => {
  res.status(410).json({
    error: "Password registration has been replaced by Clerk. Use /signup in the frontend.",
  });
});

router.post("/auth/logout", (_req: Request, res: Response) => {
  res.json(LogoutUserResponse.parse({ success: true }));
});

export default router;
