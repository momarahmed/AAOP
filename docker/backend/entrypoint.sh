#!/usr/bin/env bash
# =====================================================================
# AAOP backend container entrypoint
#   - First boot   : composer install (deps already in repo) and bootstrap .env
#   - Hot reload   : artisan dev server reads source from the host volume
#   - Migrations   : run automatically on first boot (idempotent)
#
# Why the .env is rewritten on every boot:
#   `php artisan serve` (the PHP built-in web server) spawns short-lived
#   worker processes per request, and on this PHP version those workers
#   do NOT inherit the parent's environment. As a result, only values
#   present in the on-disk `.env` are visible to Laravel during request
#   handling. We therefore re-stamp the env-driven keys (URLs, ports,
#   stateful domains, infra hosts) into `.env` from the container's env
#   on every boot. This keeps the SPA-auth (Sanctum) consistent with
#   the host ports `pick-ports.sh` chose.
# =====================================================================
set -euo pipefail

cd /var/www/html

mkdir -p \
  storage/app \
  storage/framework/cache/data \
  storage/framework/sessions \
  storage/framework/testing \
  storage/framework/views \
  storage/logs \
  bootstrap/cache

if [ ! -f .env ] && [ -f .env.example ]; then
  echo "[entrypoint] No .env found — copying .env.example -> .env"
  cp .env.example .env
fi

# ---------------------------------------------------------------------
# Sync `.env` with the container's runtime env so SPA auth (Sanctum
# stateful domains, CORS, session cookie scope) tracks the host ports
# chosen by `scripts/pick-ports.sh`.
# ---------------------------------------------------------------------
sync_env_key() {
  local key="$1"
  local val="${2-}"
  if [ -z "$val" ]; then
    return 0
  fi
  if grep -qE "^${key}=" .env; then
    # Use a delimiter unlikely to appear in URLs to keep sed happy
    sed -i "s|^${key}=.*|${key}=${val}|" .env
  else
    printf '\n%s=%s\n' "$key" "$val" >> .env
  fi
}

if [ -f .env ]; then
  sync_env_key APP_URL                  "${APP_URL-}"
  sync_env_key FRONTEND_URL             "${FRONTEND_URL-}"
  sync_env_key SANCTUM_STATEFUL_DOMAINS "${SANCTUM_STATEFUL_DOMAINS-}"
  # Always sync SESSION_DOMAIN (may be empty). Host-only cookies need SESSION_DOMAIN=
  # cleared when compose omits the variable — sync_env_key skips blanks.
  _SESSION_DOMAIN="${SESSION_DOMAIN-}"
  if grep -qE "^SESSION_DOMAIN=" .env; then
    sed -i "s|^SESSION_DOMAIN=.*|SESSION_DOMAIN=${_SESSION_DOMAIN}|" .env
  else
    printf '\nSESSION_DOMAIN=%s\n' "${_SESSION_DOMAIN}" >> .env
  fi
  sync_env_key DB_HOST                  "${DB_HOST-}"
  sync_env_key DB_PORT                  "${DB_PORT-}"
  sync_env_key DB_DATABASE              "${DB_DATABASE-}"
  sync_env_key DB_USERNAME              "${DB_USERNAME-}"
  sync_env_key DB_PASSWORD              "${DB_PASSWORD-}"
  sync_env_key REDIS_HOST               "${REDIS_HOST-}"
  sync_env_key REDIS_PORT               "${REDIS_PORT-}"
  sync_env_key MAIL_HOST                "${MAIL_HOST-}"
  sync_env_key MAIL_PORT                "${MAIL_PORT-}"
fi

if [ -f composer.json ] && [ ! -d vendor ]; then
  echo "[entrypoint] Installing composer dependencies..."
  composer install --no-interaction --prefer-dist --no-progress
fi

if [ -f artisan ] && grep -q "^APP_KEY=$" .env 2>/dev/null; then
  echo "[entrypoint] Generating APP_KEY..."
  php artisan key:generate --force || true
fi

# Bust any stale config cache so updated .env values take effect
if [ -f artisan ]; then
  php artisan config:clear 2>/dev/null || true
  php artisan route:clear  2>/dev/null || true
fi

if [ -f artisan ]; then
  echo "[entrypoint] Waiting for MySQL on ${DB_HOST:-mysql}:${DB_PORT:-3306}..."
  for i in $(seq 1 60); do
    if mysqladmin ping -h "${DB_HOST:-mysql}" -P "${DB_PORT:-3306}" -u "${DB_USERNAME:-aaop}" -p"${DB_PASSWORD:-aaopsecret}" --silent 2>/dev/null; then
      echo "[entrypoint] MySQL is up."
      break
    fi
    sleep 1
  done

  echo "[entrypoint] Running migrations + seed..."
  php artisan migrate --force --seed || echo "[entrypoint] migrate exited non-zero (may be safe on first run)"
fi

echo "[entrypoint] Starting: $*"
exec "$@"
