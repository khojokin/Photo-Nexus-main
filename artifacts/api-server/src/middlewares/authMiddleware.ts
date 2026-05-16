import { type Request, type Response, type NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      authUser?: import("../lib/authUser").AuthUser | undefined;
    }
  }
}

const DEFAULT_USER: import("../lib/authUser").AuthUser = {
  id: "default-user-001",
  email: "photographer@affuaa.com",
  emailVerified: true,
  firstName: "Alex",
  lastName: "Morgan",
  profileImageUrl: null,
};

export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  req.authUser = DEFAULT_USER;
  next();
}
