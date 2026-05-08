#!/usr/bin/env bash
set -euo pipefail
matches=$(rg -n -i "\\bmock\\b|\\bdemo\\b|\\bfake\\b|placeholder data|sample data" client/src server --glob '!**/*.d.ts' --glob '!**/node_modules/**' || true)
filtered=$(printf "%s\n" "$matches" | rg -v "no-mock-guard:ignore" || true)
if [[ -n "${filtered// }" ]]; then
  printf "%s\n" "$filtered"
  echo "No-mock guard failed: found blocked placeholder terms." >&2
  exit 1
fi
echo "No-mock guard passed."
