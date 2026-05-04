# AAOP — Implementation Plan & Execution System
## AI Agent Orchestration Platform — PRD v6.0 → Engineering Execution

| Field | Value |
|---|---|
| **Source PRD** | AAOP PRD v6.0 (Enhanced Production Edition) |
| **Plan Version** | 1.0 |
| **Created** | May 2026 |
| **Status** | READY FOR EXECUTION |
| **Classification** | Internal — Confidential |

---

# PHASE 1 — PRD ANALYSIS

## 1.1 Feature Decomposition

The PRD decomposes into **16 top-level features**, **62 sub-features**, and **187 atomic tasks** organized across 6 execution phases.

### Feature Registry

| Feature ID | Feature Name | PRD Sections | Sub-features | Priority |
|---|---|---|---|---|
| F01 | Foundation & Infrastructure | §15, §26 | 5 | P0 |
| F02 | Identity, Auth & Tenancy | §17.6 (FR-F1), §19, §22 | 4 | P0 |
| F03 | Data Layer & Schema | §19 | 4 | P0 |
| F04 | API Gateway & Core API | §20 | 4 | P0 |
| F05 | Visual Workflow Designer | §16.1, §17.1, §24 | 6 | P0 |
| F06 | Workflow Engine | §16.2, §17.2 | 6 | P0 |
| F07 | AI Planner | §16.3, §17.3, §21 | 4 | P0 |
| F08 | CUA & Vision Runtime | §16.4 | 4 | P0 |
| F09 | Execution Orchestrator | §16.5 | 3 | P0 |
| F10 | Self-Healing Engine | §16.6, §17.4 | 3 | P0 |
| F11 | Observability & Learning Loop | §16.8, §17.5 | 4 | P0 |
| F12 | Governance, Policy & Approvals | §17.6, §27 | 4 | P0 |
| F13 | Integration Architecture | §25, §17.2 (FR-B12) | 4 | P1 |
| F14 | Marketplace & Templates | §17.7 | 3 | P1 |
| F15 | Security, Privacy & Compliance | §22 | 4 | P0 |
| F16 | DevOps, CI/CD & SRE | §26, §28 | 5 | P0 |

### Constraints
- C1: Canvas must render ≥ 50 FPS for 200-node workflows.
- C2: All API reads < 300ms p95; writes < 800ms p95.
- C3: CUA sandbox cold start < 5s p95.
- C4: Secrets never written to disk or logs; ephemeral injection only.
- C5: GDPR / CCPA / KSA PDPL compliance from Day 1.
- C6: Local-first LLM by default; cloud opt-in only.
- C7: Apache 2.0 for open-source core; proprietary for commercial features.

### Assumptions
- A1: Kubernetes (EKS/GKE/AKS) as primary orchestrator — validated.
- A2: PostgreSQL + pgvector as initial relational + vector store.
- A3: Redis Streams as v1 message bus; Kafka deferred.
- A4: trycua/cua as primary CUA infrastructure — MIT license confirmed.
- A5: Activepieces as embedded connector runtime — AAOP retains orchestration ownership.
- A6: Design partners (20) available from Month 6.

### Dependencies (Critical Path)
- D1: F01 (Infra) → all other features.
- D2: F03 (Data) → F02, F04, F05, F06.
- D3: F02 (Auth) → F04, F05, F06, F12.
- D4: F04 (API) → F05 (Designer), F13 (Integrations), F14 (Marketplace).
- D5: F06 (Engine) → F09 (Orchestrator) → F10 (Self-Healing).
- D6: F08 (CUA) → F09 (Orchestrator), F10 (Self-Healing).
- D7: F07 (Planner) depends on F03, F08, F06.

---

## 1.2 Tech Stack Validation

| Layer | Technology | Status | Risk |
|---|---|---|---|
| **Frontend** | React 18 + React Flow + TypeScript | ✅ Confirmed | Low |
| **Backend** | Node.js / Python (FastAPI) — polyglot | ✅ Confirmed | Low |
| **Database** | PostgreSQL 16 + pgvector | ✅ Confirmed | Low |
| **Cache/Queue** | Redis 7 (Streams) | ✅ Confirmed | Low |
| **Object Storage** | S3 / MinIO | ✅ Confirmed | Low |
| **Container Orchestration** | Kubernetes (EKS) | ✅ Confirmed | Low |
| **Service Mesh** | Istio | ✅ Confirmed | Medium — complexity |
| **IaC** | Terraform | ✅ Confirmed | Low |
| **CI/CD** | GitHub Actions + ArgoCD | ✅ Confirmed | Low |
| **Observability** | OTel + Prometheus + Grafana + Loki + Tempo | ✅ Confirmed | Low |
| **Secrets** | HashiCorp Vault | ✅ Confirmed | Low |
| **Browser Automation** | Playwright | ✅ Confirmed | Low |
| **CUA Infra** | trycua/cua (MIT) | ✅ Confirmed | Medium — maturity |
| **Agent Orchestration** | LangGraph (MIT) | ✅ Confirmed | Medium — API stability |
| **RAG / Memory** | LlamaIndex (MIT) | ✅ Confirmed | Low |
| **Connector Runtime** | Activepieces (MIT) | ✅ Confirmed | Medium — upstream drift |
| **Prompt Management** | Dify (Apache 2.0) | ✅ Confirmed | Low |
| **DOM Self-Healing** | Healenium (Apache 2.0) | ✅ Confirmed | Low |
| **UI Detection** | OmniParser (CC-BY-4.0) | ✅ Confirmed | Low |
| **Local LLM** | Ollama (MIT) | ✅ Confirmed | Low |
| **Policy Engine** | OPA / Rego | ✅ Confirmed | Low |
| **WAF** | AWS WAF / Cloudflare | ✅ Confirmed | Low |
| **Image Signing** | Cosign / SLSA | ✅ Confirmed | Low |

---

# PHASE 2 — IMPLEMENTATION PLAN

## 2. Architecture & Key Decisions

### Architectural Patterns
1. **Hexagonal architecture** — all engines (Playwright, CUA, Activepieces, LLM providers) behind port/adapter interfaces.
2. **Event-driven runtime** — Redis Streams for inter-service communication; async-by-default.
3. **Canonical workflow definition** — single graph JSON shared across designer, engine, policy, observability.
4. **Policy-as-code** — OPA evaluation at design time, deploy time, run time.
5. **Workspace-scoped multi-tenancy** — row-level security on all tables; region-aware routing.

### Key ADRs Referenced
ADR-001 through ADR-017 as documented in PRD Appendix B.

---

## 3. Master Task Graph

> **Notation:** `T-FXXX-NN` where `F` = Feature, `XXX` = Feature ID, `NN` = sequence.
> Each task is atomic (≤ 3 days effort), independently testable, and produces a defined artifact.

---

### F01 — Foundation & Infrastructure

#### SF01.1 — Kubernetes Cluster & Networking

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F01-01 | Provision EKS cluster with Terraform (multi-AZ, node groups for compute + GPU) | None | `infra/modules/eks/` Terraform module | `terraform plan` succeeds; cluster health check passes | TODO |
| T-F01-02 | Configure VPC, subnets, NAT gateways, security groups | None | `infra/modules/network/` | VPC connectivity test; private subnet isolation validated | TODO |
| T-F01-03 | Deploy Istio service mesh with mTLS enforcement | T-F01-01 | Istio manifests + mesh config | mTLS verified between test services; kiali dashboard live | TODO |
| T-F01-04 | Configure Envoy ingress controller with WAF rules (OWASP CRS, rate limiting) | T-F01-01, T-F01-02 | Ingress manifests + WAF rule set | OWASP attack patterns blocked; rate limits enforced in k6 test | TODO |
| T-F01-05 | Set up DNS, TLS certificates (cert-manager), and CDN | T-F01-04 | DNS records + cert-manager config | HTTPS termination validated; cert auto-renewal tested | TODO |

#### SF01.2 — Secrets & IAM

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F01-06 | Deploy HashiCorp Vault with auto-unseal (KMS-backed) | T-F01-01 | `infra/modules/secrets/` + Vault config | Vault health; secret write/read cycle; audit log emitted | TODO |
| T-F01-07 | Configure workload identity (IRSA/SPIFFE) for all service accounts | T-F01-06 | SA manifests + IRSA policies | Service can access Vault without static credentials | TODO |
| T-F01-08 | Implement secret injection library (ephemeral, never-to-disk) | T-F01-06 | `libs/secrets/` package | Secret accessible in-memory; absent from env dump and logs | TODO |

