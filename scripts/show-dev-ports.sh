#!/usr/bin/env bash
set -euo pipefail

ports_file="$(dirname "$0")/../.dev/dev-ports.env"

if [ ! -f "$ports_file" ]; then
  printf 'No saved dev ports yet. Start docs or homepage once first.\n'
  exit 1
fi

# shellcheck disable=SC1090
. "$ports_file"

printf 'Saved host URLs:\n'
printf '  Homepage: http://localhost:%s\n' "$HOMEPAGE_PORT"
printf '  Docs:     http://localhost:%s\n' "$DOCS_PORT"
printf '  Homepage docs URL: %s\n' "$NEXT_PUBLIC_DOCS_URL"

if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  printf '\nDocker published ports:\n'
  docker compose ps
fi
