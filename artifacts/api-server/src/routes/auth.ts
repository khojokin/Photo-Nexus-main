import { Router, type IRouter, type Request, type Response } from "express";
import {
  GetCurrentAuthUserResponse,
  LogoutUserResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/auth/user", (req: Request, res: Response) => {
  res.json(
    GetCurrentAuthUserResponse.parse({
      user: req.authUser ?? null,
    }),
  );
});

router.post("/auth/logout", (_req: Request, res: Response) => {
  res.json(LogoutUserResponse.parse({ success: true }));
});

export default router;
