#!/usr/bin/env bash
set -euo pipefail

node_major="$(node -p "process.versions.node.split('.')[0]")"
node_minor="$(node -p "process.versions.node.split('.')[1]")"

if [ "$node_major" -gt 20 ] || { [ "$node_major" -eq 20 ] && [ "$node_minor" -ge 17 ]; }; then
  exec pnpm --filter @langstate/docs broken-links
fi

printf 'Node %s is below Mintlify minimum 20.17; running broken-link checks in Docker instead.\n' "$(node -p "process.versions.node")"
exec docker compose run --rm --entrypoint bash docs -lc "cd /workspace && pnpm install && cd /workspace/apps/docs && pnpm exec mint broken-links"
