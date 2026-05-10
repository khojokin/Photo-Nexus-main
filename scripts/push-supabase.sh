#!/usr/bin/env zsh
set -euo pipefail

PROJECT_REF="jpsymmcwinxvpxlrhrrn"
DB_HOST="db.${PROJECT_REF}.supabase.co"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres"

if [[ -z "${SUPABASE_DB_PASSWORD:-}" ]]; then
  echo "Enter your Supabase database password for project ${PROJECT_REF}:"
  read -rs SUPABASE_DB_PASSWORD
  echo
fi

if [[ -z "${SUPABASE_DB_PASSWORD}" ]]; then
  echo "SUPABASE_DB_PASSWORD is required."
  exit 1
fi

ENC_PASSWORD=$(node -e 'process.stdout.write(encodeURIComponent(process.argv[1]))' "$SUPABASE_DB_PASSWORD")
export DATABASE_URL="postgresql://${DB_USER}:${ENC_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=require"

echo "Pushing Drizzle schema to Supabase..."
pnpm --filter @workspace/db run push-force

echo "Seeding demo data..."
node lib/db/seed-demo.mjs

echo "Done. Supabase schema and seed completed."
