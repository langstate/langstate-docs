#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "$0")/dev-ports.sh"

if ! can_use_docker_for_dev; then
  exec pnpm --filter @langstate/docs dev
fi

load_or_assign_dev_ports
print_dev_ports_summary
exec env DOCS_PORT="$DOCS_PORT" pnpm docker:up:docs
