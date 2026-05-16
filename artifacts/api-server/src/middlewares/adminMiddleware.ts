import { type Request, type Response, type NextFunction } from "express";

const ADMIN_EMAILS = new Set(
  (process.env.ADMIN_EMAILS ?? "kingsfordkojo7@gmail.com,kingsfordkojo7@icloud.com,photographer@affuaa.com")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
);

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.authUser) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  if (!req.authUser.emailVerified) {
    res.status(403).json({ error: "Verified email required for admin access" });
    return;
  }

  const email = (req.authUser.email ?? "").toLowerCase();
  if (!ADMIN_EMAILS.has(email)) {
    res.status(403).json({ error: "Admin access required" });
    return;
  }

  next();
}
