import { type Request, type Response, type NextFunction } from "express";
import { getCurrentAuthUser } from "../replitAuth";

declare global {
  namespace Express {
    interface Request {
      authUser?: import("../lib/authUser").AuthUser | undefined;
    }
  }
}

const DEFAULT_AUTH_USER = {
  id: "guest-user-001",
  email: "kingsfordkojo7@gmail.com",
  firstName: "Kingsford",
  lastName: "Kojo",
  profileImageUrl: null,
};

export function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  req.authUser = getCurrentAuthUser(req) ?? DEFAULT_AUTH_USER;
  next();
}