#### SF01.3 — Observability Stack

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F01-09 | Deploy OTel Collector (DaemonSet) with sampling config | T-F01-01 | OTel collector manifests | Trace propagation between 2 test services verified | TODO |
| T-F01-10 | Deploy Prometheus + Grafana with base dashboards | T-F01-09 | Helm charts + dashboard JSON | Metrics scraped; dashboard renders; cardinality < budget | TODO |
| T-F01-11 | Deploy Loki for structured log aggregation | T-F01-09 | Loki config + Promtail DaemonSet | Log query from test service returns within 2s | TODO |
| T-F01-12 | Deploy Tempo for distributed tracing | T-F01-09 | Tempo config | Trace visible in Grafana with service graph | TODO |
| T-F01-13 | Create OTel instrumentation library (shared SDK wrapper) | T-F01-09 | `libs/telemetry/` | Auto-instrumented HTTP/gRPC calls produce spans; correlation IDs propagated | TODO |

#### SF01.4 — Message Bus

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F01-14 | Deploy Redis 7 cluster with Streams enabled | T-F01-01 | Redis Helm chart + config | Stream write/read cycle; consumer group creation; persistence validated | TODO |
| T-F01-15 | Create event bus abstraction library (producer/consumer + dead-letter) | T-F01-14 | `libs/eventbus/` | Publish → consume verified; dead-letter on failure; idempotent delivery | TODO |

#### SF01.5 — CI/CD Pipeline

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F01-16 | Set up GitHub Actions pipeline (build → test → scan → sign → push) | T-F01-01 | `.github/workflows/ci.yml` | Full pipeline green on sample service; Cosign signature verified | TODO |
| T-F01-17 | Deploy ArgoCD for GitOps-based cluster state management | T-F01-01 | ArgoCD manifests + app-of-apps | Commit to manifests repo triggers deployment within 3 min | TODO |
| T-F01-18 | Configure progressive rollout (Argo Rollouts: canary → 25% → 100%) | T-F01-17 | Rollout strategy manifest | Canary promotion observable; auto-rollback on error-rate spike | TODO |
| T-F01-19 | Implement SBOM generation (Syft) and dependency scanning (Snyk/FOSSA) in CI | T-F01-16 | CI step config + SBOM output | SBOM generated; known CVE blocks pipeline | TODO |

---

### F02 — Identity, Auth & Tenancy

#### SF02.1 — Authentication

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F02-01 | Implement user registration + email/password auth (Auth.js) | T-F01-01, T-F03-01 | `services/auth/` | Register → login → JWT issued → validated by API gateway | TODO |
| T-F02-02 | Implement OAuth 2.1 / OIDC provider integration (Google, Microsoft, GitHub) | T-F02-01 | OAuth callback handlers | Full OAuth flow for each provider; token refresh tested | TODO |
| T-F02-03 | Implement SAML SSO adapter (for enterprise) | T-F02-01 | SAML handler | SAML assertion → session created; attribute mapping correct | TODO |
| T-F02-04 | MFA enforcement for admin roles (TOTP) | T-F02-01 | MFA middleware | Admin login without MFA blocked; TOTP flow succeeds | TODO |

#### SF02.2 — Authorization (RBAC + ACL)

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F02-05 | Implement RBAC system (owner/admin/editor/runner/viewer) | T-F02-01, T-F03-02 | `libs/authz/` | Each role can only perform allowed operations; deny-by-default verified | TODO |
| T-F02-06 | Implement per-workflow ACL overrides | T-F02-05 | ACL middleware | Workflow-level share/unshare; audit log emitted on change | TODO |
| T-F02-07 | Implement API token management (workspace-scoped, rotatable) | T-F02-01 | Token CRUD endpoints | Token creation, scoping, revocation, rotation tested | TODO |

#### SF02.3 — Workspace & Tenancy

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F02-08 | Implement workspace CRUD + membership management | T-F03-01, T-F02-01 | `services/workspace/` | Create workspace, invite member, change role, remove member | TODO |
| T-F02-09 | Implement row-level security (RLS) for workspace isolation | T-F03-01 | PostgreSQL RLS policies | Cross-tenant data access impossible via direct SQL | TODO |
| T-F02-10 | Implement region-aware workspace routing (US/EU/KSA) | T-F02-08 | Routing middleware | Workspace data stays in declared region; cross-region query blocked | TODO |

---

### F03 — Data Layer & Schema

#### SF03.1 — Core Schema

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F03-01 | Provision PostgreSQL 16 (RDS/CloudSQL) with pgvector extension | T-F01-01 | `infra/modules/data/` Terraform | DB accessible; pgvector extension active; backup verified | TODO |
| T-F03-02 | Apply core schema migrations (users, workspaces, memberships, workflows, workflow_versions, runs, node_runs) | T-F03-01 | `db/migrations/001-010` | All tables created; FK constraints validated; sample data insertable | TODO |
| T-F03-03 | Apply UI mapping schema (ui_mappings table + indexes) | T-F03-01 | `db/migrations/011` | Lookup by (workspace, app_url, element_label) returns < 5ms | TODO |
| T-F03-04 | Apply audit log schema (audit_logs with hash chain) | T-F03-01 | `db/migrations/012` | Audit row inserted; tamper detection via chain hash verified | TODO |

#### SF03.2 — Governance Schema

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F03-05 | Apply secrets reference table (vault_ref, rotation_policy) | T-F03-01 | `db/migrations/013` | Secret ref created; Vault path format validated; no plaintext stored | TODO |
| T-F03-06 | Apply approval schema (approval_requests, approval_decisions) | T-F03-01 | `db/migrations/014` | Request created; decision recorded; SLA deadline enforced | TODO |
| T-F03-07 | Apply policy schema (policies with scope, enforcement points, OPA/Rego source) | T-F03-01 | `db/migrations/015` | Policy stored; scope filtering correct; Rego source retrievable | TODO |
| T-F03-08 | Apply LangGraph checkpoint table | T-F03-01 | `db/migrations/016` | Checkpoint stored and retrieved by (run_id, thread_id) | TODO |

#### SF03.3 — Object Storage

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F03-09 | Provision S3 buckets (screenshots, exports, backups) with lifecycle policies | T-F01-01 | Terraform module + lifecycle config | Upload/download; TTL expiration; encryption at rest verified | TODO |
| T-F03-10 | Implement presigned URL generator for screenshot access | T-F03-09 | `libs/storage/` | URL generated; expires after TTL; unauthorized access returns 403 | TODO |

#### SF03.4 — Cache Layer

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F03-11 | Implement workspace-scoped cache layer (UI mappings, hot config) | T-F01-14 | `libs/cache/` | Cache hit/miss; TTL expiration; workspace isolation verified | TODO |

---

### F04 — API Gateway & Core API

#### SF04.1 — Gateway Configuration

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F04-01 | Configure API gateway with auth middleware (Bearer token + workspace scoping) | T-F02-01, T-F01-04 | Gateway config | Authenticated request passes; invalid token returns 401; wrong workspace 403 | TODO |
| T-F04-02 | Implement rate limiting (per-token + per-workspace) with X-RateLimit headers | T-F04-01 | Rate-limit middleware | Headers present; 429 returned on breach; different limits per tier | TODO |
| T-F04-03 | Implement idempotency key handling (24h TTL) | T-F04-01, T-F01-14 | Idempotency middleware | Duplicate POST with same key returns cached response; expired key creates new | TODO |
| T-F04-04 | Implement correlation ID injection (X-Correlation-ID) | T-F04-01, T-F01-13 | Correlation middleware | ID present on every response; propagated to downstream traces | TODO |

#### SF04.2 — Resource APIs

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F04-05 | Implement Workflow CRUD endpoints (POST/GET/PATCH/DELETE /v1/workflows) | T-F03-02, T-F02-05 | `services/api/workflows.ts` | CRUD happy path; auth enforcement; validation errors; cursor pagination | TODO |
| T-F04-06 | Implement Workflow Versions endpoints (POST/GET /v1/workflows/{id}/versions) | T-F04-05 | Version endpoints | Version saved; list returns sorted; graph JSONB validated | TODO |
| T-F04-07 | Implement Run endpoints (POST start, GET details, POST cancel/pause/resume) | T-F04-05, T-F06-01 | `services/api/runs.ts` | Run created in queued; cancel transitions correctly; resume from checkpoint | TODO |
| T-F04-08 | Implement WebSocket live stream endpoint (/v1/runs/{id}/stream) | T-F04-07, T-F01-15 | WS handler | Client connects; receives node.started/succeeded events; disconnect handled | TODO |
| T-F04-09 | Implement standard error model (code, message, type, details, correlation_id) | T-F04-01 | Error middleware | Validation, auth, policy, rate-limit errors all follow schema | TODO |
| T-F04-10 | Generate and publish OpenAPI 3.1 spec (CI-sync) | T-F04-05 through T-F04-09 | `docs/openapi.yaml` | Spec validates; matches actual endpoints; auto-generated from annotations | TODO |

