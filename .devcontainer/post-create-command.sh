#!/usr/bin/env bash
set -euo pipefail

cd /workspace
pnpm install

printf '\nDev container is ready.\n'
printf 'Run docs with:      pnpm dev:docs  # expected on port 3000\n'
printf 'Run homepage with:  pnpm dev:homepage  # expected on port 3001\n'
