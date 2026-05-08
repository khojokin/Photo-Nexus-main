import { type Request, type Response, type NextFunction } from "express";
import { getCurrentAuthUser } from "../replitAuth";
import type { AuthUser } from "../lib/authUser";

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthUser | undefined;
    }
  }
}

export function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  req.authUser = getCurrentAuthUser(req) ?? undefined;
  next();
}
