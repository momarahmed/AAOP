# AAOP — AI Agent Orchestration Platform

> **Trusted autonomous work platform** — design, govern, and continuously improve resilient AI-driven workflows across every digital surface.

This repository is the reference implementation of AAOP v1, scaffolded against the production PRD ([`PRD/AAOP_PRD_v6_Enhanced_Production.md`](PRD/AAOP_PRD_v6_Enhanced_Production.md)) and the phased delivery plan ([`Implementation plan/AAOP_Implementation_Plan_v1.md`](Implementation%20plan/AAOP_Implementation_Plan_v1.md)).

## Stack

| Layer        | Technology                                                                            |
| ------------ | ------------------------------------------------------------------------------------- |
| Frontend     | Next.js 15 (App Router) · MUI v6 · Emotion · TypeScript · Axios · Zod                 |
| Backend API  | Laravel 12 · PHP 8.3 · Sanctum (cookie-based SPA auth) · OpenAPI 3.1                  |
| Database     | MySQL 8.4 (UUID-keyed AAOP schema)                                                    |
| Cache/Queue  | Redis 7 (cache, sessions, queues, idempotency, rate-limits)                           |
| Mail (dev)   | Mailpit                                                                               |
| Runtime      | Docker Compose · hot reload on both frontend and backend                              |
| Architecture | Hexagonal · event-driven runtime · policy-as-code · workspace-scoped multi-tenancy    |

The development environment is entirely Docker-based (`dev-env.txt`). All services bind to `127.0.0.1` so you can hit them directly from your browser, an HTTP client, or `mysql`/`redis-cli`.

| Service   | Preferred URL                                  | Container       | Notes                                           |
| --------- | ---------------------------------------------- | --------------- | ----------------------------------------------- |
| Frontend  | <http://127.0.0.1:3000>                        | `aaop-frontend` | Next.js dev server with polling-based watcher  |
| Backend   | <http://127.0.0.1:8000>                        | `aaop-backend`  | `php artisan serve` on `0.0.0.0:8000`          |
| MySQL     | `127.0.0.1:3306`                               | `aaop-mysql`    | DB `aaop`, user `aaop`, pass `aaopsecret`      |
| Redis     | `127.0.0.1:6379`                               | `aaop-redis`    |                                                |
| Mailpit   | SMTP `127.0.0.1:1025`, UI <http://127.0.0.1:8025> | `aaop-mailpit` | Catches all outgoing dev mail                |

> **Auto port-fallback** — per `dev-env.txt §41-47`, `make up` first runs `scripts/pick-ports.sh`, which probes each preferred host port and walks a short candidate list (`3001-3010`, `8001-8003`, `13306+`, `16379+`, …) until it finds one that's free. The chosen values are persisted into the repo-root `.env`, and compose interpolates port mappings, `APP_URL`, `FRONTEND_URL`, `SANCTUM_STATEFUL_DOMAINS`, and `NEXT_PUBLIC_APP_URL` from those variables. The browser calls Laravel only via **same-origin** Next rewrites (`/api`, `/sanctum` → `INTERNAL_API_URL`), so Sanctum CSRF cookies and `NEXT_PUBLIC_APP_URL` always stay aligned with the picked frontend port. Run `make open` for live URLs, or `make ports-print` to preview without writing.

## Bootstrap (first time, ≤ 3 minutes)

```bash
# 1. From the repo root
cp .env.example .env

# 2. (Linux/macOS) write your UID/GID so volume-mounted files keep host-friendly perms
echo "UID=$(id -u)" >> .env
echo "GID=$(id -g)" >> .env

# 3. Start the entire dev stack — port-picker runs automatically
make up           # = scripts/pick-ports.sh + docker compose up -d --build + make open
make logs         # tail the running services until they stabilize

# 4. The backend entrypoint already runs migrations + seeders on first boot.
#    `make open` prints the actual URLs (the port-picker will have noted any
#    conflicts and walked to a safe alternative).
make open
curl "$(awk -F= '/^BACKEND_HOST_PORT=/{print "http://127.0.0.1:"$2"/api/health"}' .env)"
```

You can sign in immediately with the **demo accounts** seeded by `database/seeders/DatabaseSeeder.php`:

| Email                | Password         | Role   |
| -------------------- | ---------------- | ------ |
| `admin@aaop.local`   | `ChangeMe!12345` | OWNER  |
| `omar@aaop.local`    | `ChangeMe!12345` | EDITOR |

> **Rotate these immediately** if the stack ever leaves your laptop.

A demo workspace and the **Daily Bank Reconciliation** sample workflow (PRD Appendix A) are pre-loaded for you.

## Repository layout

```
.
├── PRD/                         # PRD v6 + dev-env.txt
├── Implementation plan/         # Phased execution plan
├── UI/                          # Original Fusion MCP HTML mockups (reference only)
├── backend/                     # Laravel 12 application
│   ├── app/
│   │   ├── Http/Middleware/     # CorrelationId, Idempotency, RateLimit, WorkspaceContext, AuditLog
│   │   ├── Services/            # AuditLogger (hash-chained), WorkflowService
│   │   ├── Models/              # AAOP Eloquent models (UUID, JSON-typed)
│   │   ├── Support/Rbac/        # OWNER / ADMIN / EDITOR / RUNNER / VIEWER
│   │   └── Providers/           # Auth gates (workspace.manage, workflow.*)
│   ├── database/migrations/     # 0001_…_create_users_table → governance tables
│   ├── routes/api.php           # /api/v1 surface
│   └── tests/                   # Pest feature tests
├── frontend/                    # Next.js 15 + MUI app
│   ├── src/app/                 # /login, /dashboard, /orchestrations, /roles, …
│   ├── src/components/          # Shared shell, Icons, Charts, Login, Roles modal
│   ├── src/lib/api/             # Axios client + types
│   ├── src/lib/auth/            # AuthContext (Sanctum cookies + workspace switcher)
│   └── src/theme/               # Fusion MCP CSS variables + MUI theme
├── docker/                      # Dockerfiles + entrypoints + mysql conf
├── docs/                        # Architecture and ops notes
├── scripts/                     # Helper scripts
└── docker-compose.yml
```