#### SF04.3 — Governance & Supporting APIs

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F04-11 | Implement Secrets CRUD (POST/GET/DELETE — no value exposure) | T-F03-05, T-F01-06 | Secrets endpoints | Create ref; list returns names only; delete removes vault ref | TODO |
| T-F04-12 | Implement Approval endpoints (create, list pending, decide) | T-F03-06, T-F02-05 | Approval endpoints | Request created; list filters by status; decision recorded with audit | TODO |
| T-F04-13 | Implement Policy endpoints (CRUD + dry-run evaluate) | T-F03-07 | Policy endpoints | Policy stored; dry-run evaluates workflow against rules | TODO |
| T-F04-14 | Implement Audit Log export endpoint (signed bundle, time-range filter) | T-F03-04 | Audit export endpoint | Export returns signed JSON; hash chain verifiable; PDF generated | TODO |

---

### F05 — Visual Workflow Designer

#### SF05.1 — Canvas Core

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F05-01 | Scaffold React Flow canvas with workspace layout (palette, canvas, inspector) | T-F04-05 | `apps/designer/` base app | Canvas renders; 200-node workflow at ≥ 50 FPS | TODO |
| T-F05-02 | Implement typed node palette with categorized node registry | T-F05-01 | Node registry + palette component | All node types render in palette; category filter works | TODO |
| T-F05-03 | Implement drag-and-drop from palette to canvas (FR-A2) | T-F05-02 | DnD handler | Node dropped → added with default config; auto-save within 500ms | TODO |
| T-F05-04 | Implement edge creation with type validation (FR-A3) | T-F05-01 | Edge handler | Compatible edge accepted; incompatible rejected with inline message | TODO |
| T-F05-05 | Implement command palette (Cmd/Ctrl-K) for power users | T-F05-01 | Command palette component | Open, search, select node/action; keyboard-only flow works | TODO |

#### SF05.2 — Node Configuration

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F05-06 | Implement schema-driven inspector side panel (FR-A4) | T-F05-01 | Inspector component | Form renders from node schema; help text shown; validation inline | TODO |
| T-F05-07 | Implement secret-reference autocomplete in inspector | T-F05-06, T-F04-11 | Secret picker component | Secrets listed from workspace; selected ref stored (never value) | TODO |
| T-F05-08 | Implement unsaved-changes guard (preserve across navigation) | T-F05-06 | Change guard | Navigate away warns; explicit Discard required; changes survive tab switch | TODO |

#### SF05.3 — Graph Validation & Lifecycle

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F05-09 | Implement real-time graph validation engine (FR-A5) | T-F05-04 | Validation engine | Cycles detected; broken edges flagged; type mismatches shown within 200ms | TODO |
| T-F05-10 | Implement workflow create, save, name (FR-A1) | T-F05-01, T-F04-05 | Workflow CRUD in designer | New workflow → draft, v1; audit log emitted; redirect to canvas < 2s | TODO |
| T-F05-11 | Implement version management UI (clone, rollback, diff view) (FR-A8) | T-F05-10, T-F04-06 | Version panel | Restore creates new version; diff view highlights changes between versions | TODO |
| T-F05-12 | Implement import/export JSON (FR-A9) | T-F05-10 | Import/export buttons | Schema-validated import; round-trip byte-stable; export includes metadata | TODO |

#### SF05.4 — AI-Assisted Authoring

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F05-13 | Implement NL → workflow generation UI (FR-A6) | T-F05-01, T-F07-01 | AI prompt input + canvas binding | Prompt submitted → graph rendered on canvas within 30s; AI-suggested badges shown | TODO |
| T-F05-14 | Implement AI side panel for conversational refinement | T-F05-13 | AI chat panel | Multi-turn refinement; suggestions applied to canvas; undo supported | TODO |
| T-F05-15 | Implement inline node test (run single node with sample input) | T-F05-06, T-F06-01 | Node test component | Node runs in isolation; output displayed; no side effects on full workflow | TODO |

#### SF05.5 — Collaboration & Sharing

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F05-16 | Implement workflow sharing with per-user permissions (FR-A10) | T-F05-10, T-F02-06 | Share dialog | Share with read/edit/run; ACL persisted; audit log on change | TODO |
| T-F05-17 | Implement environment promotion UI (draft → staging → production) | T-F05-11, T-F12-03 | Promotion panel | Promote gate checks policy; rollback available; audit trail | TODO |

#### SF05.6 — Accessibility

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F05-18 | Implement keyboard navigation for canvas, palette, inspector | T-F05-01 | Keyboard handlers | Full workflow composable via keyboard only; focus management on modals | TODO |
| T-F05-19 | Implement screen-reader labeling for all interactive nodes | T-F05-01 | ARIA attributes | VoiceOver/NVDA can navigate and describe all nodes and edges | TODO |
| T-F05-20 | Implement high-contrast + reduced-motion modes | T-F05-01 | CSS theme + motion config | Prefers-contrast and prefers-reduced-motion respected | TODO |

---

### F06 — Workflow Engine

#### SF06.1 — DAG Execution Core

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F06-01 | Implement DAG executor (sequential + parallel branch resolution) (FR-B4) | T-F01-15, T-F03-02 | `services/engine/executor.ts` | Linear graph runs sequentially; parallel branches execute concurrently; join waits for all | TODO |
| T-F06-02 | Implement bounded loop execution with max iteration guard (FR-B5) | T-F06-01 | Loop handler | Loop runs N times; exceeding max halts run with incident | TODO |
| T-F06-03 | Implement try/catch error handling nodes (FR-B6) | T-F06-01 | Error handler | Typed errors caught; context propagated; uncaught escalates to workflow failure | TODO |
| T-F06-04 | Implement idempotent checkpoint persistence at every node boundary (FR-B8) | T-F06-01, T-F03-02 | Checkpoint logic | Process killed mid-run → restart resumes from last checkpoint | TODO |

#### SF06.2 — Triggering & Scheduling

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F06-05 | Implement manual run trigger with typed inputs (FR-B1, FR-B10) | T-F06-01, T-F04-07 | Run trigger | Run queued < 1s; inputs validated against schema; secrets resolved at runtime | TODO |
| T-F06-06 | Implement cron scheduler (timezone-aware, miss-policy) (FR-B2) | T-F06-05 | `services/scheduler/` | Cron fires on time; missed runs handled per policy; timezone correct | TODO |
| T-F06-07 | Implement webhook trigger with HMAC + replay protection (FR-B3) | T-F06-05, T-F04-01 | Webhook handler | Unique URL; HMAC verified; nonce replay blocked; payload validated | TODO |

#### SF06.3 — Run Control

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F06-08 | Implement pause / resume / cancel with state safety (FR-B7) | T-F06-04 | Run control endpoints | Pause at next node boundary; resume from checkpoint; cancel flags in-flight effects | TODO |
| T-F06-09 | Implement cost tracking per run (credit accumulation) | T-F06-01 | Cost tracker | cost_credits column updated per node; workspace budget checked per step | TODO |
| T-F06-10 | Implement cost ceiling enforcement (hard cap halts run) (EC-14) | T-F06-09 | Budget guard | Run paused when cap reached; owner notified; acknowledgement required to resume | TODO |

#### SF06.4 — Worker Management

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F06-11 | Implement worker pool with queue-driven autoscaling | T-F01-15, T-F01-01 | Worker deployment + HPA | Workers scale up on queue depth; scale down when idle; min replicas maintained | TODO |
| T-F06-12 | Implement remote worker agent (outbound-only mTLS, identity rotation) (FR-B9) | T-F06-11, T-F01-07 | `agent/remote-worker/` | Agent connects via mTLS; identity rotates; visible in admin console | TODO |

