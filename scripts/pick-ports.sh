#!/usr/bin/env bash
# =====================================================================
# AAOP — auto-pick safe host ports
#
# Per /opt/AAOP/PRD/dev-env.txt:
#   "Preferred host ports: Frontend 3000, Backend 8000, MySQL 3306,
#    Redis 6379. If any of these ports are already in use, automatically
#    choose safe alternatives and reflect them consistently in all
#    configs."
#
# Strategy
#   - Read the repo-root `.env` (created from `.env.example` if missing).
#   - For each port variable, keep the existing value if it is free OR
#     already bound by *our own* docker-compose stack (sticky / idempotent).
#   - Otherwise walk a deterministic candidate list until a free port is
#     found, and persist the chosen value back into `.env`.
#   - Because docker-compose interpolates `${FRONTEND_HOST_PORT}`,
#     `${BACKEND_HOST_PORT}`, `${DB_HOST_PORT}`, `${REDIS_HOST_PORT}`,
#     `${MAILPIT_SMTP_PORT}` and `${MAILPIT_UI_PORT}` (and the backend
#     env reads `APP_URL`, `FRONTEND_URL`, `SANCTUM_STATEFUL_DOMAINS`
#     from the same compose env block), updating `.env` propagates the
#     new values into every container automatically. The Next.js app
#     uses same-origin `/api` + `/sanctum` rewrites to Laravel
#     (`INTERNAL_API_URL`); only `NEXT_PUBLIC_APP_URL` tracks the picked
#     frontend port for the SPA shell.
#
# Usage
#   scripts/pick-ports.sh           # write/refresh .env with safe ports
#   scripts/pick-ports.sh --print   # just print what would be chosen
#   scripts/pick-ports.sh --json    # machine-readable output (for CI)
# =====================================================================

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env"
ENV_EXAMPLE="${ROOT_DIR}/.env.example"

PRINT_ONLY=0
EMIT_JSON=0
for arg in "$@"; do
  case "$arg" in
    --print) PRINT_ONLY=1 ;;
    --json)  PRINT_ONLY=1; EMIT_JSON=1 ;;
    -h|--help)
      sed -n '1,40p' "$0" | sed 's/^# \{0,1\}//'
      exit 0 ;;
    *)
      echo "unknown flag: $arg" >&2
      exit 64 ;;
  esac
done

# ---------------------------------------------------------------------
# Service definitions: NAME : VAR : PREFERRED : EXTRA_CANDIDATES
# Each "EXTRA_CANDIDATES" line is a comma-separated list of ports we
# will walk *in order* if the preferred one is busy. We keep the
# alternates near the original so they stay easy to remember.
# ---------------------------------------------------------------------
SERVICES=(
  "Frontend|FRONTEND_HOST_PORT|3000|3001,3002,3003,3010,3030,3080,13000,13001,13002,13003"
  "Backend |BACKEND_HOST_PORT |8000|8001,8002,8003,8080,8088,18000,18001,18002,18003"
  "MySQL   |DB_HOST_PORT      |3306|3307,3316,3326,13306,13307,13308,33060,33061"
  "Redis   |REDIS_HOST_PORT   |6379|6380,6381,16379,16380,16381,26379"
  "MailpitSMTP|MAILPIT_SMTP_PORT|1025|1026,1027,11025,11026,11027,21025"
  "MailpitUI |MAILPIT_UI_PORT  |8025|8026,8027,18025,18026,18027,28025"
)

# ---------------------------------------------------------------------
# Detect a working "is port free?" backend.
# ---------------------------------------------------------------------
have() { command -v "$1" >/dev/null 2>&1; }

if have ss; then
  PORT_BACKEND=ss
elif have netstat; then
  PORT_BACKEND=netstat
elif have lsof; then
  PORT_BACKEND=lsof
elif have python3; then
  PORT_BACKEND=python3
else
  echo "pick-ports: need one of ss / netstat / lsof / python3 to inspect ports" >&2
  exit 70
