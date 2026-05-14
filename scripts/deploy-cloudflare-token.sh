#!/usr/bin/env sh
set -eu

if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
  echo "Error: CLOUDFLARE_API_TOKEN is not set."
  echo "Create a Cloudflare API token with Workers Scripts Edit + Account Read permissions."
  exit 1
fi

if [ -z "${CLOUDFLARE_ACCOUNT_ID:-}" ]; then
  echo "Error: CLOUDFLARE_ACCOUNT_ID is not set."
  echo "Set it to your Cloudflare account id before deploying."
  exit 1
fi

echo "Building workspace..."
pnpm run build:deploy

echo "Deploying worker with API token auth..."
npx wrangler deploy

echo "Deploy completed."
