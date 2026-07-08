#!/usr/bin/env bash
#
# Reseed a deployed backend's database with the demo dataset.
#
# Usage:
#   scripts/reseed-prod.sh <backend-base-url>
#
# Example:
#   scripts/reseed-prod.sh https://your-backend.onrender.com
#
# No URL, password, or connection string is hardcoded — the target backend is
# passed in as an argument, and the backend reaches its own database via the
# DATABASE_URL configured in its environment (never here).

set -euo pipefail

if [ "$#" -lt 1 ] || [ -z "${1:-}" ]; then
  echo "Usage: $0 <backend-base-url>" >&2
  echo "Example: $0 https://your-backend.onrender.com" >&2
  exit 1
fi

BASE_URL="$1"

# Resolve the backend directory relative to this script so it can be run from
# anywhere (seed_demo.py lives in backend/).
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/../backend"

PY="$(command -v python3 || command -v python)"

exec "$PY" seed_demo.py --reset --base-url "$BASE_URL"
