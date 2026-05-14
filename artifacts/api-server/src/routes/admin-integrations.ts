import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import crypto from "crypto";
import Stripe from "stripe";
import { z } from "zod";
import { requireAdmin } from "../middlewares/adminMiddleware";

const router: IRouter = Router();

const ProviderEnum = z.enum(["stripe", "openai", "clerk", "supabase"]);

const IntegrationBody = z.object({
  provider: ProviderEnum,
  config: z.record(z.string(), z.string().trim().min(1)),
});

const TestBody = z.object({
  provider: ProviderEnum,
});

type IntegrationProvider = z.infer<typeof ProviderEnum>;
type IntegrationConfig = Record<string, string>;

function getEncryptionKey(): Buffer {
  const base = process.env.INTEGRATIONS_ENCRYPTION_KEY
    ?? process.env.SESSION_SECRET
    ?? process.env.CLERK_SECRET_KEY
    ?? "affuaa-dev-fallback-encryption-key";
  return crypto.createHash("sha256").update(base).digest();
}

function encryptSecret(value: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

function decryptSecret(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split(":");
  if (!ivB64 || !tagB64 || !dataB64) return "";
  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataB64, "base64")), decipher.final()]);
  return decrypted.toString("utf8");
}

function maskApiKey(value: string): string {
  if (!value) return "";
  if (value.length <= 8) return `${value.slice(0, 2)}****`;
  return `${value.slice(0, 4)}****${value.slice(-4)}`;
}

function normalizeConfig(provider: IntegrationProvider, decrypted: string): IntegrationConfig {
  try {
    const parsed = JSON.parse(decrypted) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return Object.fromEntries(
        Object.entries(parsed as Record<string, unknown>).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
      );
    }
  } catch {
    // Backward compatibility with previously stored plain keys.
  }

  if (!decrypted) return {};
  if (provider === "clerk") return { secretKey: decrypted };
  if (provider === "supabase") return { serviceRoleKey: decrypted };
  return { apiKey: decrypted };
}

function maskConfig(config: IntegrationConfig): Record<string, string> {
  return Object.fromEntries(Object.entries(config).map(([key, value]) => [key, maskApiKey(value)]));
}

async function ensureTable(): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS app_integrations (
      provider TEXT PRIMARY KEY,
      encrypted_api_key TEXT NOT NULL,
      is_connected BOOLEAN NOT NULL DEFAULT false,
      last_test_status TEXT,
      last_tested_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_by TEXT
    )
  `);
}

router.get("/admin/integrations", requireAdmin, async (_req, res): Promise<void> => {
  await ensureTable();
  const result = await db.execute<{
    provider: string;
    encrypted_api_key: string;
    is_connected: boolean;
    last_test_status: string | null;
    last_tested_at: string | null;
    updated_at: string;
  }>(sql`
    SELECT provider, encrypted_api_key, is_connected, last_test_status, last_tested_at, updated_at
    FROM app_integrations
    ORDER BY provider ASC
  `);

  const integrations = result.rows.map((row) => {
    const config = normalizeConfig(row.provider as IntegrationProvider, decryptSecret(row.encrypted_api_key));
    return {
      provider: row.provider,
      isConnected: row.is_connected,
      maskedConfig: maskConfig(config),
      lastTestStatus: row.last_test_status,
      lastTestedAt: row.last_tested_at,
      updatedAt: row.updated_at,
    };
  });

  res.json({ integrations });
});

router.put("/admin/integrations", requireAdmin, async (req, res): Promise<void> => {
  const parsed = IntegrationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid integration payload" });
    return;
  }

  await ensureTable();
  const encrypted = encryptSecret(JSON.stringify(parsed.data.config));
  await db.execute(sql`
    INSERT INTO app_integrations (provider, encrypted_api_key, is_connected, updated_at, updated_by)
    VALUES (${parsed.data.provider}, ${encrypted}, true, now(), ${req.authUser?.email ?? "admin"})
    ON CONFLICT (provider)
    DO UPDATE SET
      encrypted_api_key = EXCLUDED.encrypted_api_key,
      is_connected = true,
      updated_at = now(),
      updated_by = EXCLUDED.updated_by
  `);

  res.json({
    success: true,
    provider: parsed.data.provider,
    maskedConfig: maskConfig(parsed.data.config),
  });
});

router.post("/admin/integrations/test", requireAdmin, async (req, res): Promise<void> => {
  const parsed = TestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid provider" });
    return;
  }

  await ensureTable();
  const found = await db.execute<{ encrypted_api_key: string }>(sql`
    SELECT encrypted_api_key FROM app_integrations WHERE provider = ${parsed.data.provider} LIMIT 1
  `);
  const row = found.rows[0];
  if (!row) {
    res.status(404).json({ error: "Integration not configured" });
    return;
  }

  const config = normalizeConfig(parsed.data.provider, decryptSecret(row.encrypted_api_key));
  let ok = false;
  let message = "";

  try {
    if (parsed.data.provider === "stripe") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stripe = new Stripe(config.apiKey ?? "", { apiVersion: "2025-04-30.basil" } as any);
      await stripe.balance.retrieve();
      ok = true;
      message = "Stripe connection successful";
    } else if (parsed.data.provider === "openai") {
      const response = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${config.apiKey ?? ""}` },
      });
      if (!response.ok) {
        throw new Error(`OpenAI test failed (${response.status})`);
      }
      ok = true;
      message = "OpenAI connection successful";
    } else if (parsed.data.provider === "clerk") {
      const response = await fetch("https://api.clerk.com/v1/users?limit=1", {
        headers: { Authorization: `Bearer ${config.secretKey ?? ""}` },
      });
      if (!response.ok) {
        throw new Error(`Clerk test failed (${response.status})`);
      }
      ok = true;
      message = "Clerk connection successful";
    } else {
      const supabaseUrl = config.url ?? "";
      const supabaseKey = config.serviceRoleKey ?? config.anonKey ?? "";
      const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/`, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      });
      if (!response.ok) {
        throw new Error(`Supabase test failed (${response.status})`);
      }
      ok = true;
      message = "Supabase connection successful";
    }
  } catch (error) {
    ok = false;
    message = String(error);
  }

  await db.execute(sql`
    UPDATE app_integrations
    SET last_test_status = ${ok ? "passed" : "failed"},
        last_tested_at = now(),
        is_connected = ${ok}
    WHERE provider = ${parsed.data.provider}
  `);

  res.status(ok ? 200 : 400).json({ success: ok, provider: parsed.data.provider, message });
});

export default router;