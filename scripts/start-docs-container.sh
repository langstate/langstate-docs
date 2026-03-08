#!/usr/bin/env bash
set -euo pipefail

cd /workspace
pnpm install

cd /workspace/apps/docs
pnpm dev -- --no-open &
MINT_PID=$!

# Mintlify may bind to loopback inside the container. Re-expose it on 0.0.0.0:3001.
socat TCP-LISTEN:3001,fork,reuseaddr,bind=0.0.0.0 TCP:127.0.0.1:3000 &
SOCAT_PID=$!

cleanup() {
  kill "$MINT_PID" "$SOCAT_PID" 2>/dev/null || true
}

trap cleanup EXIT INT TERM

wait -n "$MINT_PID" "$SOCAT_PID"
