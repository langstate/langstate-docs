#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "$0")/dev-ports.sh"

if ! can_use_docker_for_dev; then
  docs_port="${DOCS_PORT:-3000}"
  pnpm --filter @langstate/docs dev 2>&1 | awk -v docs_port="$docs_port" '
    {
      print
      if ($0 ~ /preview ready/ && !printed) {
        print ""
        print "DOCS HOST URL: http://localhost:" docs_port
        print "If you are inside a VS Code devcontainer and the forwarded host port differs, use the Ports panel for the final host-local URL."
        printed=1
        fflush()
      }
    }
  '
  exit ${PIPESTATUS[0]}
fi

load_or_assign_dev_ports
print_dev_ports_summary
printf 'Starting docs container. Mintlify will still report its internal container port as http://localhost:3000.\n'

env DOCS_PORT="$DOCS_PORT" docker compose up --build -d docs

docker compose logs -f docs 2>&1 | awk -v docs_port="$DOCS_PORT" '
  {
    print
    if ($0 ~ /preview ready/ && !printed) {
      print ""
      print "DOCS HOST URL: http://localhost:" docs_port
      print "Mint internal URL remains http://localhost:3000 inside the container."
      printed=1
      fflush()
    }
  }
'
