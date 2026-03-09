#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "$0")/dev-ports.sh"

if can_use_docker_for_dev; then
  load_or_assign_dev_ports
  print_dev_ports_summary
  printf 'Homepage will link to docs at %s.\n' "$NEXT_PUBLIC_DOCS_URL"
  export NEXT_PUBLIC_DOCS_URL
  exec pnpm --filter @langstate/homepage exec next dev --webpack --hostname 0.0.0.0 --port "$HOMEPAGE_PORT"
fi

export NEXT_PUBLIC_DOCS_URL="${NEXT_PUBLIC_DOCS_URL:-http://localhost:3000}"
exec pnpm --filter @langstate/homepage exec next dev --webpack --hostname 0.0.0.0 --port "${HOMEPAGE_PORT:-3001}"
