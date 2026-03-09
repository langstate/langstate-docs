#!/usr/bin/env bash

dev_ports_root() {
  cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd
}

dev_ports_file() {
  printf '%s/.dev/dev-ports.env\n' "$(dev_ports_root)"
}

can_use_docker_for_dev() {
  command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1
}

port_is_in_use() {
  lsof -nP -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1
}

find_free_port() {
  local candidate="$1"
  shift || true

  while true; do
    local skip_port=false
    local other_port

    for other_port in "$@"; do
      if [ "$candidate" = "$other_port" ]; then
        skip_port=true
        break
      fi
    done

    if [ "$skip_port" = false ] && ! port_is_in_use "$candidate"; then
      printf '%s\n' "$candidate"
      return 0
    fi

    candidate=$((candidate + 1))
  done
}

write_dev_ports_file() {
  local ports_file root_dir
  ports_file="$(dev_ports_file)"
  root_dir="$(dev_ports_root)"

  mkdir -p "$root_dir/.dev"
  cat >"$ports_file" <<EOF
HOMEPAGE_PORT=$HOMEPAGE_PORT
DOCS_PORT=$DOCS_PORT
NEXT_PUBLIC_DOCS_URL=$NEXT_PUBLIC_DOCS_URL
EOF
}

load_or_assign_dev_ports() {
  local ports_file preferred_homepage preferred_docs requested_homepage requested_docs requested_docs_url
  ports_file="$(dev_ports_file)"
  requested_homepage="${HOMEPAGE_PORT:-}"
  requested_docs="${DOCS_PORT:-}"
  requested_docs_url="${NEXT_PUBLIC_DOCS_URL:-}"

  if [ -f "$ports_file" ]; then
    # shellcheck disable=SC1090
    . "$ports_file"
  fi

  if [ -n "$requested_homepage" ]; then
    HOMEPAGE_PORT="$requested_homepage"
  fi

  if [ -n "$requested_docs" ]; then
    DOCS_PORT="$requested_docs"
  fi

  if [ -n "$requested_docs_url" ]; then
    NEXT_PUBLIC_DOCS_URL="$requested_docs_url"
  elif [ -n "${DOCS_PORT:-}" ]; then
    NEXT_PUBLIC_DOCS_URL="http://localhost:$DOCS_PORT"
  fi

  if [ -n "${HOMEPAGE_PORT:-}" ] && [ -n "${DOCS_PORT:-}" ] && [ -n "${NEXT_PUBLIC_DOCS_URL:-}" ]; then
    export HOMEPAGE_PORT DOCS_PORT NEXT_PUBLIC_DOCS_URL
    write_dev_ports_file
    return 0
  fi

  preferred_homepage="${HOMEPAGE_PORT:-3000}"
  preferred_docs="${DOCS_PORT:-3001}"

  HOMEPAGE_PORT="$(find_free_port "$preferred_homepage")"
  DOCS_PORT="$(find_free_port "$preferred_docs" "$HOMEPAGE_PORT")"
  NEXT_PUBLIC_DOCS_URL="${NEXT_PUBLIC_DOCS_URL:-http://localhost:$DOCS_PORT}"

  export HOMEPAGE_PORT DOCS_PORT NEXT_PUBLIC_DOCS_URL
  write_dev_ports_file
}

print_dev_ports_summary() {
  printf 'Using host ports: homepage=%s docs=%s\n' "$HOMEPAGE_PORT" "$DOCS_PORT"
  printf 'Homepage URL: http://localhost:%s\n' "$HOMEPAGE_PORT"
  printf 'Docs URL:     http://localhost:%s\n' "$DOCS_PORT"
}