#### SF06.5 — CUA Sandbox Integration

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F06-13 | Implement CUA sandbox lifecycle (launch, execute, destroy) (FR-B11) | T-F08-01, T-F06-01 | Sandbox manager | Sandbox launched < 5s p95; runs execute; sandbox destroyed after run; resources capped | TODO |
| T-F06-14 | Implement sandbox pool (pre-warm, recycle, autoscale) | T-F06-13 | Pool manager | Pre-warmed sandboxes available; pool scales on queue; recycled after use | TODO |

#### SF06.6 — Activepieces Integration

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F06-15 | Implement Activepieces action invocation node (FR-B12) | T-F06-01, T-F13-01 | Activepieces node handler | Typed wrapper calls piece; failure surfaces piece error; secrets brokered ephemerally | TODO |

---

### F07 — AI Planner

#### SF07.1 — NL → Workflow Generation

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F07-01 | Implement planner service with structured tool-calling (FR-C1) | T-F03-02, T-F01-08 | `services/planner/` | NL prompt → valid workflow JSON; schema validation passes; cost estimate returned | TODO |
| T-F07-02 | Implement policy-aware plan filtering (disallowed action types rejected) | T-F07-01, T-F12-03 | Policy filter in planner | Plan with disallowed action → rejected with explanation | TODO |
| T-F07-03 | Implement hybrid model routing (local Ollama vs cloud LLM) with fallback | T-F07-01 | Model router | Local-first by default; cloud on opt-in or after N local failures; routing logged | TODO |
| T-F07-04 | Implement prompt registry (Dify integration, versioned templates, A/B scaffold) | T-F07-01 | Prompt registry adapter | Versioned prompts stored; A/B assignment correct; eval pass required for promotion | TODO |

#### SF07.2 — Replanning & Explanation

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F07-05 | Implement replan-on-heal-escalation (FR-C2) | T-F07-01, T-F10-01 | Replan handler | Heal escalation → replanner invoked; respects retry budget + cost ceiling | TODO |
| T-F07-06 | Implement workflow explanation in plain language (FR-C3) | T-F07-01 | Explain endpoint | Explanation ≤ 200 words; cites nodes + policies; secrets never leaked | TODO |
| T-F07-07 | Implement cost-aware model routing optimization (FR-C4) | T-F07-03 | Routing optimizer | Routing decisions logged; per-workspace budget enforced; fallback documented | TODO |

#### SF07.3 — RAG & Memory

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F07-08 | Integrate LlamaIndex for workflow-aware RAG retrieval | T-F03-01, T-F03-08 | `services/planner/rag.ts` | Similar past workflows retrieved; relevance score meaningful | TODO |
| T-F07-09 | Implement embedding pipeline (ingest workflow definitions → pgvector) | T-F07-08 | Embedding pipeline | New workflow indexed; search returns relevant results; workspace-scoped | TODO |

#### SF07.4 — Evaluation Harness

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F07-10 | Build AI evaluation harness (200+ benchmark workflows) | T-F07-01 | `evals/planner/` suite | Suite runs nightly; success rate ≥ 60% on first-try for M3 milestone | TODO |
| T-F07-11 | Implement promotion gate (model candidate must beat baseline) | T-F07-10 | Promotion script | Model below threshold blocked; above threshold promoted automatically | TODO |

---

### F08 — CUA & Vision Runtime

#### SF08.1 — CUA Infrastructure

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F08-01 | Integrate trycua/cua sandbox manager (launch/destroy/screenshot) | T-F01-01 | `services/cua/sandbox.ts` | Linux sandbox launches < 5s; screenshot captured; destroyed cleanly | TODO |
| T-F08-02 | Implement CUA driver integration (macOS background automation) | T-F08-01 | Driver adapter | macOS actions execute without focus theft; coordinates normalized | TODO |
| T-F08-03 | Implement Cua-Bench integration for regression testing | T-F08-01 | Benchmark runner | OSWorld, ScreenSpot benchmarks run; results stored for comparison | TODO |

#### SF08.2 — Vision Pipeline

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F08-04 | Implement screenshot → element detection pipeline (OmniParser + VLM) | T-F08-01 | `services/cua/vision.ts` | Elements detected with bbox + labels + confidence; output schema matches spec | TODO |
| T-F08-05 | Implement OCR pipeline (PaddleOCR default, Tesseract fallback) | T-F08-04 | OCR adapter | Text regions extracted; multi-language tested; fallback chain works | TODO |
| T-F08-06 | Implement semantic element finder ("find Submit button near bottom") | T-F08-04 | Semantic finder | Natural language description → matching element with confidence score | TODO |
| T-F08-07 | Implement visual diff for screen change detection | T-F08-04 | Diff engine | Page change detected between actions; stable pages return no diff | TODO |

#### SF08.3 — Coordinate Normalization

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F08-08 | Implement DPI/zoom coordinate normalization | T-F08-04 | Normalizer | Coordinates correct at 1x, 1.5x, 2x DPI; zoom levels 100%, 125%, 150% | TODO |

#### SF08.4 — Mouse & Keyboard Actions

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F08-09 | Implement action executor (click, type, scroll, drag, keyboard shortcuts) | T-F08-01 | Action executor | Each action type succeeds on test app; verify-after-action via visual diff | TODO |

---

### F09 — Execution Orchestrator

#### SF09.1 — Routing Engine

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F09-01 | Implement step-level routing engine (DOM/Vision/MCP/Activepieces/HITL) | T-F06-01, T-F08-04 | `services/orchestrator/router.ts` | Routing decision matrix matches PRD table; signal-based selection correct | TODO |
| T-F09-02 | Implement fallback chain execution (Playwright → Healenium → Vision → MCP) | T-F09-01, T-F10-01 | Fallback chain | Each fallback level attempted in order; final failure escalates | TODO |

#### SF09.2 — Human-in-the-Loop

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F09-03 | Implement HITL node type (pause run, create approval request, await decision) | T-F09-01, T-F04-12 | HITL handler | Run pauses at HITL node; approval request created; decision resumes/aborts run | TODO |

#### SF09.3 — LangGraph Orchestration

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F09-04 | Implement LangGraph agent subgraph invocation node | T-F06-01 | LangGraph adapter | Subgraph invoked; state checkpointed; output returned to workflow | TODO |
| T-F09-05 | Implement LangGraph checkpoint persistence to PostgreSQL | T-F09-04, T-F03-08 | Checkpoint store | State persisted; retrievable by run_id + thread_id | TODO |

---

### F10 — Self-Healing Engine

#### SF10.1 — Detection & Recovery

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F10-01 | Implement failure detection (selector not found, visual fail, modal, timeout) | T-F06-01 | Detection module | Each failure type detected; correct signal emitted | TODO |
| T-F10-02 | Implement Healenium ML selector remap (FR-D1) | T-F10-01 | Healenium adapter | Remap attempted < 500ms; success rate ≥ 70% on benchmark | TODO |
| T-F10-03 | Implement vision-based selector recovery (FR-D2) | T-F10-01, T-F08-06 | Vision recovery | Element re-found via vision; confidence ≥ 0.85; below threshold escalates | TODO |
| T-F10-04 | Implement recovery strategy chain (retry → Healenium → vision → wait → replan → human) | T-F10-02, T-F10-03, T-F07-05 | Strategy chain | Strategies attempted in priority order; circuit breaker at max attempts (EC-15) | TODO |

#### SF10.2 — Learning Loop

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F10-05 | Implement UI mapping updates on successful heals | T-F10-04, T-F03-03 | Mapping updater | New selector stored; observed_count incremented; confidence updated | TODO |
| T-F10-06 | Implement negative-example capture for failed heals | T-F10-04 | Negative example store | Failed heal → data captured → available for planner prompt refinement | TODO |

#### SF10.3 — Heal Visibility

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F10-07 | Implement heal record with before/after diff (FR-D3) | T-F10-04 | Heal diff record | Before/after selectors + screenshots stored; visible in run trace | TODO |

---

### F11 — Observability & Learning Loop

#### SF11.1 — Run Dashboard

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F11-01 | Implement real-time run dashboard (current runs, queue depth, error rate) | T-F04-08, T-F01-10 | Dashboard page | Live data updates; auto-refresh; filters by workspace/environment | TODO |
| T-F11-02 | Implement per-run drill-down trace (per-node timeline, screenshots, logs) (FR-E1) | T-F11-01, T-F03-09 | Trace detail page | Every node visible; screenshot displayed; PII redacted per policy | TODO |

