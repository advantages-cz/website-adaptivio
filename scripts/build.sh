#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

export RBENV_VERSION="${RBENV_VERSION:-3.3.7}"

if command -v rbenv >/dev/null 2>&1; then
  if rbenv exec bundle check >/dev/null 2>&1; then
    rbenv exec bundle exec jekyll build "$@"
  else
    rbenv exec jekyll build "$@"
  fi
elif command -v bundle >/dev/null 2>&1 && bundle check >/dev/null 2>&1; then
  bundle exec jekyll build "$@"
else
  jekyll build "$@"
fi
