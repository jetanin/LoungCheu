#!/usr/bin/env bash
# Team scccd8b05: build, migrate and update resources prepared by the portal.
set -euo pipefail
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
case "${DRY_RUN:-1}" in
  1) args=() ;;
  0) args=(--execute --confirm-project cpe-se-course-2026) ;;
  *) echo 'DRY_RUN must be 0 or 1' >&2; exit 1 ;;
esac
if command -v python3 >/dev/null 2>&1; then PYTHON=python3; else PYTHON=python; fi
exec "$PYTHON" "$ROOT/deploy/first_deploy.py" "${args[@]}" "$@"
