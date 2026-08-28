#!/usr/bin/env bash
set -euo pipefail

node_version="$(node -p "process.versions.node")"
pnpm_version="$(pnpm --version)"

if [ "$node_version" = "20.17.0" ] && [ "$pnpm_version" = "10.18.0" ]; then
  pnpm docs:structure
  exec pnpm docs:links
fi

printf 'Docs checks require Node 20.17.0 and pnpm 10.18.0 (found Node %s, pnpm %s); using the pinned Docker toolchain.\n' "$node_version" "$pnpm_version"
exec docker compose run --rm --entrypoint bash docs -lc "cd /workspace && pnpm install --frozen-lockfile && pnpm docs:structure && pnpm docs:links"
