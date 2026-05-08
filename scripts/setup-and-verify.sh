#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

info() { echo "[INFO] $*"; }
warn() { echo "[WARN] $*"; }
err() { echo "[ERROR] $*"; }

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || { err "Missing required command: $1"; exit 1; }
}

require_cmd npm
require_cmd node

info "Repository root: $ROOT_DIR"

if [[ ! -f .env ]]; then
  if [[ -f .env.example ]]; then
    warn ".env not found. Creating from .env.example"
    cp .env.example .env
    warn "Please edit .env with real secrets before production use."
  else
    err "Neither .env nor .env.example exists."
    exit 1
  fi
fi

required_env=(
  NODE_ENV
  PORT
  SESSION_SECRET
  DATABASE_URL
)

missing=0
for key in "${required_env[@]}"; do
  if ! grep -E "^${key}=" .env >/dev/null 2>&1; then
    err "Missing $key in .env"
    missing=1
  fi
done

if [[ $missing -ne 0 ]]; then
  err "Please fix missing environment variables in .env and re-run."
  exit 1
fi

info "Installing dependencies"
npm ci

info "Running type checks"
npm run check

info "Running production build"
npm run build

if [[ "${RUN_DEV_SMOKE:-1}" == "1" ]]; then
  info "Running dev smoke check (20s timeout)"
  timeout 20s npm run dev >/tmp/aibay-dev-smoke.log 2>&1 || true
  if rg -n "(ready|listening|Local:)" /tmp/aibay-dev-smoke.log >/dev/null 2>&1; then
    info "Dev smoke check passed"
  else
    warn "Dev smoke check did not show a ready marker. Inspect /tmp/aibay-dev-smoke.log"
  fi
fi

if [[ -n "${HEALTH_URL:-}" ]]; then
  require_cmd curl
  info "Checking health endpoint: $HEALTH_URL"
  http_code="$(curl -s -o /tmp/aibay-health.json -w "%{http_code}" "$HEALTH_URL" || true)"
  if [[ "$http_code" == "200" ]]; then
    info "Health endpoint returned 200"
  else
    warn "Health endpoint returned HTTP $http_code"
    warn "Response saved at /tmp/aibay-health.json"
  fi
else
  warn "HEALTH_URL not set; skipping deployed health check."
fi

info "Setup and verification complete."