#### SF11.2 — Analytics

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F11-03 | Implement per-workflow analytics dashboard (FR-E2) | T-F11-01 | Analytics page | Success rate, p50/p95 latency, retry/heal rate, cost; filterable | TODO |
| T-F11-04 | Implement workflow health score gauge (0-100 with contributing factors) | T-F11-03 | Health score component | Score computed from recent runs; trend displayed; factors listed | TODO |

#### SF11.3 — Anomaly Detection

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F11-05 | Implement anomaly detection on workflow baselines (FR-E3) | T-F11-03 | Anomaly detector | Alert fires on > 2σ deviation sustained over rolling window; tunable per workflow | TODO |
| T-F11-06 | Implement alert routing (toast, email, Slack) | T-F11-05 | Alert router | Alert delivered to configured channels; acknowledge action available | TODO |

#### SF11.4 — Feedback & Eval

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F11-07 | Implement user feedback capture (thumbs up/down on healed actions) | T-F11-02 | Feedback component | Feedback stored; linked to heal record; queryable for eval | TODO |
| T-F11-08 | Integrate LangSmith for LLM call tracing | T-F01-13 | LangSmith adapter | LLM calls traced; prompt version tracked; eval results stored | TODO |

---

### F12 — Governance, Policy & Approvals

#### SF12.1 — Policy Engine

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F12-01 | Implement OPA/Rego policy evaluation engine | T-F03-07 | `services/policy/` | Rego policy loaded; evaluated against workflow payload; violation returned with message | TODO |
| T-F12-02 | Implement design-time policy linting in designer (FR-F3) | T-F12-01, T-F05-09 | Policy linter | Unsafe patterns detected on edit; violation banner shown in designer | TODO |
| T-F12-03 | Implement deploy-time policy gates (promotion blocked on violation) | T-F12-01, T-F05-17 | Promotion gate | Policy evaluated on promote; violation blocks with explanatory message | TODO |
| T-F12-04 | Implement run-time policy enforcement (per-step evaluation) | T-F12-01, T-F06-01 | Runtime guard | Disallowed action blocked at run time; run paused with incident | TODO |

#### SF12.2 — Approval Center

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F12-05 | Implement Approval Center UI (pending requests, SLA timers, decision log) (FR-F2) | T-F04-12, T-F09-03 | Approval Center page | Requests listed; SLA countdown visible; approve/reject actions available | TODO |
| T-F12-06 | Implement SLA escalation policy (auto-reject or backup approver on expiry) (EC-9) | T-F12-05 | Escalation handler | SLA timer fires; per-policy auto-reject or escalation; audit trail | TODO |

#### SF12.3 — Audit

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F12-07 | Implement tamper-evident audit log (hash-chain, append-only) | T-F03-04 | Audit service | Every sensitive action logged; chain hash verifiable; tampering detected | TODO |
| T-F12-08 | Implement audit export UI (signed bundle, PDF + JSON, time filter) (FR-F4) | T-F04-14, T-F12-07 | Audit export page | Export generated; signature verifiable; PDF renders correctly | TODO |

#### SF12.4 — Edge Case Handling

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F12-09 | Implement PII scrubber on screenshots and logs (configurable per workspace) | T-F11-02 | PII scrubber | Configured regions redacted; unconfigured pass through; scrubber runs < 200ms per image | TODO |
| T-F12-10 | Implement prompt injection detection + quarantine (EC-21) | T-F07-01 | Injection classifier | Injected content quarantined from planner; human review triggered; plan not executed | TODO |

---

### F13 — Integration Architecture

#### SF13.1 — Activepieces Runtime

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F13-01 | Deploy Activepieces as embedded connector runtime service | T-F01-01 | Activepieces deployment | Activepieces running; piece catalog browsable; health check green | TODO |
| T-F13-02 | Implement AAOP → Activepieces adapter (typed node interface, ephemeral secrets) | T-F13-01, T-F01-08 | Adapter layer | Action invoked; secrets brokered ephemerally; failure surfaced with piece error | TODO |
| T-F13-03 | Implement Activepieces → AAOP inbound triggers (governed webhook) | T-F13-01, T-F06-07 | Inbound trigger handler | Activepieces event → AAOP workflow triggered; governance applied | TODO |

#### SF13.2 — MCP Integration

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F13-04 | Implement MCP client (connect to any compliant MCP server) | T-F01-01 | MCP client library | Connect to test MCP server; tool discovery; tool invocation | TODO |
| T-F13-05 | Bundle MCP servers (filesystem, shell, browser control) | T-F13-04 | Bundled MCP servers | Each bundled server operational; security constraints enforced | TODO |

#### SF13.3 — Integration Broker

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F13-06 | Implement central OAuth integration broker (token storage, refresh, rotation) | T-F01-06, T-F02-01 | Integration broker service | OAuth flow for Google, Microsoft; token refreshed; revocation handled (EC-24) | TODO |
| T-F13-07 | Implement connector health monitoring + deprecation alerts (EC-17) | T-F13-01 | Health monitor | Deprecated piece detected → warning at design time; blocked at deploy time | TODO |

#### SF13.4 — Custom Code Nodes

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F13-08 | Implement sandboxed JS/Python runners (Deno/pyodide/firejail) | T-F06-01 | Custom code executor | Code runs sandboxed; network allowlist enforced; memory + CPU capped; timeout enforced | TODO |

---

### F14 — Marketplace & Templates

#### SF14.1 — Browsing & Installing

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F14-01 | Implement marketplace registry (browse, search, filter by vertical) (FR-G1) | T-F04-05 | `services/marketplace/` | Templates listed; search returns relevant; category filter works | TODO |
| T-F14-02 | Implement template installation (one-click import to workspace) | T-F14-01, T-F05-12 | Install flow | Template installed; secrets placeholders shown; audit log emitted | TODO |

#### SF14.2 — Publishing

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F14-03 | Implement template publishing with lint + security scan (FR-G2) | T-F14-01 | Publish flow | Lint passes; security scan clears; publish record auditable | TODO |
| T-F14-04 | Implement pricing model selection for published templates | T-F14-03 | Pricing config | Free or paid selectable; revenue share recorded | TODO |

#### SF14.3 — Vertical Packs

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F14-05 | Create Finance vertical pack (bank reconciliation, invoice ingestion, expense) (FR-G3) | T-F14-01 | Finance pack | 3+ workflows installable; run successfully on test data | TODO |
| T-F14-06 | Create HR vertical pack (onboarding, offboarding, candidate sourcing) | T-F14-01 | HR pack | 3+ workflows installable; run successfully on test data | TODO |

---

### F15 — Security, Privacy & Compliance

#### SF15.1 — Security Controls

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F15-01 | Implement network policies (per-namespace egress filtering, deny-by-default) | T-F01-01 | NetworkPolicy manifests | Cross-namespace traffic blocked; allowed traffic passes; audit logged | TODO |
| T-F15-02 | Implement container security hardening (non-root, read-only FS, drop all caps) | T-F01-01 | SecurityContext in all manifests | Privileged operations fail; filesystem writes to emptyDir only | TODO |
| T-F15-03 | Implement log scrubber for accidental secret leaks (EC-22) | T-F01-13, T-F01-08 | Log scrubber | Secret pattern detected → redacted; alert to security; rotation flag raised | TODO |

#### SF15.2 — Data Privacy

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F15-04 | Implement data residency enforcement (workspace data stays in declared region) | T-F02-10, T-F03-01 | Residency guard | Cross-region data movement blocked; replication only within region | TODO |
| T-F15-05 | Implement right-to-erasure handler (GDPR Article 17, 30-day SLA) | T-F03-02 | Erasure pipeline | Deletion request → all PII removed within 30 days; confirmation logged | TODO |

#### SF15.3 — Compliance Automation

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F15-06 | Implement SBOM generation per release (Syft + dependency scanning) | T-F01-19 | SBOM pipeline | SBOM generated on every release; known CVE blocks pipeline | TODO |
| T-F15-07 | Implement SOC 2 evidence collection automation (control logs, access reviews) | T-F12-07 | Evidence collector | Control evidence exportable; access review snapshots automated | TODO |

#### SF15.4 — Sandbox Security

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F15-08 | Implement CUA sandbox escape prevention (VM isolation, seccomp, AppArmor) | T-F08-01 | Sandbox security config | Container escape attempt blocked; seccomp violation logged; alert raised | TODO |

---

