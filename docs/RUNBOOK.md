# AAOP — Local Runbook

Quick recipes for common dev situations. Pair with [`README.md`](../README.md) and [`docs/ARCHITECTURE.md`](ARCHITECTURE.md).

## "I have other services on 3000 / 8000 / 6379"

Per `dev-env.txt §41-47`, AAOP ships an automatic port picker. Every call to `make up` runs `scripts/pick-ports.sh` first, which:

1. Probes the preferred host port (3000 / 8000 / 3306 / 6379 / 1025 / 8025).
2. If busy, walks a deterministic short list (3001-3099, 8001-8099, 13306+, 16379+, 11025+, 18025+).
3. Persists the chosen value into the repo-root `.env` — the **single** source of truth that `docker-compose.yml` interpolates for port mappings, `APP_URL`, `FRONTEND_URL`, `SANCTUM_STATEFUL_DOMAINS`, and `NEXT_PUBLIC_APP_URL` (the browser uses same-origin `/api` + `/sanctum` rewrites; see `frontend/next.config.mjs`).

Run any of these by hand:

```bash
make ports         # pick + write .env (idempotent — keeps existing assignments)
make ports-print   # preview without modifying .env
make open          # show the URLs the stack is currently bound to
./scripts/pick-ports.sh --json   # machine-readable for CI
```

Because the script preserves existing `.env` values whenever those ports are still free (or owned by our own running containers), repeated runs are stable. If you free up the preferred ports later, run `make ports` once and the script will move you back to them.

If you bypass `make` and call `docker compose up` directly, run `make ports` first or you'll inherit whatever is in `.env`.

## "Sign-in fails with 419 / CSRF token mismatch"

**Most common cause:** the SPA called Laravel on a **different origin** (e.g. page on `http://127.0.0.1:3001` but Axios `baseURL` was `http://127.0.0.1:8002`). The `XSRF-TOKEN` cookie is then stored for the API host and is **not** visible in `document.cookie` on the page, so Axios never sends `X-XSRF-TOKEN` → Laravel returns 419.

**Fix (default in this repo):** the Axios client **always** uses a same-origin base URL in the browser (empty `baseURL` → `/api/*` and `/sanctum/*` on the Next app). Next.js rewrites (`frontend/next.config.mjs`) proxy those to Laravel via `INTERNAL_API_URL` (e.g. `http://backend:8000` in Docker). `NEXT_PUBLIC_API_URL` is **ignored in the browser** unless you set `NEXT_PUBLIC_API_DIRECT=true` (advanced / non–cookie flows).

If DevTools still shows `POST http://127.0.0.1:8002/api/...`, you have a **stale client bundle** (old `NEXT_PUBLIC_*` baked into `.next`) or a `frontend/.env.local` forcing a direct API URL. Clear the local Next cache and restart:

```bash
docker compose down
rm -rf frontend/.next
make up
```

Remove any `NEXT_PUBLIC_API_URL=http://127.0.0.1:…` from `frontend/.env.local` unless you also intend `NEXT_PUBLIC_API_DIRECT=true` and a non-cookie auth strategy.

The Sanctum SPA flow also expects:

1. Frontend on a stateful domain — `SANCTUM_STATEFUL_DOMAINS` is auto-stamped at backend boot to match the host port `pick-ports.sh` chose for the frontend (e.g. `127.0.0.1:3001,localhost:3001`).
2. Browser to fetch `/sanctum/csrf-cookie` first. The Axios client in `frontend/src/lib/api/client.ts` does this automatically.
3. Cookies to be sent — `withCredentials: true` is set globally.

If you see CSRF errors, run `make open` to confirm the URLs Sanctum considers stateful, then verify the round-trip:

```bash
# Use the actual ports from `make open`; show the cookie & token
curl -i -c /tmp/cookies.txt "$(make open | awk '/Backend API/{print $3}')/sanctum/csrf-cookie" \
     -H "Origin: $(make open | awk '/Frontend/{print $3}')"
```

Keep `SESSION_DOMAIN` **empty** in Docker (host-only cookies): then `localhost` and `127.0.0.1` each get their own cookie jar and sessions stay consistent. Setting `SESSION_DOMAIN=127.0.0.1` while browsing `http://localhost:…` drops session cookies and surfaces **419 CSRF token mismatch**.

## "I changed ports but Sanctum still rejects /api/v1/auth/login"

The backend container's `php artisan serve` workers do **not** inherit env vars from the parent process; only what's on disk in `backend/.env` is visible to Laravel during request handling. The backend entrypoint (`docker/backend/entrypoint.sh`) re-stamps the dynamic keys (`APP_URL`, `FRONTEND_URL`, `SANCTUM_STATEFUL_DOMAINS`, `SESSION_DOMAIN`, `DB_*`, `REDIS_*`, `MAIL_*`) into `.env` from the container's env on every boot.

If you changed ports without restarting the backend, just:

```bash
docker compose up -d backend queue   # picks up new .env stamping
```

If you ever need to inspect what Sanctum thinks the stateful domains are:

```bash
docker exec aaop-backend php artisan tinker --execute='print_r(config("sanctum.stateful"));'
```

## "Frontend isn't picking up my edits"

Polling is enabled but Docker on macOS occasionally still misses events on big refactors:

```bash
make restart-frontend
```

If that doesn't help, blow away the local `.next` folder (bind-mounted from the repo; no Docker volume) and restart:

```bash
docker compose down
rm -rf frontend/.next
make up
```

## "Backend says: SQLSTATE[HY000] [2002] Connection refused"

MySQL 8.4 takes ~10s to be ready on first boot. The backend entrypoint already waits for the healthcheck, but if you `make restart-backend` immediately after `make up` it can race. Re-run the command — Docker brings backend back automatically on healthy MySQL.

## "I want a fresh database"

```bash
make fresh    # drops + re-migrates + reseeds inside the running container
```

If migrations themselves are broken:

```bash
make stack-clean   # destroys mysql_data volume too
make up
```

## "How do I run a single Pest test?"

```bash
$(DC) exec backend php artisan test --filter=AuthTest
# or
make sh-backend
php artisan test --filter=AuthTest
```

## "How do I add a new API endpoint?"

1. Add the model + migration under `backend/app/Models` and `backend/database/migrations`.
2. Add the controller in `backend/app/Http/Controllers/Api/<Name>Controller.php`.
3. Wire it up in `backend/routes/api.php` inside the `workspace.context` group.
4. If it mutates state, add `->middleware('idempotent')`.
5. Always call `AuditLogger::record(...)` for privileged actions.
6. Add a Pest test under `backend/tests/Feature/`.

## "How do I add a new page in the frontend?"

1. Create `frontend/src/app/<segment>/page.tsx`.
2. Wrap it in `<AppShell breadcrumb={…} title={…}>` from `@/components/shared/AppShell` if it lives behind auth.
3. Use `api.*` from `@/lib/api/client` for backend calls; surface errors via `unwrapError`.
4. Re-use Fusion MCP primitives — `<FusionCard>`, `<StatusPill>`, the `Charts.tsx` set, and the `Icons.tsx` icon set — instead of pulling in third-party libraries.

## "How do I rotate the audit hash secret?"

The chain is keyed by `config('app.aaop.audit_hash_secret')` (env var `AAOP_AUDIT_HASH_SECRET`). Rotation requires:

1. Export every workspace's audit log with the **current** secret.
2. Set the new secret.
3. The next `AuditLogger::record(...)` will start a new chain. Older records remain verifiable with the **previous** key (kept in your secrets manager).

Treat rotations as audit events themselves: log them through the audit pipeline before flipping the env var.
