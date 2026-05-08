# Affuaa

A premium photo discovery platform for photographers who care about the craft — like Unsplash but with gallery-quality curation and a cinematic darkroom aesthetic.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/photo-site run dev` — run the frontend (port 24544)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, shadcn/ui, wouter routing, Framer Motion
- API: Express 5, pino logging
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all API contracts)
- `lib/db/src/schema/` — Drizzle DB schemas (photos, collections, collection_photos)
- `artifacts/api-server/src/routes/` — Express route handlers (photos, collections, tags, stats)
- `artifacts/photo-site/src/` — React frontend (pages, components, styling)
- `lib/api-client-react/src/generated/` — Generated React Query hooks (do not edit)
- `lib/api-zod/src/generated/` — Generated Zod validation schemas (do not edit)

## Architecture decisions

- OpenAPI-first: all API contracts defined in `openapi.yaml`, code generated via Orval
- Orval zod output uses `target: "generated/api.ts"` with no separate `schemas` path to avoid duplicate export conflicts
- Photos use Postgres array column (`tags text[]`) for tag storage; unnest used for tag aggregation
- Collection-photo relationship stored in a junction table with composite primary key
- Featured photos queried via `is_featured` boolean flag; trending via `likes + downloads` sum

## Product

- **Homepage** — Hero with featured photos, site stats, trending section, collections preview
- **Explore** — Masonry photo grid with live search, tag filter chips, sort by latest/popular/trending
- **Photo Detail** — Full-bleed photo view with photographer card, like + download actions
- **Collections** — Browse and create curated collections
- **Tags** — Browse photos by tag

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After any OpenAPI spec change, run `pnpm --filter @workspace/api-spec run codegen` before starting the server
- Do NOT add `schemas` path back to the Orval zod config — it causes duplicate TypeScript/Zod exports
- The `lib/api-zod/src/index.ts` only exports from `./generated/api` (no types sub-barrel)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
