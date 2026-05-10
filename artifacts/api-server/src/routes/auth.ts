import { Router, type IRouter, type Request, type Response } from "express";
import {
  GetCurrentAuthUserResponse,
  LogoutUserResponse,
} from "@workspace/api-zod";
import { db, usersTable } from "@workspace/db";

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

router.post("/auth/demo-login", (req: Request, res: Response) => {
  void (async () => {
    const demoId = "demo-user-001";
    const demoEmail = "demo@affuaa.com";
    const demoFirstName = "Demo";
    const demoLastName = "User";

    await db
      .insert(usersTable)
      .values({
        id: demoId,
        email: demoEmail,
        firstName: demoFirstName,
        lastName: demoLastName,
        profileImageUrl: null,
      })
      .onConflictDoNothing();

    const sessionUser = {
      claims: {
        sub: demoId,
        email: demoEmail,
        first_name: demoFirstName,
        last_name: demoLastName,
        profile_image_url: null,
      },
      expires_at: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
    };

    req.login(sessionUser as Express.User, (err) => {
      if (err) {
        res.status(500).json({ error: "Login failed" });
        return;
      }
      res.json({ success: true });
    });
  })();
});

export default router;
