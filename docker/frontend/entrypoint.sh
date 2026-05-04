#!/usr/bin/env bash
# =====================================================================
# AAOP frontend container entrypoint
#
#   - Runs initially as root so it can repair permissions on Docker
#     named volumes (`/app/node_modules`, `/app/.next`) which are
#     created root:root on first use, before they ever see the bind
#     mount's ownership.
#   - Installs deps if package.json exists but node_modules is empty.
#   - Drops privileges to the `dev` user (UID/GID matched at build time
#     to the host) via `su-exec`, then exec's the dev server.
# =====================================================================
set -euo pipefail

cd /app

UID_TARGET="${AAOP_RUN_AS_UID:-1000}"
GID_TARGET="${AAOP_RUN_AS_GID:-1000}"

# When started as root, repair perms on volumes & home before dropping.
if [ "$(id -u)" = "0" ]; then
  mkdir -p /app/node_modules /app/.next /home/dev/.npm
  chown "${UID_TARGET}:${GID_TARGET}" /app /app/node_modules /app/.next /home/dev/.npm 2>/dev/null || true
  # Recursive chown only for paths that are not the bind mount itself
  # (the bind mount's perms must come from the host).
  chown -R "${UID_TARGET}:${GID_TARGET}" /app/node_modules /app/.next /home/dev/.npm 2>/dev/null || true

  exec su-exec "${UID_TARGET}:${GID_TARGET}" /usr/local/bin/aaop-frontend-entrypoint "$@"
fi

# ---- below runs as the dev user ----
if [ -f package.json ]; then
  if [ ! -d node_modules ] || [ -z "$(ls -A node_modules 2>/dev/null || true)" ]; then
    echo "[entrypoint] Installing npm dependencies (first boot)..."
    npm install --no-audit --no-fund --loglevel=error
  fi
else
  echo "[entrypoint] package.json missing in /app — please mount the frontend source." >&2
  exit 1
fi

echo "[entrypoint] Starting: $*"
exec "$@"
