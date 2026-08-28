#!/usr/bin/env bash
set -euo pipefail

rm -f "$(dirname "$0")/../.dev/dev-ports.env"
printf 'Cleared saved dev ports. The next dev launch will pick a new free pair.\n'