## Common tasks

```bash
make up                   # picks safe ports, then `docker compose up -d --build`
make down                 # stop all services
make ps                   # list running containers
make logs                 # follow combined logs
make ports                # re-run the port picker (idempotent)
make ports-print          # preview port assignments without writing .env
make open                 # print the active service URLs (reads .env)
make restart-backend
make restart-frontend
make sh-backend           # bash inside the Laravel container
make sh-frontend          # sh inside the Next.js container

make migrate              # run Laravel migrations
make fresh                # drop + re-migrate + reseed (dev only!)
make tinker               # interactive Laravel REPL
make test                 # run Pest tests inside the backend container

make composer ARGS="require pestphp/pest"
make npm ARGS="add @tabler/icons-react"

make stack-clean          # nuke containers + named volumes (DESTRUCTIVE)
```

## Backend conventions (PRD §20)

* **Versioned API** — every endpoint lives under `/api/v1`. Breaking changes will land at `/api/v2`.
* **Auth** — cookie-based Sanctum SPA flow. The frontend pre-fetches `/sanctum/csrf-cookie` automatically; programmatic clients should issue a `Bearer` PAT (table `personal_access_tokens`).
* **Multi-tenancy** — every request that touches resources beneath `workspace.context` middleware **must** carry `X-Workspace-Id: <uuid>`. The middleware verifies workspace membership and decorates the request.
* **Idempotency** — mutating routes flagged with `idempotent` middleware honour `Idempotency-Key` (24h TTL) per PRD §20.1.
* **Correlation** — every request flows through `CorrelationIdMiddleware`. Pass `X-Correlation-ID` to thread your own trace; otherwise we mint one.
* **Rate limits** — `RateLimitHeadersMiddleware` emits `X-RateLimit-*` headers (Redis-backed counters).
* **Errors** — uniform error envelope (`PRD §20.2`) shaped as `{ error: { code, message, type, details?, correlation_id } }`.
* **Audit** — every privileged action calls `AuditLogger::record(...)`, which writes a tamper-evident hash-chained record (`hash_chain`).

## Frontend conventions

* **App Router** — every route lives at `frontend/src/app/<segment>/page.tsx`. Sign-in redirects flow through `useAuth()` (see `src/lib/auth/AuthContext.tsx`).
* **Theming** — design tokens in `frontend/src/theme/globals.css` (CSS variables) + matching MUI theme in `frontend/src/theme/theme.ts`. The two are kept in lockstep so non-MUI components (SVG charts, `<canvas>`) and MUI components share the exact same palette.
* **Workspace switching** — `TopBar` writes the active workspace ID to local storage; the Axios client picks it up and forwards `X-Workspace-Id` on every request.

## Useful URLs after `make up`

The port-picker always prints the live URLs at the end of `make up`. You can re-print them at any time:

```bash
make open
```

The defaults (when no conflicts) are:

| Use case                  | URL                                                       |
| ------------------------- | --------------------------------------------------------- |
| Application               | <http://127.0.0.1:3000>                                   |
| Backend API root          | <http://127.0.0.1:8000/api/health>                        |
| Mailpit UI                | <http://127.0.0.1:8025>                                   |
| Sanctum CSRF cookie       | <http://127.0.0.1:8000/sanctum/csrf-cookie>               |

If any of those preferred ports were busy on your host, the picker will have substituted alternatives in `.env` (e.g. `FRONTEND_HOST_PORT=3001`, `BACKEND_HOST_PORT=8002`) and the URLs above will use those values automatically — including the Sanctum stateful domain list and `NEXT_PUBLIC_APP_URL`. Axios keeps an empty public API base URL so requests stay on the Next origin (CSRF-safe); only `INTERNAL_API_URL` (Docker: `http://backend:8000`) needs to reach Laravel inside the network.

## What's next

Phase 1 (Foundations) is in place. The implementation plan calls for:

* **Phase 2** — F06 Workflow Engine (LangGraph), F07 CUA Driver (Playwright/Browser-Use), F08 AI Agent Planner.
* **Phase 3** — F09 Execution Orchestrator, F10 Self-Healing Engine, F11 MCP Gateway, F12 Observability.
* **Phase 4** — F13 Visual Designer (React Flow + xyflow), F14 Memory & UI Mapping Store.
* **Phase 5** — F15 Compliance & Audit, F16 Federated SSO + WebAuthn, FedRAMP/HIPAA modules.

See [`Implementation plan/AAOP_Implementation_Plan_v1.md`](Implementation%20plan/AAOP_Implementation_Plan_v1.md) for the full task graph (187 atomic tasks).

## License

Proprietary — internal use only. Distribution or external sharing requires written approval.
