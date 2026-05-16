import { type Request, type Response, type NextFunction } from "express";
import { getSession, getSessionId } from "../lib/auth";

declare global {
  namespace Express {
    interface Request {
      authUser?: import("../lib/authUser").AuthUser | undefined;
    }
  }
}

export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const sid = getSessionId(req);
  if (sid) {
    const session = await getSession(sid).catch(() => null);
    if (session?.user) {
      req.authUser = session.user;
    }
  }
  next();
}
