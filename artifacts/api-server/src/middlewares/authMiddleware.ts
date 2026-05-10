import { type Request, type Response, type NextFunction } from "express";
import { getCurrentAuthUser } from "../replitAuth";

declare global {
  namespace Express {
    interface Request {
      authUser?: import("../lib/authUser").AuthUser | undefined;
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