fi

is_port_free() {
  local p="$1"
  case "$PORT_BACKEND" in
    ss)
      ! ss -ltn 2>/dev/null | awk '{print $4}' | grep -E "[:.]${p}$" >/dev/null
      ;;
    netstat)
      ! netstat -ltn 2>/dev/null | awk '{print $4}' | grep -E "[:.]${p}$" >/dev/null
      ;;
    lsof)
      ! lsof -nP -iTCP:"$p" -sTCP:LISTEN >/dev/null 2>&1
      ;;
    python3)
      python3 - "$p" <<'PY' >/dev/null 2>&1
import socket, sys
p = int(sys.argv[1])
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
try:
    s.bind(("0.0.0.0", p))
finally:
    s.close()
PY
      ;;
  esac
}

# ---------------------------------------------------------------------
# Heuristic: is this port already published by *our* docker stack?
# If yes, treat it as effectively "free" so we keep the assignment.
# ---------------------------------------------------------------------
docker_owns_port() {
  local p="$1"
  have docker || return 1
  # `docker compose ps --format json` is the most portable shape.
  ( cd "$ROOT_DIR" && docker compose ps --format '{{.Publishers}}' 2>/dev/null \
      | grep -E ":${p}->" >/dev/null )
}

# ---------------------------------------------------------------------
# Boot the .env file if needed, then read existing values.
# ---------------------------------------------------------------------
if [[ ! -f "$ENV_FILE" ]]; then
  if [[ -f "$ENV_EXAMPLE" ]]; then
    cp "$ENV_EXAMPLE" "$ENV_FILE"
  else
    : > "$ENV_FILE"
  fi
fi

read_env_var() {
  local var="$1"
  awk -F= -v k="$var" '$1==k { sub(/^[^=]*=/,""); print; exit }' "$ENV_FILE" | tr -d '\r'
}

write_env_var() {
  local var="$1" val="$2"
  if grep -qE "^${var}=" "$ENV_FILE"; then
    # In-place update with a portable sed (BSD + GNU).
    tmp=$(mktemp)
    awk -F= -v k="$var" -v v="$val" 'BEGIN{OFS="="} $1==k {print k, v; next} {print}' "$ENV_FILE" > "$tmp"
    mv "$tmp" "$ENV_FILE"
  else
    printf '%s=%s\n' "$var" "$val" >> "$ENV_FILE"
  fi
}

# ---------------------------------------------------------------------
# Pick a port for one service.
# Logic:
#   1. If the .env already has a value AND that port is free or
#      docker-owned -> keep it (sticky).
#   2. Else try the PREFERRED port -> if free, take it.
#   3. Else walk EXTRA_CANDIDATES -> first free wins.
#   4. Else give up with a clear error.
# ---------------------------------------------------------------------
choose_port() {
  local var="$1" preferred="$2" extras="$3"
  local current
  current="$(read_env_var "$var" || true)"

  if [[ -n "$current" ]]; then
    if is_port_free "$current" || docker_owns_port "$current"; then
      echo "$current"
      return
    fi
  fi

  if is_port_free "$preferred" || docker_owns_port "$preferred"; then
    echo "$preferred"
    return
  fi

  IFS=',' read -ra alts <<< "$extras"
  for p in "${alts[@]}"; do
    if is_port_free "$p"; then
      echo "$p"
      return
    fi
  done

  echo "pick-ports: exhausted candidates for $var (preferred=$preferred)" >&2
  return 1
}

# ---------------------------------------------------------------------
# Run the selection.
# ---------------------------------------------------------------------
declare -A CHOSEN
declare -A PREVIOUS
declare -A PREFERRED

for row in "${SERVICES[@]}"; do
  IFS='|' read -r name var preferred extras <<< "$row"
  name_trim="${name// /}"
  var_trim="${var// /}"
  preferred_trim="${preferred// /}"
  extras_trim="${extras// /}"

  PREFERRED[$var_trim]="$preferred_trim"
  PREVIOUS[$var_trim]="$(read_env_var "$var_trim" || true)"

  CHOSEN[$var_trim]="$(choose_port "$var_trim" "$preferred_trim" "$extras_trim")"
