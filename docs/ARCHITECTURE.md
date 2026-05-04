# AAOP — Architecture Notes

> This document captures the implementation choices behind the Phase 1 scaffold (PRD §15, §17–§22). It is intentionally short; for the full requirements catalogue refer to `PRD/AAOP_PRD_v6_Enhanced_Production.md`.

## High-level shape

```
            ┌─────────────────────────┐
            │ Next.js 15 (App Router) │      Fusion MCP design system
            │   MUI v6 + Emotion      │      tokens in src/theme/globals.css
            └────────────┬────────────┘
              cookies +  │ X-Workspace-Id
              X-CSRF-TKN │ X-Correlation-ID
                         ▼
            ┌─────────────────────────┐
            │   Laravel 12  (API)     │  Sanctum SPA · /api/v1
            │   PHP 8.3   ·  Pest     │  hexagonal services
            └─┬──────┬─────┬──────┬───┘
              │      │     │      │
              ▼      ▼     ▼      ▼
           MySQL  Redis  Mailpit  (Future: OPA, OTel,
           8.4    7      (smtp)    LangGraph runtime,
                                    MCP gateway, CUA)
```

Containers are wired in `docker-compose.yml`. Each service binds to `127.0.0.1` on its host port for ergonomic local development.

## Backend layering

```
app/
├── Http/Controllers/Api/        # thin REST adapters
├── Http/Middleware/             # cross-cutting: correlation, idempotency, rate-limit, ws context, audit
├── Services/                    # use-cases (WorkflowService, AuditLogger, …)
├── Models/                      # Eloquent — UUID PKs (HasUuid trait)
├── Support/Rbac/                # role + permission helpers
└── Providers/                   # AppServiceProvider, AuthServiceProvider (gates)
```

Key invariants:

* **No model is reachable without a workspace context.** The `WorkspaceContextMiddleware` injects the active `Workspace` into the request and aborts with `401_workspace_required` if missing. All controllers retrieve it via `$request->attributes->get('workspace')`.
* **All privileged mutations call `AuditLogger::record(...)`.** Records form a hash chain (`prev_hash → hash`) using `config('app.aaop.audit_hash_secret')`. This hash is what allows tamper-evident export bundles.
* **Idempotency is opt-in per route** via the `idempotent` middleware. Bodies + status are cached for 24 hours under `aaop:idem:<workspace>:<key>`.

## Frontend conventions

* `lib/api/client.ts` is the single Axios instance. It pre-fetches the CSRF cookie before non-`GET` requests, automatically forwards `X-Workspace-Id`, and exposes `unwrapError` so pages can surface the canonical AAOP error envelope.
* `lib/auth/AuthContext.tsx` owns the user/session/workspace tuple and is mounted in the root layout. Pages use `useAuth()` to gate themselves; the `AppShell` component does this automatically.
* The design system lives in two synchronized places:
  * `theme/globals.css` (CSS variables consumed by raw CSS, SVG charts, and inline styles)
  * `theme/theme.ts` (MUI theme — `palette`, `typography`, `components.styleOverrides`)
  Adding a new accent? Update both files together.

## Multi-tenancy model

* `users` are global identities.
* `workspaces` are tenants; users join via `memberships` with one of `owner / admin / editor / runner / viewer`.
* Every resource (`workflows`, `workflow_versions`, `runs`, `secrets`, `policies`, `approval_requests`, `audit_logs`, `ui_mappings`) has a `workspace_id` foreign key.
* The frontend persists the active workspace in local storage; the API enforces tenancy at every request via `WorkspaceContextMiddleware` + `Workspace::roleFor()`.

## RBAC gates

Defined in `App\Providers\AuthServiceProvider`:

* `workspace.manage` — admin or owner
* `workspace.delete` — owner only
* `workflow.view` — viewer+
* `workflow.run` — runner+
* `workflow.edit` — editor+
* `workflow.delete` — admin+

Future per-workflow ACL refinements (PRD §17.6 FR-F1) will hang off `workflow_acls` (table already migrated).

## Audit hash chain

```
hash_n = sha256(workspace_id || actor || action || target || meta || prev_hash || secret)
```

`AuditLogger` looks up the most recent record per workspace, computes the new hash, and persists with `prev_hash` set. Export bundles attach a Laravel-encrypter signature so an offline verifier can replay the chain.

## What's intentionally stubbed in Phase 1

These return shape-compatible structures so the frontend can wire end-to-end. Real implementations land in Phase 2-3:

* **Workflow runtime** — `RunController::start` only persists run intent.
* **Policy evaluator** — `/policies/{id}/evaluate` returns a stub envelope; OPA integration arrives with F12.
* **Approval routing** — decisions are persisted but no notifications fire yet.
* **MCP tool registry, CUA driver, self-healing engine** — entirely Phase 2-3.

## Hot reload

* **Laravel** — code is bind-mounted into `/var/www/html`; `php artisan serve` auto-reloads on every request because OPcache is disabled in dev.
* **Next.js** — `WATCHPACK_POLLING=true` and `CHOKIDAR_USEPOLLING=true` are set in the container so file events propagate across the volume mount.

## Health & observability

* `GET /api/health` returns `{ status, db: ok|fail, redis: ok|fail }`. The Docker `backend` healthcheck uses this endpoint.
* All requests carry `X-Correlation-ID` (auto-generated if missing). Pair this with Pest tests, JSON logs, and (eventually) OTel traces for end-to-end debugging.