### F16 — DevOps, CI/CD & SRE

#### SF16.1 — Environment Management

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F16-01 | Implement per-engineer ephemeral dev environments (Tilt/Skaffold) | T-F01-01 | Dev environment config | Namespace created on demand; services running; destroyed on teardown | TODO |
| T-F16-02 | Implement staging environment (production-like, multi-AZ) | T-F01-01 | Staging Terraform + manifests | Full stack running; eval harness integrated; data anonymized | TODO |
| T-F16-03 | Implement production multi-region active-active control plane | T-F01-01 | Production Terraform | Region failover tested; RTO ≤ 15 min; RPO ≤ 5 min | TODO |

#### SF16.2 — Rollback & Safety

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F16-04 | Implement blue/green deployment for control plane (≤ 2 min rollback) | T-F01-18 | Blue/green config | Bad deploy detected → auto-rollback within 2 min; SLO restored | TODO |
| T-F16-05 | Implement feature flag infrastructure (OpenFeature/LaunchDarkly) | T-F01-17 | Feature flag SDK | Flag toggled → behavior changes immediately; flag-off = instant rollback | TODO |

#### SF16.3 — SRE

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F16-06 | Define and publish SLOs per service; implement error budget tracking | T-F01-10 | SLO dashboards | Error budget calculated; release freeze triggered when exhausted | TODO |
| T-F16-07 | Create runbooks for top 20 alert types | T-F16-06 | Runbook repository | Each runbook has clear diagnosis steps + remediation | TODO |
| T-F16-08 | Implement DORA metrics dashboard (deploy freq, lead time, MTTR, CFR) | T-F01-10, T-F01-17 | DORA dashboard | Four metrics tracked; displayed in Grafana; trending over time | TODO |

#### SF16.4 — Chaos & DR

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F16-09 | Implement chaos test suite (kill workers, sever DB, fail providers) | T-F16-02 | Chaos scripts | System degrades gracefully; no data loss; recovery within MTTR target | TODO |
| T-F16-10 | Implement quarterly DR drill (region failover + restore from backup) | T-F16-03 | DR runbook | Failover completes within RTO; data intact within RPO; drill documented | TODO |

#### SF16.5 — Terraform Module Completion

| Task ID | Description | Dependencies | Output Artifact | Test Requirement | Status |
|---|---|---|---|---|---|
| T-F16-11 | Complete CDN + edge cache module | T-F01-05 | `infra/modules/cdn/` | Static assets served from edge; cache invalidation tested | TODO |
| T-F16-12 | Complete sandbox pool infrastructure module (KVM hosts / AVF) | T-F06-14 | `infra/modules/sandbox-pool/` | Pool provisions; autoscales; resource limits enforced | TODO |

---

## 4. PRD Coverage Matrix

| PRD Requirement | Task IDs | Status |
|---|---|---|
| **FR-A1** Create, save, name workflow | T-F05-10 | TODO |
| **FR-A2** Drag/drop nodes | T-F05-03 | TODO |
| **FR-A3** Connect nodes with edges | T-F05-04 | TODO |
| **FR-A4** Configure node parameters | T-F05-06, T-F05-07, T-F05-08 | TODO |
| **FR-A5** Validate graph | T-F05-09 | TODO |
| **FR-A6** NL → workflow | T-F05-13, T-F07-01 | TODO |
| **FR-A7** Record actions | T-F05-14 (deferred P1) | TODO |
| **FR-A8** Clone, version, rollback | T-F05-11 | TODO |
| **FR-A9** Import/export JSON | T-F05-12 | TODO |
| **FR-A10** Share with permissions | T-F05-16 | TODO |
| **FR-A11** Publish to marketplace | T-F14-03 | TODO |
| **FR-A12** Import LangGraph | T-F09-04 | TODO |
| **FR-A13** Prompt management (Dify) | T-F07-04 | TODO |
| **FR-B1** Manual run | T-F06-05 | TODO |
| **FR-B2** Schedule (cron) | T-F06-06 | TODO |
| **FR-B3** Webhook trigger | T-F06-07 | TODO |
| **FR-B4** Parallel branches/joins | T-F06-01 | TODO |
| **FR-B5** Bounded loops | T-F06-02 | TODO |
| **FR-B6** Try/catch | T-F06-03 | TODO |
| **FR-B7** Pause/resume/cancel | T-F06-08 | TODO |
| **FR-B8** Crash-recovery | T-F06-04 | TODO |
| **FR-B9** Remote workers | T-F06-12 | TODO |
| **FR-B10** Runtime inputs | T-F06-05 | TODO |
| **FR-B11** CUA sandbox execution | T-F06-13 | TODO |
| **FR-B12** Activepieces actions | T-F06-15 | TODO |
| **FR-C1** NL planner + policy | T-F07-01, T-F07-02 | TODO |
| **FR-C2** Replan failing step | T-F07-05 | TODO |
| **FR-C3** Explain workflow | T-F07-06 | TODO |
| **FR-C4** Cost-aware routing | T-F07-07 | TODO |
| **FR-D1** Healenium remap | T-F10-02 | TODO |
| **FR-D2** Vision recovery | T-F10-03 | TODO |
| **FR-D3** Heal diff visible | T-F10-07 | TODO |
| **FR-E1** Per-run trace | T-F11-02 | TODO |
| **FR-E2** Workflow analytics | T-F11-03 | TODO |
| **FR-E3** Anomaly detection | T-F11-05 | TODO |
| **FR-F1** RBAC + ACL | T-F02-05, T-F02-06 | TODO |
| **FR-F2** Approval Center | T-F12-05, T-F12-06 | TODO |
| **FR-F3** Policy-as-code | T-F12-01 through T-F12-04 | TODO |
| **FR-F4** Audit log export | T-F12-07, T-F12-08 | TODO |
| **FR-G1** Browse/install templates | T-F14-01, T-F14-02 | TODO |
| **FR-G2** Publish templates | T-F14-03, T-F14-04 | TODO |
| **FR-G3** Vertical packs | T-F14-05, T-F14-06 | TODO |
| **NFR-Perf** API latency | T-F04-02 (infra) + load test | TODO |
| **NFR-Perf** Canvas FPS | T-F05-01 | TODO |
| **NFR-Perf** Sandbox cold start | T-F06-13, T-F06-14 | TODO |
| **NFR-Sec** Encryption at rest/transit | T-F03-01, T-F01-03 | TODO |
| **NFR-Sec** Secret storage | T-F01-06, T-F01-07, T-F01-08 | TODO |
| **NFR-Sec** Sandbox isolation | T-F15-08 | TODO |
| **NFR-Comply** SOC 2 | T-F15-07 | TODO |
| **NFR-Comply** GDPR/CCPA/PDPL | T-F15-04, T-F15-05 | TODO |
| **NFR-Comply** SBOM | T-F15-06 | TODO |
| **NFR-Usability** WCAG 2.1 AA | T-F05-18, T-F05-19, T-F05-20 | TODO |
| **NFR-Usability** RTL | T-F05-20 | TODO |
| **Edge Case EC-9** Approval SLA expiry | T-F12-06 | TODO |
| **Edge Case EC-14** Cost cap mid-run | T-F06-10 | TODO |
| **Edge Case EC-15** Heal infinite loop | T-F10-04 | TODO |
| **Edge Case EC-17** Piece deprecated | T-F13-07 | TODO |
| **Edge Case EC-21** Prompt injection | T-F12-10 | TODO |
| **Edge Case EC-22** Secret in logs | T-F15-03 | TODO |
| **Edge Case EC-24** OAuth revoke mid-run | T-F13-06 | TODO |

---

## 5. Phased Execution Plan

### Execution Phase 1 — Foundations (Months 1–2) `[Milestone M0]`

**Goal:** Infrastructure, data, auth, and core API operational. All subsequent features can build on this.

**Tasks (28 tasks):**
- F01: T-F01-01 through T-F01-19 (all infra, observability, CI/CD)
- F03: T-F03-01 through T-F03-11 (all schema, storage, cache)
- F02: T-F02-01 through T-F02-10 (all identity, auth, tenancy)
- F04: T-F04-01 through T-F04-04 (gateway config)

**Phase Exit Criteria:**
- [ ] Kubernetes cluster operational with mTLS mesh
- [ ] PostgreSQL schema applied; CRUD verified
- [ ] Auth flows working (email, OAuth, RBAC)
- [ ] Observability stack live (metrics, traces, logs)
- [ ] CI/CD pipeline green with SBOM
- [ ] Vault operational; secrets injectable

