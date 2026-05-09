import { type Request, type Response, type NextFunction } from "express";
import { verifyToken } from "@clerk/backend";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
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
  void (async () => {
    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) {
      req.authUser = undefined;
      next();
      return;
    }

    const token = getTokenFromRequest(req);
    if (!token) {
      req.authUser = undefined;
      next();
      return;
    }

    try {
      const claims = await verifyToken(token, { secretKey });
      req.authUser = await findOrCreateUser(claims as Record<string, unknown>);
    } catch {
      req.authUser = undefined;
    }

    next();
  })();
}

function getTokenFromRequest(req: Request): string | null {
  const authorization = req.headers.authorization;
  if (authorization?.toLowerCase().startsWith("bearer ")) {
    return authorization.slice(7).trim();
  }

  const sessionCookie = req.cookies?.__session;
  if (typeof sessionCookie === "string" && sessionCookie.length > 0) {
    return sessionCookie;
  }

  return null;
}

async function findOrCreateUser(claims: Record<string, unknown>): Promise<AuthUser> {
  const clerkUserId = getStringClaim(claims, "sub");
  if (!clerkUserId) {
    throw new Error("Missing clerk subject claim");
  }

  const email =
    getStringClaim(claims, "email") ??
    getStringClaim(claims, "email_address") ??
    null;
  const firstName =
    getStringClaim(claims, "given_name") ??
    getStringClaim(claims, "first_name") ??
    null;
  const lastName =
    getStringClaim(claims, "family_name") ??
    getStringClaim(claims, "last_name") ??
    null;
  const profileImageUrl =
    getStringClaim(claims, "picture") ??
    getStringClaim(claims, "image_url") ??
    null;

  const [existingById] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, clerkUserId));

  let user = existingById;

  if (!user && email) {
    const [existingByEmail] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));
    user = existingByEmail;
  }

  if (!user) {
    const [created] = await db
      .insert(usersTable)
      .values({
        id: clerkUserId,
        email,
        firstName,
        lastName,
        profileImageUrl,
      })
      .returning();
    return mapAuthUser(created);
  }

  const changed =
    user.email !== email ||
    user.firstName !== firstName ||
    user.lastName !== lastName ||
    user.profileImageUrl !== profileImageUrl;

  if (changed) {
    const [updated] = await db
      .update(usersTable)
      .set({
        email,
        firstName,
        lastName,
        profileImageUrl,
      })
      .where(eq(usersTable.id, user.id))
      .returning();
    user = updated;
  }

  return mapAuthUser(user);
}

function getStringClaim(claims: Record<string, unknown>, key: string): string | null {
  const value = claims[key];
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function mapAuthUser(user: {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}): AuthUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    profileImageUrl: user.profileImageUrl,
  };
}
