#!/usr/bin/env bash
set -euo pipefail

repository_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
docs_config="$repository_root/apps/docs/docs.json"
source_repository="$(node -e 'const c=require(process.argv[1]); process.stdout.write(c.variables.repository)' "$docs_config")"
source_commit="$(node -e 'const c=require(process.argv[1]); process.stdout.write(c.variables.commit)' "$docs_config")"
temporary_root="$(mktemp -d)"
source_checkout="$temporary_root/langstate"

cleanup() {
  rm -rf "$temporary_root"
}
trap cleanup EXIT

git clone --filter=blob:none --no-checkout "$source_repository.git" "$source_checkout"
git -C "$source_checkout" fetch --depth 1 origin "$source_commit"
git -C "$source_checkout" checkout --detach "$source_commit"

cd "$source_checkout/packages/langstate"
poetry install --no-root --with dev
poetry run python -m pytest -q
PYTHONPATH="$source_checkout/packages/langstate" \
  poetry run python "$repository_root/scripts/pinned-source-smoke.py"