done

# ---------------------------------------------------------------------
# Persist (unless --print).
# ---------------------------------------------------------------------
if (( PRINT_ONLY == 0 )); then
  for var in "${!CHOSEN[@]}"; do
    write_env_var "$var" "${CHOSEN[$var]}"
  done
fi

# ---------------------------------------------------------------------
# Output
# ---------------------------------------------------------------------
if (( EMIT_JSON == 1 )); then
  printf '{\n'
  first=1
  for var in FRONTEND_HOST_PORT BACKEND_HOST_PORT DB_HOST_PORT REDIS_HOST_PORT MAILPIT_SMTP_PORT MAILPIT_UI_PORT; do
    if (( first )); then first=0; else printf ',\n'; fi
    printf '  "%s": %s' "$var" "${CHOSEN[$var]}"
  done
  printf '\n}\n'
  exit 0
fi

frontend_port="${CHOSEN[FRONTEND_HOST_PORT]}"
backend_port="${CHOSEN[BACKEND_HOST_PORT]}"
mysql_port="${CHOSEN[DB_HOST_PORT]}"
redis_port="${CHOSEN[REDIS_HOST_PORT]}"
mailpit_smtp="${CHOSEN[MAILPIT_SMTP_PORT]}"
mailpit_ui="${CHOSEN[MAILPIT_UI_PORT]}"

bold=$(tput bold 2>/dev/null || true)
dim=$(tput dim 2>/dev/null || true)
reset=$(tput sgr0 2>/dev/null || true)
green=$(tput setaf 2 2>/dev/null || true)
yellow=$(tput setaf 3 2>/dev/null || true)

label_for() {
  case "$1" in
    FRONTEND_HOST_PORT) echo "Frontend " ;;
    BACKEND_HOST_PORT)  echo "Backend  " ;;
    DB_HOST_PORT)       echo "MySQL    " ;;
    REDIS_HOST_PORT)    echo "Redis    " ;;
    MAILPIT_SMTP_PORT)  echo "Mailpit  " ;;
    MAILPIT_UI_PORT)    echo "Mailpit  " ;;
  esac
}

printf "%saaop · safe host port assignment%s\n" "$bold" "$reset"
printf "%s%s%s\n" "$dim" "(.env at ${ENV_FILE})" "$reset"
printf "\n"
for var in FRONTEND_HOST_PORT BACKEND_HOST_PORT DB_HOST_PORT REDIS_HOST_PORT MAILPIT_SMTP_PORT MAILPIT_UI_PORT; do
  preferred="${PREFERRED[$var]}"
  chosen="${CHOSEN[$var]}"
  marker="$green✓$reset preferred"
  if [[ "$chosen" != "$preferred" ]]; then
    marker="$yellow→$reset preferred ${preferred} busy, walking… picked"
  fi
  printf "  %s  %-22s %5s   %s\n" "$(label_for "$var")" "$var" "$chosen" "$marker"
done

printf "\n%sService URLs%s\n" "$bold" "$reset"
printf "  Frontend     http://127.0.0.1:%s\n" "$frontend_port"
printf "  Backend API  http://127.0.0.1:%s/api/health\n" "$backend_port"
printf "  Mailpit UI   http://127.0.0.1:%s\n" "$mailpit_ui"
printf "  MySQL        127.0.0.1:%s\n" "$mysql_port"
printf "  Redis        127.0.0.1:%s\n" "$redis_port"
printf "  Mailpit SMTP 127.0.0.1:%s\n" "$mailpit_smtp"
printf "\nSanctum stateful domains will resolve to %s127.0.0.1:%s,localhost:%s%s\n" \
  "$dim" "$frontend_port" "$frontend_port" "$reset"
