import type { RequestHandler } from "express";
import type { AuthUser } from "../lib/authUser";

const DEFAULT_USER: AuthUser = {
  id: "default-user-001",
  email: "photographer@affuaa.com",
  emailVerified: true,
  firstName: "Alex",
  lastName: "Morgan",
  profileImageUrl: null,
};

export const requireAuth: RequestHandler = (_req, _res, next) => {
  next();
};

export function getCurrentAuthUser(_req: unknown): AuthUser {
  return DEFAULT_USER;
}