---

### Execution Phase 2 — Core Platform (Months 3–5) `[Milestones M1, M2, M3]`

**Goal:** Designer MVP, workflow engine, AI planner, CUA basics, and core APIs.

**Tasks (57 tasks):**
- F04: T-F04-05 through T-F04-14 (resource APIs)
- F05: T-F05-01 through T-F05-15 (designer core + AI authoring)
- F06: T-F06-01 through T-F06-10 (engine core + scheduling + cost)
- F07: T-F07-01 through T-F07-09 (planner + RAG)
- F08: T-F08-01 through T-F08-09 (CUA + vision)
- F09: T-F09-01 through T-F09-05 (orchestrator + LangGraph)

**Phase Exit Criteria:**
- [ ] 5-node workflow composable, runnable, and observable
- [ ] Hybrid execution (DOM + Vision) choosing correct engine
- [ ] NL → workflow ≥ 60% first-try success on benchmark
- [ ] CUA sandbox operational on Linux/macOS
- [ ] Eval harness running nightly

---

### Execution Phase 3 — Self-Healing & Governance (Months 6–8) `[Milestones M4, M5, M6]`

**Goal:** Self-healing engine, governance layer, approval center. Closed beta launch.

**Tasks (35 tasks):**
- F10: T-F10-01 through T-F10-07 (self-healing)
- F12: T-F12-01 through T-F12-10 (policy, approvals, audit, edge cases)
- F06: T-F06-11 through T-F06-15 (workers, sandboxes, Activepieces)
- F13: T-F13-01 through T-F13-08 (integrations)
- F05: T-F05-16 through T-F05-20 (collab, accessibility)
- F07: T-F07-10, T-F07-11 (eval harness, promotion gate)

**Phase Exit Criteria:**
- [ ] Self-heal rate ≥ 70% on synthetic UI-change tests
- [ ] Policy gates operational at design/deploy/run time
- [ ] Approval Center functional with SLA routing
- [ ] 20 design partners onboarded
- [ ] Activepieces connector runtime operational
- [ ] Chaos test passed

---

### Execution Phase 4 — Marketplace & Observability (Months 9–11) `[Milestones M7, M8, M9]`

**Goal:** Marketplace, analytics dashboards, OSS core release.

**Tasks (22 tasks):**
- F14: T-F14-01 through T-F14-06 (marketplace, vertical packs)
- F11: T-F11-01 through T-F11-08 (dashboards, anomaly detection, feedback)
- F15: T-F15-01 through T-F15-08 (security hardening, compliance)

**Phase Exit Criteria:**
- [ ] Marketplace live: publish, browse, install
- [ ] Per-workflow analytics dashboard operational
- [ ] Anomaly detection alerting on baselines
- [ ] OSS core on GitHub under Apache 2.0
- [ ] Cardinality budgets enforced

---

### Execution Phase 5 — GA Production (Month 12) `[Milestone M10]`

**Goal:** All P0 NFRs met. SOC 2 Type I. SLA published.

**Tasks (12 tasks):**
- F16: T-F16-01 through T-F16-12 (environments, rollback, SRE, chaos, DR, DORA)

**Phase Exit Criteria:**
- [ ] All P0 functional requirements complete and tested
- [ ] All P0 NFRs met (latency, FPS, sandbox start, SLA)
- [ ] SOC 2 Type I attestation obtained
- [ ] DORA metrics at GA targets (deploy freq ≥ daily, MTTR ≤ 60 min)
- [ ] DR drill completed successfully
- [ ] SLA published; on-call rotation active

---

### Execution Phase 6 — Enterprise & Beyond (Months 13–18) `[Milestones M11, M12]`

**Goal:** SSO/on-prem, multi-agent, mobile. Post-GA.

**Tasks (deferred — defined at Phase 5 completion):**
- SAML SSO deployment → T-F02-03 (done in foundation but activated here)
- On-premises installer (air-gapped)
- Multi-agent swarm via LangGraph
- Mobile CUA sandbox support
- Advanced FinOps dashboards
- Vertical pack expansion
- Voice-guided authoring (P2)

---

## 6. Definition of Done

### Task-Level DoD
- [ ] Implementation matches PRD acceptance criteria
- [ ] Unit tests pass with ≥ 80% coverage on new code
- [ ] Edge case tests written and passing
- [ ] Failure scenario tests written and passing
- [ ] Code reviewed and APPROVED
- [ ] OTel instrumentation emitting traces + metrics
- [ ] Audit log entries emitted where applicable
- [ ] Feature flagged where applicable

### Feature-Level DoD
- [ ] All child tasks COMPLETED
- [ ] Integration tests pass between components
- [ ] Acceptance criteria from PRD verified end-to-end
- [ ] Accessibility check passed (WCAG 2.1 AA)
- [ ] Security review completed for new data flows
- [ ] Documentation updated (user guide + API reference)
- [ ] Runbook entry created for operational tasks

### System-Level DoD (per Phase)
- [ ] All features in phase integrated
- [ ] Performance validated against NFR targets
- [ ] No critical or high-severity defects open
- [ ] Load test passed at target concurrency
- [ ] Eval harness green (for AI-related phases)

---

## 7. Validation & QA Checklist

### Per-Task QA

| Check | Requirement |
|---|---|
| Unit tests | ≥ 80% coverage on touched code; all pass |
| Edge case tests | PRD edge cases (§27) covered where applicable |
| Failure scenario tests | Network failure, timeout, auth failure, concurrent access |
| Regression tests | No existing tests broken |
| Contract tests | API contracts match OpenAPI spec |
| Security scan | No new critical/high CVEs introduced |
| Performance | No p95 latency regression > 10% |

### Per-Phase QA

| Check | Requirement |
|---|---|
| Integration suite | All inter-service flows green |
| Load test | Phase capacity target met (growing per phase) |
| Chaos test | System degrades gracefully under injected failure |
| AI eval suite | Planner + CUA benchmarks meet phase threshold |
| Accessibility audit | WCAG 2.1 AA for new surfaces |
| Penetration test | No new exploitable vulnerabilities (annual + on major releases) |

---

## 8. Nothing Missing Checklist

- [x] All PRD functional requirements (FR-A through FR-G) mapped to tasks
- [x] All PRD non-functional requirements (NFR) mapped to tasks
- [x] All PRD edge cases (EC-9, EC-14, EC-15, EC-17, EC-21, EC-22, EC-24) mapped
- [x] All dependencies resolved (dependency graph acyclic)
- [x] All external dependencies (OSS, cloud, providers) identified with risk + mitigation
- [x] All DORA metrics tracked
- [x] All data entities have schema migrations
- [x] All API endpoints have implementation tasks
- [x] All personas have journey coverage (verified against §12 of PRD)
- [x] All compliance requirements have task ownership
- [x] SBOM, image signing, supply chain integrity addressed

---

# PHASE 3 — STATEFUL EXECUTION SYSTEM

## STATE BLOCK

```
=== AAOP EXECUTION STATE ===

CURRENT_PHASE:        1 — Foundations
TOTAL_TASKS:          187
COMPLETED_TASKS:      0
IN_PROGRESS:          0
TEST_PENDING:         0
REVIEW_PENDING:       0
BLOCKED:              0
TODO:                 187

ACTIVE_TASK:          None
LAST_COMPLETED:       None

PHASE_STATUS:
  Phase 1 (Foundations):     NOT_STARTED  [0/28 tasks]
  Phase 2 (Core Platform):  LOCKED       [0/57 tasks]
  Phase 3 (Self-Healing):   LOCKED       [0/35 tasks]
  Phase 4 (Marketplace):    LOCKED       [0/22 tasks]
  Phase 5 (GA Production):  LOCKED       [0/12 tasks]
  Phase 6 (Enterprise):     LOCKED       [0/33 tasks]

AUDIT_LOG:
  (empty)

=== END STATE ===
```

---

## COMMAND INTERFACE

| Command | Behavior |
|---|---|
| `Start` | Begin first available task (T-F01-01) |
| `Next` | Move to next available task (respecting dependencies) |
| `Done: T-FXXX-NN` | Mark task implementation complete → move to TEST_PENDING |
| `Test: T-FXXX-NN` | Generate + execute tests → PASS moves to REVIEW_PENDING; FAIL returns to IN_PROGRESS |
| `Review: T-FXXX-NN` | Strict code review → APPROVED moves to COMPLETED; CHANGES_REQUIRED returns to IN_PROGRESS |
| `Status` | Display full STATE BLOCK |
| `Phase Audit` | Run Phase Audit System for current phase |
| `Skip-to: Phase N` | Jump to phase N (only if all prior phases PASSED audit) |

