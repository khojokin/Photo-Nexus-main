export interface Env {
  ASSETS: Fetcher;
  API_ORIGIN?: string;
  UPLOADS?: R2Bucket;
}

type PhotoRecord = {
  id: number;
  title: string;
  description: string | null;
  imageUrl: string;
  width: number;
  height: number;
  photographerName: string;
  tags: string[];
  isFeatured: boolean;
  camera: string | null;
  lens: string | null;
  aperture: string | null;
  shutterSpeed: string | null;
  iso: number | null;
  focalLength: string | null;
  license: string;
  status: string;
  createdAt: string;
};

const PHOTO_INDEX_KEY = "photos/index.json";

function json(data: unknown, init?: ResponseInit): Response {
  return Response.json(data, init);
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").slice(-120);
}

async function requireR2(env: Env): Promise<R2Bucket> {
  if (!env.UPLOADS) {
    throw new Error("Uploads storage is not configured");
  }
  return env.UPLOADS;
}

async function appendPhotoIndex(bucket: R2Bucket, id: number): Promise<void> {
  const existing = await bucket.get(PHOTO_INDEX_KEY);
  const ids = existing ? ((await existing.json()) as number[]) : [];
  ids.unshift(id);
  await bucket.put(PHOTO_INDEX_KEY, JSON.stringify(ids.slice(0, 5000)), {
    httpMetadata: { contentType: "application/json" },
  });
}

async function readPhoto(bucket: R2Bucket, id: number): Promise<PhotoRecord | null> {
  const obj = await bucket.get(`photos/${id}.json`);
  if (!obj) return null;
  return (await obj.json()) as PhotoRecord;
}

async function handleUpload(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const bucket = await requireR2(env);
  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return json({ error: "Missing file in multipart form data" }, { status: 400 });
  }

  const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : "";
  const key = `uploads/${Date.now()}-${crypto.randomUUID()}-${sanitizeFileName(file.name || `upload${ext}`)}`;

  await bucket.put(key, file.stream(), {
    httpMetadata: {
      contentType: file.type || "application/octet-stream",
      cacheControl: "public, max-age=31536000, immutable",
    },
  });

  return json({ url: `/uploads/${key.replace(/^uploads\//, "")}` }, { status: 200 });
}

async function handlePhotos(request: Request, env: Env, url: URL): Promise<Response> {
  const bucket = await requireR2(env);

  if (request.method === "POST") {
    const body = (await request.json()) as Partial<PhotoRecord>;
    const id = Date.now();
    const record: PhotoRecord = {
      id,
      title: body.title ?? "Untitled",
      description: body.description ?? null,
      imageUrl: body.imageUrl ?? "",
      width: body.width ?? 0,
      height: body.height ?? 0,
      photographerName: body.photographerName ?? "Unknown",
      tags: Array.isArray(body.tags) ? body.tags : [],
      isFeatured: Boolean(body.isFeatured),
      camera: body.camera ?? null,
      lens: body.lens ?? null,
      aperture: body.aperture ?? null,
      shutterSpeed: body.shutterSpeed ?? null,
      iso: typeof body.iso === "number" ? body.iso : null,
      focalLength: body.focalLength ?? null,
      license: body.license ?? "cc0",
      status: body.status ?? "published",
      createdAt: new Date().toISOString(),
    };

    await bucket.put(`photos/${id}.json`, JSON.stringify(record), {
      httpMetadata: { contentType: "application/json", cacheControl: "no-store" },
    });
    await appendPhotoIndex(bucket, id);

    return json({ id, ...record }, { status: 201 });
  }

  if (request.method !== "GET") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const path = url.pathname;
  const exactMatch = path.match(/^\/api\/photos\/(\d+)$/);
  if (exactMatch) {
    const id = Number(exactMatch[1]);
    const photo = await readPhoto(bucket, id);
    if (!photo) return json({ error: "Photo not found" }, { status: 404 });
    return json(photo);
  }

  const indexObj = await bucket.get(PHOTO_INDEX_KEY);
  const ids = indexObj ? ((await indexObj.json()) as number[]) : [];
  const limitParam = Number(url.searchParams.get("limit") ?? 24);
  const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(limitParam, 100)) : 24;

  const slice = ids.slice(0, limit);
  const photos = (
    await Promise.all(slice.map((id) => readPhoto(bucket, id)))
  ).filter((p): p is PhotoRecord => Boolean(p));

  return json(photos);
}

async function handleUploadsRead(env: Env, pathName: string): Promise<Response | null> {
  if (!pathName.startsWith("/uploads/")) return null;
  const bucket = await requireR2(env);
  const key = `uploads/${pathName.replace(/^\/uploads\//, "")}`;
  const obj = await bucket.get(key);
  if (!obj) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set("etag", obj.httpEtag);
  headers.set("cache-control", headers.get("cache-control") ?? "public, max-age=31536000, immutable");

  return new Response(obj.body, { headers, status: 200 });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Force canonical production domain for auth compatibility.
    // Keep API paths on the same origin to avoid browser CORS issues.
    if (url.hostname.endsWith("workers.dev") && !url.pathname.startsWith("/api/")) {
      const canonical = new URL(request.url);
      canonical.hostname = "affuaa.com";
      return Response.redirect(canonical.toString(), 301);
    }

    // Optional API proxy: set API_ORIGIN in Wrangler env vars when needed.
    if (env.API_ORIGIN && url.pathname.startsWith("/api/")) {
      const target = new URL(`${url.pathname}${url.search}`, env.API_ORIGIN);
      return fetch(new Request(target.toString(), request));
    }

    // Worker-side upload fallback for Cloudflare-only mode.
    if (!env.API_ORIGIN) {
      if (url.pathname === "/api/health") {
        return json({ ok: true, mode: "worker-fallback" });
      }

      if (url.pathname === "/api/upload") {
        try {
          return await handleUpload(request, env);
        } catch (error) {
          return json(
            {
              error: "Upload storage is not configured",
              detail: error instanceof Error ? error.message : "Unknown upload error",
            },
            { status: 503 },
          );
        }
      }

      if (url.pathname === "/api/photos" || url.pathname.startsWith("/api/photos/")) {
        try {
          return await handlePhotos(request, env, url);
        } catch (error) {
          return json(
            {
              error: "Photo service is unavailable",
              detail: error instanceof Error ? error.message : "Unknown photo error",
            },
            { status: 503 },
          );
        }
      }
    }

    if (url.pathname.startsWith("/api/")) {
      return Response.json(
        {
          error: "API backend is not configured",
          detail: "Set API_ORIGIN for the Cloudflare worker to a live API server origin.",
        },
        { status: 503 },
      );
    }

    if (!env.API_ORIGIN) {
      try {
        const uploadResponse = await handleUploadsRead(env, url.pathname);
        if (uploadResponse) return uploadResponse;
      } catch {
        return new Response("Storage unavailable", { status: 503 });
      }
    }

    const assetResponse = await env.ASSETS.fetch(request);
    const contentType = assetResponse.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) {
      return assetResponse;
    }

    // Always serve fresh HTML so clients pick up latest app routing logic.
    const headers = new Headers(assetResponse.headers);
    headers.set("cache-control", "no-store, no-cache, must-revalidate, max-age=0");
    return new Response(assetResponse.body, {
      status: assetResponse.status,
      statusText: assetResponse.statusText,
      headers,
    });
  },
};
