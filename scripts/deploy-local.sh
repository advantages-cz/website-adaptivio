#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DESTINATION="${1:-}"

if [[ -z "$DESTINATION" ]]; then
  echo "Usage: scripts/deploy-local.sh /absolute/or/relative/target-directory"
  exit 1
fi

"$ROOT_DIR/scripts/build.sh"

mkdir -p "$DESTINATION"
rsync -a --delete "$ROOT_DIR/_site/" "$DESTINATION/"

echo "Deployed _site to: $DESTINATION"
