#!/usr/bin/env bash
set -euo pipefail

node_version="$(node -p "process.versions.node")"
pnpm_version="$(pnpm --version)"

if [ "$node_version" = "20.17.0" ] && [ "$pnpm_version" = "10.18.0" ]; then
  pnpm docs:validate
  pnpm docs:links
  pnpm docs:a11y
  exec pnpm docs:structure
fi

if ! command -v docker >/dev/null 2>&1 || ! docker compose version >/dev/null 2>&1; then
  printf 'Deploy checks require Node 20.17.0 and pnpm 10.18.0 (found Node %s, pnpm %s); Docker Compose is not available for the fallback toolchain.\n' "$node_version" "$pnpm_version" >&2
  exit 1
fi

printf 'Deploy checks require Node 20.17.0 and pnpm 10.18.0 (found Node %s, pnpm %s); using the pinned Docker toolchain.\n' "$node_version" "$pnpm_version"
exec docker compose run --rm --entrypoint bash docs -lc "cd /workspace && pnpm install --frozen-lockfile && pnpm docs:validate && pnpm docs:links && pnpm docs:a11y && pnpm docs:structure"
