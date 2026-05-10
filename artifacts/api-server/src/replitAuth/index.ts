import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";
import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { AuthUser } from "../lib/authUser";

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!,
    );
  },
  { maxAge: 3600 * 1000 },
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: Record<string, unknown>,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
) {
  user["claims"] = tokens.claims();
  user["access_token"] = tokens.access_token;
  user["refresh_token"] = tokens.refresh_token;
  const claims = tokens.claims();
  user["expires_at"] = claims?.exp;
}

async function upsertUser(claims: Record<string, unknown>): Promise<AuthUser> {
  const id = String(claims["sub"]);
  const email = typeof claims["email"] === "string" ? claims["email"] : null;
  const firstName = typeof claims["first_name"] === "string" ? claims["first_name"] : null;
  const lastName = typeof claims["last_name"] === "string" ? claims["last_name"] : null;
  const profileImageUrl = typeof claims["profile_image_url"] === "string" ? claims["profile_image_url"] : null;

  const [user] = await db
    .insert(usersTable)
    .values({ id, email, firstName, lastName, profileImageUrl })
    .onConflictDoUpdate({
      target: usersTable.id,
      set: { email, firstName, lastName, profileImageUrl },
    })
    .returning();

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    profileImageUrl: user.profileImageUrl,
  };
}

export async function setupReplitAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (tokens, verified) => {
    const user: Record<string, unknown> = {};
    updateUserSession(user, tokens);
    const claims = tokens.claims() ?? {};
    await upsertUser(claims as Record<string, unknown>);
    verified(null, user as Express.User);
  };

  const registeredStrategies = new Set<string>();

  // In development, the Vite proxy rewrites Host to localhost, so we must
  // use REPLIT_DEV_DOMAIN (or X-Forwarded-Host) to get the real public domain.
  const getPublicDomain = (req: import("express").Request): string =>
    process.env.REPLIT_DEV_DOMAIN ||
    (req.get("x-forwarded-host") as string | undefined) ||
    req.hostname;

  const ensureStrategy = (domain: string) => {
    const strategyName = `replitauth:${domain}`;
    if (!registeredStrategies.has(strategyName)) {
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify,
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }
  };

  passport.serializeUser((user, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/login", (req, res, next) => {
    const domain = getPublicDomain(req);
    ensureStrategy(domain);
    passport.authenticate(`replitauth:${domain}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/login", (req, res, next) => {
    const domain = getPublicDomain(req);
    ensureStrategy(domain);
    passport.authenticate(`replitauth:${domain}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    const domain = getPublicDomain(req);
    ensureStrategy(domain);
    passport.authenticate(`replitauth:${domain}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/auth/error",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    const domain = getPublicDomain(req);
    req.logout(() => {
      res.redirect(
        client
          .buildEndSessionUrl(config, {
            client_id: process.env.REPL_ID!,
            post_logout_redirect_uri: `https://${domain}`,
          })
          .href,
      );
    });
  });

  app.get("/logout", (req, res) => {
    const domain = getPublicDomain(req);
    req.logout(() => {
      res.redirect(
        client
          .buildEndSessionUrl(config, {
            client_id: process.env.REPL_ID!,
            post_logout_redirect_uri: `https://${domain}`,
          })
          .href,
      );
    });
  });
}

export const requireAuth: RequestHandler = async (req, res, next) => {
  const user = req.user as Record<string, unknown> | undefined;

  if (!req.isAuthenticated() || !user?.["expires_at"]) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= (user["expires_at"] as number)) {
    next();
    return;
  }

  const refreshToken = user["refresh_token"];
  if (!refreshToken) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken as string);
    updateUserSession(user, tokenResponse);
    next();
  } catch {
    res.status(401).json({ error: "Not authenticated" });
  }
};

export function getCurrentAuthUser(req: Express.Request): AuthUser | null {
  const user = req.user as Record<string, unknown> | undefined;
  if (!user || !req.isAuthenticated()) return null;

  const claims = user["claims"] as Record<string, unknown> | undefined;
  if (!claims) return null;

  return {
    id: String(claims["sub"]),
    email: typeof claims["email"] === "string" ? claims["email"] : null,
    firstName: typeof claims["first_name"] === "string" ? claims["first_name"] : null,
    lastName: typeof claims["last_name"] === "string" ? claims["last_name"] : null,
    profileImageUrl: typeof claims["profile_image_url"] === "string" ? claims["profile_image_url"] : null,
  };
}
