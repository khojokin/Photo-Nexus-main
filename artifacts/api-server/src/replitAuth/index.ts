import type { RequestHandler, Request, Response, NextFunction } from "express";
import * as client from "openid-client";
import { createSession, setSessionCookie, clearSession, getSessionId, getSession } from "../lib/auth";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { AuthUser } from "../lib/authUser";

let _config: client.Configuration | null = null;

async function getOidcConfig(): Promise<client.Configuration> {
  if (_config) return _config;
  const issuer = "https://replit.com/oidc";
  _config = await client.discovery(new URL(issuer), process.env.REPL_ID!, process.env.REPL_ID!);
  return _config;
}

function getCallbackUrl(): string {
  const domain = process.env.REPLIT_DEV_DOMAIN ?? process.env.REPLIT_DOMAINS?.split(",")[0];
  return `https://${domain}/api/auth/callback`;
}

export const requireAuth: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  if (!req.authUser) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  next();
};

export function getCurrentAuthUser(req: Request): AuthUser | null {
  return req.authUser ?? null;
}

export const loginHandler: RequestHandler = async (req: Request, res: Response) => {
  try {
    const config = await getOidcConfig();
    const state = client.randomState();
    const nonce = client.randomNonce();
    const codeVerifier = client.randomPKCECodeVerifier();
    const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);

    const returnTo = (req.query.returnTo as string) || "/";

    const params = new URLSearchParams({
      response_type: "code",
      client_id: process.env.REPL_ID!,
      redirect_uri: getCallbackUrl(),
      scope: "openid email profile",
      state,
      nonce,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      prompt: "login",
    });

    res.cookie("oidc_state", state, { httpOnly: true, sameSite: "lax", maxAge: 10 * 60 * 1000 });
    res.cookie("oidc_nonce", nonce, { httpOnly: true, sameSite: "lax", maxAge: 10 * 60 * 1000 });
    res.cookie("oidc_cv", codeVerifier, { httpOnly: true, sameSite: "lax", maxAge: 10 * 60 * 1000 });
    res.cookie("oidc_return_to", returnTo, { httpOnly: true, sameSite: "lax", maxAge: 10 * 60 * 1000 });

    const authUrl = new URL(config.serverMetadata().authorization_endpoint!);
    params.forEach((v, k) => authUrl.searchParams.set(k, v));

    res.redirect(authUrl.toString());
  } catch (err) {
    console.error("Login handler error:", err);
    res.redirect("/?auth_error=1");
  }
};

export const callbackHandler: RequestHandler = async (req: Request, res: Response) => {
  try {
    const config = await getOidcConfig();

    const state = req.cookies?.oidc_state;
    const nonce = req.cookies?.oidc_nonce;
    const codeVerifier = req.cookies?.oidc_cv;
    const returnTo = req.cookies?.oidc_return_to || "/";

    res.clearCookie("oidc_state");
    res.clearCookie("oidc_nonce");
    res.clearCookie("oidc_cv");
    res.clearCookie("oidc_return_to");

    const callbackUrl = getCallbackUrl();
    const currentUrl = new URL(req.url, `https://${req.headers.host}`);

    const tokens = await client.authorizationCodeGrant(config, currentUrl, {
      pkceCodeVerifier: codeVerifier,
      expectedState: state,
      expectedNonce: nonce,
      idTokenExpected: true,
    });

    const claims = tokens.claims();
    if (!claims) throw new Error("No claims returned");

    const replId = String(claims.sub);
    const email = claims.email ? String(claims.email) : null;
    const firstName = claims.given_name ? String(claims.given_name) : (claims.name ? String(claims.name).split(" ")[0] : null);
    const lastName = claims.family_name ? String(claims.family_name) : (claims.name ? String(claims.name).split(" ").slice(1).join(" ") || null : null);
    const profileImageUrl = claims.profile_picture ? String(claims.profile_picture) : null;

    let [existing] = await db.select().from(usersTable).where(eq(usersTable.id, replId)).limit(1);

    if (!existing) {
      const [created] = await db.insert(usersTable).values({
        id: replId,
        email,
        firstName,
        lastName,
        profileImageUrl,
      }).returning();
      existing = created;
    } else {
      const [updated] = await db.update(usersTable)
        .set({ email, firstName, lastName, profileImageUrl, updatedAt: new Date() })
        .where(eq(usersTable.id, replId))
        .returning();
      existing = updated;
    }

    const authUser: AuthUser = {
      id: existing.id,
      email: existing.email ?? null,
      emailVerified: true,
      firstName: existing.firstName ?? null,
      lastName: existing.lastName ?? null,
      profileImageUrl: existing.profileImageUrl ?? null,
    };

    const sid = await createSession({ user: authUser });
    setSessionCookie(res, sid);

    res.redirect(returnTo);
  } catch (err) {
    console.error("Callback handler error:", err);
    res.redirect("/?auth_error=1");
  }
};

export const logoutHandler: RequestHandler = async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  await clearSession(res, sid).catch(() => {});
  res.redirect("/");
};
