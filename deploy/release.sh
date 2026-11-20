#!/usr/bin/env bash
# Update only this team's image; ROLLBACK=true skips build, migration and seed.
set -euo pipefail
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
: "${IMAGE_TAG:?Set IMAGE_TAG to the full reviewed commit SHA}"
case "${DRY_RUN:-1}" in
  1) args=() ;;
  0) args=(--execute --confirm-project cpe-se-course-2026) ;;
  *) echo 'DRY_RUN must be 0 or 1' >&2; exit 1 ;;
esac
if command -v python3 >/dev/null 2>&1; then PYTHON=python3; else PYTHON=python; fi
exec "$PYTHON" "$ROOT/deploy/course_cloud.py" release "${args[@]}" "$@"