---

## EXECUTION RULES

1. **NEVER** skip tasks.
2. **NEVER** merge tasks.
3. **NEVER** assume missing information — STOP and ask.
4. **ALWAYS** enforce dependency ordering.
5. **ALWAYS** update STATE BLOCK after every action.
6. **ALWAYS** generate tests before marking DONE.
7. **ALWAYS** require review before COMPLETED.
8. **NEVER** unlock next phase without phase audit PASS.

---

# PHASE 4 — TASK EXECUTION MODE

## Step 1 — Implementation

For each task, output:
- Task ID
- Description
- Implementation steps (ordered)
- Code / config artifacts
- Expected output / behavior
- Transition: → `TEST_PENDING`

## Step 2 — Automated Test Generation (mandatory)

For each task, generate:

| Test Name | Purpose | Input | Expected Result |
|---|---|---|---|
| `test_<task>_happy_path` | Verify primary flow | Valid input | Expected output |
| `test_<task>_edge_case_<N>` | Verify boundary condition | Edge input | Handled correctly |
| `test_<task>_failure_<N>` | Verify failure mode | Invalid / error input | Graceful degradation |

After generation: → `TEST_PENDING`

## Step 3 — Test Execution

Simulate or describe test results.
- **All pass** → `REVIEW_PENDING`
- **Any fail** → return to `IN_PROGRESS` with failure details

## Step 4 — Review Step

Act as strict code reviewer. Validate:
- Correctness (matches PRD acceptance criteria)
- Security (no secrets leaked, injection-safe, least privilege)
- Edge case coverage
- Maintainability (clear names, minimal complexity, documented)
- OTel instrumentation present
- Audit log events emitted

Output:
- Issues found (if any)
- Suggested fixes (if any)
- Decision: **APPROVED** or **CHANGES_REQUIRED**

If APPROVED → `COMPLETED` and added to completed task log.

---

# PHASE 5 — PHASE AUDIT SYSTEM

At the end of each execution phase, the following audit runs:

## Audit Checklist

- [ ] All tasks in phase have status COMPLETED
- [ ] All unit/integration/edge/failure tests PASSED
- [ ] All tasks REVIEWED and APPROVED
- [ ] No BLOCKED tasks remain
- [ ] PRD coverage matrix shows all phase requirements covered
- [ ] No critical defects open
- [ ] Performance targets met for phase scope
- [ ] DORA metrics within target range (Phases 2+)
- [ ] Security scan clean for phase artifacts

## Audit Output

```
=== PHASE AUDIT: Phase N ===
Status:           PASS / FAIL
Tasks completed:  X / Y
Tests passed:     X / Y
Reviews approved: X / Y
Gaps found:       (list or "None")
Risks identified: (list or "None")
Required fixes:   (list or "None")
=== END AUDIT ===
```

## Rules
- If **FAIL** → fix all issues before unlocking next phase.
- If **PASS** → increment CURRENT_PHASE; unlock next phase.

---

# PHASE 6 — ANTI-FAILURE GUARANTEES

| Guarantee | Mechanism |
|---|---|
| Full PRD traceability | Every FR/NFR/EC mapped to ≥ 1 task in Coverage Matrix |
| No skipped work | Dependency graph enforced; STATE BLOCK tracks every task |
| Tests mandatory | Every task requires unit + edge + failure tests before review |
| Review mandatory | Every task requires code review with APPROVED before completion |
| Phase gates | Phase Audit must PASS before next phase unlocks |
| Progress tracking | STATE BLOCK updated after every command; full audit log maintained |
| Rollback safety | Feature flags on every new feature; blue/green for infra |
| Compliance evidence | SBOM, audit logs, SOC 2 evidence collection automated |

---

# APPENDIX A — Critical Path Dependency Graph

```
Phase 1 (Foundations)
  T-F01-01 (K8s cluster)
    ├→ T-F01-02 (VPC)
    ├→ T-F01-03 (Istio)
    ├→ T-F01-06 (Vault)
    │    └→ T-F01-07 (Workload identity)
    │         └→ T-F01-08 (Secret injection lib)
    ├→ T-F01-09 (OTel Collector)
    │    ├→ T-F01-10 (Prometheus/Grafana)
    │    ├→ T-F01-11 (Loki)
    │    ├→ T-F01-12 (Tempo)
    │    └→ T-F01-13 (OTel instrumentation lib)
    ├→ T-F01-14 (Redis)
    │    └→ T-F01-15 (Event bus lib)
    ├→ T-F01-16 (CI pipeline)
    │    └→ T-F01-19 (SBOM)
    └→ T-F01-17 (ArgoCD)
         └→ T-F01-18 (Progressive rollout)

  T-F03-01 (PostgreSQL) ─ parallel to T-F01-01
    └→ T-F03-02 through T-F03-11 (Schema + storage + cache)

  T-F02-01 (Auth) ← T-F03-01, T-F01-01
    └→ T-F02-02 through T-F02-10

  T-F04-01 through T-F04-04 (Gateway) ← T-F02-01, T-F01-04

Phase 2 (Core Platform) ← Phase 1 PASSED
  T-F04-05 through T-F04-14 (APIs) ← T-F04-01
  T-F05-01 through T-F05-15 (Designer) ← T-F04-05
  T-F06-01 through T-F06-10 (Engine) ← T-F01-15, T-F03-02
  T-F07-01 through T-F07-09 (Planner) ← T-F03-02, T-F01-08
  T-F08-01 through T-F08-09 (CUA) ← T-F01-01
  T-F09-01 through T-F09-05 (Orchestrator) ← T-F06-01, T-F08-04

Phase 3 (Self-Healing + Governance) ← Phase 2 PASSED
  T-F10-01 through T-F10-07 ← T-F06-01, T-F08-06
  T-F12-01 through T-F12-10 ← T-F03-07, T-F09-03
  T-F06-11 through T-F06-15 ← T-F06-01, T-F13-01
  T-F13-01 through T-F13-08 ← T-F01-01, T-F06-01

Phase 4 (Marketplace + Observability) ← Phase 3 PASSED
  T-F14-01 through T-F14-06 ← T-F04-05
  T-F11-01 through T-F11-08 ← T-F04-08, T-F01-10
  T-F15-01 through T-F15-08 ← T-F01-01

Phase 5 (GA) ← Phase 4 PASSED
  T-F16-01 through T-F16-12 ← all prior phases
```

---

# APPENDIX B — Task Count Summary

| Feature | Sub-features | Tasks | Phase |
|---|---|---|---|
| F01 Foundation & Infra | 5 | 19 | 1 |
| F02 Identity & Auth | 3 | 10 | 1 |
| F03 Data Layer | 4 | 11 | 1 |
| F04 API Gateway | 3 | 14 | 1–2 |
| F05 Visual Designer | 6 | 20 | 2–3 |
| F06 Workflow Engine | 6 | 15 | 2–3 |
| F07 AI Planner | 4 | 11 | 2–3 |
| F08 CUA & Vision | 4 | 9 | 2 |
| F09 Execution Orchestrator | 3 | 5 | 2 |
| F10 Self-Healing | 3 | 7 | 3 |
| F11 Observability | 4 | 8 | 4 |
| F12 Governance & Policy | 4 | 10 | 3 |
| F13 Integration Architecture | 4 | 8 | 3 |
| F14 Marketplace | 3 | 6 | 4 |
| F15 Security & Compliance | 4 | 8 | 4 |
| F16 DevOps & SRE | 5 | 12 | 5 |
| **TOTAL** | **65** | **173** | — |

> Note: 14 additional tasks are deferred to Phase 6 (Enterprise), bringing the total addressable to 187.

---

# HOW TO USE

1. This document is the execution contract. Every task is traceable to a PRD requirement.
2. Issue `Start` to begin with T-F01-01.
3. Progress through each task using `Done`, `Test`, `Review`.
4. At each phase boundary, run `Phase Audit` before proceeding.
5. The STATE BLOCK is the single source of truth for project status.

---

**End of Implementation Plan — v1.0**

> *This plan is a living document maintained alongside the PRD. Changes require task re-mapping and coverage matrix update.*
