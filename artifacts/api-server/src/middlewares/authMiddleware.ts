import { type Request, type Response, type NextFunction } from "express";
import { verifyToken } from "@clerk/backend";
import { getCurrentAuthUser } from "../replitAuth";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

declare global {
  namespace Express {
    interface Request {
      authUser?: import("../lib/authUser").AuthUser | undefined;
    }
  }
}

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY ?? "";

async function upsertClerkUser(user: import("../lib/authUser").AuthUser): Promise<void> {
  try {
    await db
      .insert(usersTable)
      .values({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
      })
      .onConflictDoUpdate({
        target: usersTable.id,
        set: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
          updatedAt: new Date(),
        },
      });
  } catch {
    // Non-fatal — auth still proceeds even if upsert fails
  }
}

async function getClerkAuthUser(req: Request): Promise<import("../lib/authUser").AuthUser | null> {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) return null;
  if (!CLERK_SECRET_KEY) return null;

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) return null;

  try {
    const payload = await verifyToken(token, { secretKey: CLERK_SECRET_KEY });
    const email = typeof payload.email === "string"
      ? payload.email
      : typeof payload.email_address === "string"
        ? payload.email_address
        : null;
    const emailVerified = payload.email_verified === true || payload.email_verified === "true";

    const authUser: import("../lib/authUser").AuthUser = {
      id: String(payload.sub),
      email,
      emailVerified,
      firstName: typeof payload.given_name === "string" ? payload.given_name : null,
      lastName: typeof payload.family_name === "string" ? payload.family_name : null,
      profileImageUrl: typeof payload.picture === "string" ? payload.picture : null,
    };

    // Ensure the user exists in our DB on every authenticated request
    await upsertClerkUser(authUser);

    return authUser;
  } catch {
    return null;
  }
}

export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const clerkAuthUser = await getClerkAuthUser(req);
  if (clerkAuthUser) {
    req.authUser = clerkAuthUser;
    next();
    return;
  }

  req.authUser = getCurrentAuthUser(req) ?? undefined;
  next();
}
