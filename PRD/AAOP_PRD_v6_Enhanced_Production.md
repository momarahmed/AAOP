# 🚀 AI Agent Orchestration Platform (AAOP)
## Enhanced Product Requirements Document — v6.0 (Enterprise Edition)

| Field | Value |
|---|---|
| **Document Type** | Product Requirements Document (Enhanced) |
| **Product** | AI Agent Orchestration Platform (AAOP) |
| **Version** | 6.0 |
| **Supersedes** | v5.0 (Strategic Production PRD, May 2026) |
| **Status** | Engineering-Ready |
| **Owner** | Product, Engineering, Architecture, Security |
| **Reviewers** | CTO, VP Eng, VP Product, CISO, Head of Design, Head of GTM |
| **Last Updated** | May 2026 |
| **Classification** | Internal — Confidential |
| **Audience** | CTO, Engineering Leads, Architects, Designers, GTM, Security, Compliance |

---

## 📑 Table of Contents

### PART I — Strategic Analysis & Enhancement Report
1. [Executive Summary of Improvements](#1-executive-summary-of-improvements)
2. [Critical Gap Analysis](#2-critical-gap-analysis)
3. [Recommended Enhancements — Feature × Impact × Priority](#3-recommended-enhancements)
4. [Future Technology Roadmap (Short-term vs Long-term)](#4-future-technology-roadmap)
5. [Strategic Opportunities for Competitive Advantage](#5-strategic-opportunities-for-competitive-advantage)

### PART II — Enhanced Product Requirements
6. [Executive Summary `[Improved]`](#6-executive-summary)
7. [Vision, Mission & Guiding Principles](#7-vision-mission--guiding-principles)
8. [Problem Statement & Market Context](#8-problem-statement--market-context)
9. [Market Analysis & Competitive Positioning](#9-market-analysis--competitive-positioning)
10. [Stakeholders & RACI Matrix `[Added]`](#10-stakeholders--raci-matrix)
11. [User Personas & Jobs-to-be-Done `[Improved]`](#11-user-personas--jobs-to-be-done)
12. [User Journeys & Flows `[Added]`](#12-user-journeys--flows)
13. [SMART Goals, Objectives & Success Metrics `[Improved]`](#13-smart-goals-objectives--success-metrics)
14. [Product Scope](#14-product-scope)
15. [System Architecture](#15-system-architecture)
16. [Core Component Specifications](#16-core-component-specifications)
17. [Functional Requirements & User Stories with Acceptance Criteria `[Improved]`](#17-functional-requirements--user-stories)
18. [Non-Functional Requirements](#18-non-functional-requirements)
19. [Data Model & Storage](#19-data-model--storage)
20. [API Specifications & Contracts `[Improved]`](#20-api-specifications--contracts)
21. [AI / ML Strategy](#21-ai--ml-strategy)
22. [Security, Privacy & Compliance](#22-security-privacy--compliance)
23. [Performance & Scalability](#23-performance--scalability)
24. [UX / UI Requirements & Component Library `[Improved]`](#24-ux--ui-requirements)
25. [Integration Architecture](#25-integration-architecture)
26. [DevOps, Cloud-Native & SRE Strategy `[Improved]`](#26-devops-cloud-native--sre-strategy)
27. [Edge Cases & Error Handling `[Added]`](#27-edge-cases--error-handling)
28. [Testing & Quality Strategy](#28-testing--quality-strategy)
29. [Dependencies — Internal & External `[Added]`](#29-dependencies)
30. [Risk Analysis & Mitigation](#30-risk-analysis--mitigation)
31. [Release Plan & Milestones (with DORA) `[Improved]`](#31-release-plan--milestones)
32. [Team Structure & Resourcing](#32-team-structure--resourcing)
33. [Budget & Cost Considerations](#33-budget--cost-considerations)
34. [Open Source Governance & Community](#34-open-source-governance--community)
35. [Open Questions](#35-open-questions)
36. [Glossary](#36-glossary)
37. [Appendices](#37-appendices)

---

# PART I — Strategic Analysis & Enhancement Report

# 1. Executive Summary of Improvements

This v6.0 document is a **structural and strategic uplift** of v5.0, designed to move AAOP from a strong vision document to an **engineering-ready, enterprise-grade PRD** that can be executed against by 25+ engineers, design partners, and external auditors without ambiguity.

**The five highest-leverage uplifts in v6.0:**

1. **From requirements to contracts.** Functional requirements are rewritten as user stories with explicit Given/When/Then acceptance criteria, making them directly testable and reducing requirement-to-defect leakage.
2. **From features to journeys.** Five end-to-end persona journeys (Operator, Engineer, Admin, Compliance, Builder) connect personas to product surfaces and reveal previously hidden friction points (e.g., the missing "first heal review" loop for compliance leads).
3. **From SLOs to DORA.** Engineering goals now include explicit DORA metrics (deployment frequency, lead time for change, MTTR, change failure rate) alongside product KPIs, aligning platform velocity with business outcomes.
4. **From "K8s + Terraform" to a cloud-native operating posture.** The DevOps section now specifies WAF policies, IAM boundary patterns, secrets brokering, observability cardinality budgets, progressive delivery topology, and a concrete rollback playbook — what teams will actually build, not just the tools they will use.
5. **From "trust me" to "show your work."** New sections on Edge Cases & Error Handling, Stakeholder RACI, and Dependencies make hidden assumptions explicit and enable security review, change management, and cross-team planning.

**Strategic posture (unchanged but sharpened):** AAOP is the **trusted autonomous work platform** — the system of record for production AI workflows that span DOM, vision, OS, API, and human approvals. Its moat is not features; it is the **operational data flywheel** of executions, heals, and policy outcomes, made defensible by enterprise governance and vertical accelerators.

---

# 2. Critical Gap Analysis

The v5.0 PRD is strong on vision and architecture but contains seven categories of gap that v6.0 closes:

| # | Gap | Why It Matters | v6.0 Resolution |
|---|---|---|---|
| **G1** | **Untestable requirements.** FRs are stated as capabilities ("System supports parallel branches") with no acceptance criteria, leaving QA and engineering to infer behavior. | Specification ambiguity is the dominant root cause of late-stage scope drift in platform products. | All P0/P1 FRs converted to user stories with Given/When/Then acceptance criteria (Section 17). |
| **G2** | **No user journeys.** Personas exist but are never connected to flows, surfaces, or moments of truth. | Without journeys, designers and PMs over-index on features and miss adoption blockers. | Five end-to-end journeys added (Section 12) covering authoring, runtime, governance, compliance review, and ecosystem distribution. |
| **G3** | **DevOps is named, not specified.** "Kubernetes, Terraform, OpenTelemetry" are listed as tools but the operating model — WAF rules, IAM trust boundaries, secrets brokering, rollback timing, cardinality budgets — is missing. | Cloud-native readiness is a procurement gate for enterprise buyers; vague DevOps language fails security review. | Section 26 rewritten with concrete patterns, manifest snippets, and a rollback playbook. |
| **G4** | **No edge case or error catalog.** v5 mentions "self-healing" but never enumerates the failure modes (network partitions, sandbox exhaustion, partial OAuth failures, clock skew, vision model disagreement). | Edge cases are where production trust is won or lost. | Section 27 added with 25+ enumerated failure modes mapped to recovery strategies and user-visible behavior. |
| **G5** | **Missing DORA & engineering health metrics.** Product KPIs are well-defined but engineering velocity and reliability are not. | DORA correlates strongly with both engineering retention and customer-perceived quality. | DORA targets added to Section 13; release plan in Section 31 includes engineering health gates. |
| **G6** | **Stakeholder model is implicit.** No RACI, no dependency map, no clear ownership of cross-cutting concerns (AI evals, policy, FinOps). | Cross-functional features stall when ownership is unclear. | RACI matrix added in Section 10; dependency map in Section 29. |
| **G7** | **Monetization-to-value is loosely connected.** Pricing tiers exist but the link from feature → quantified value → tier is implicit. | Without a value-tier link, sales motion fragments and pricing erodes. | Tier construction logic added in Section 33 with feature-to-tier rationale. |

**Additional weaker assumptions corrected:**
- "Open-source components reduce risk" — corrected to "open-source components require active stewardship to reduce risk" (Section 34).
- "Local-first is a marketing differentiator" — refined to "local-first is a procurement differentiator in regulated and sovereign markets" (Section 9).
- "AI eval suite of 200 workflows" — clarified into a tiered eval taxonomy (regression, capability, safety, drift) in Section 28.

---

# 3. Recommended Enhancements

Each enhancement is scored on **Impact** (revenue, retention, defensibility) and **Priority** (P0 = launch-blocking, P1 = launch-important, P2 = post-GA). Effort estimates are coarse (S/M/L/XL).

| # | Enhancement | Surface Area | Impact | Effort | Priority |
|---|---|---|---|---|---|
| E1 | Visual designer linked to runtime, policy, and deployment state | Builder, Engine, Policy | Adoption + enterprise trust | XL | **P0** |
| E2 | Acceptance-criteria-driven FR catalog (GWT format) | All eng surfaces | Defect reduction, faster QA | M | **P0** |
| E3 | Predictive workflow health scoring + anomaly detection | Observability, Planner | Defensible execution intelligence | L | **P0** |
| E4 | Policy-as-code engine with environment promotion gates | Control plane | Enterprise procurement gate | L | **P0** |
| E5 | Approval Center with SLA routing, exception queues, audit context | New surface | Regulated use case unlock | M | **P0** |
| E6 | Rollback playbook (≤2min RTO) + blue/green orchestration | Platform, SRE | Production trust | M | **P0** |
| E7 | DORA dashboards + engineering health gates in CI | Platform | Velocity + quality | S | **P1** |
| E8 | AI authoring copilot (NL → workflow, debug, optimize) | Builder, Planner | Time-to-value | L | **P1** |
| E9 | FinOps dashboards with model routing optimization | Platform, AI | Margin protection | M | **P1** |
| E10 | Vertical solution packs (Finance, HR, Public Sector, Healthcare) | Marketplace, GTM | Faster GTM, deal size uplift | L | **P1** |
| E11 | Privacy-preserving telemetry pipeline with PII scrubber tiers | Data layer | Compliance gate (PDPL/GDPR) | M | **P1** |
| E12 | Connector reliability score + dependency drift alerts | Integration runtime | Reduces P1 incidents | S | **P1** |
| E13 | Simulation lab — sandboxed replay for change scenarios | Engine, CUA | Long-term differentiation | XL | **P2** |
| E14 | Voice-guided workflow authoring + multimodal command surface | Builder | Accessibility + future UX | L | **P2** |
| E15 | Multi-agent execution cells with role-based delegation | Planner, Engine | Complex ops unlock | XL | **P2** |
| E16 | Sovereign deployment mode (KSA, EU, customer-VPC) | Platform, Compliance | Regulated/public-sector wins | L | **P2** |
| E17 | Federated cross-tenant pattern learning (opt-in, DP-protected) | AI, Data | Network effect, compliant | XL | **P2** |
| E18 | Industry trust layer (compliance evidence packs, audit exports) | Compliance | Buyer enablement | M | **P2** |

---

# 4. Future Technology Roadmap

### 4.1 Short-Term (0–12 months) — Operationalize the Core

| Track | Capability | Outcome |
|---|---|---|
| **AI Routing** | Adaptive model routing using latency, cost, confidence, and policy signals | 30%+ inference cost reduction at parity quality |
| **Predictive Ops** | Workflow health scoring; anomaly detection on run telemetry | MTTI ≤ 5 min, fewer silent regressions |
| **Real-Time Fabric** | Event streaming + WebSocket dashboards across runs and approvals | Live operational visibility for ops + compliance |
| **AI Authoring** | NL → graph generation, demonstration capture, AI debug suggestions | Authoring time ≤ 10 min for 10-step flow |
| **Policy Guardrails** | Designer-time policy linting, deploy-time policy gates, runtime enforcement | Zero unsafe deploys; auditable policy evidence |
| **Self-Healing v2** | Healenium + vision + LLM replan ensemble with confidence-weighted strategy | Heal rate ≥ 85% on benchmark |

### 4.2 Long-Term (12–36 months) — Build the Defensible Platform

| Track | Capability | Outcome |
|---|---|---|
| **Multimodal Authoring** | Voice + demonstration + screenshot → workflow capture | Expanded persona reach, accessibility uplift |
| **Multi-Agent Cells** | LangGraph-based agent swarms with delegation, critique, and exception handling | Complex enterprise orchestration unlocked |
| **Simulation Lab** | Digital twin sandbox replay; pre-deployment change-impact scoring | Trust-gated rollouts, regression suite for UI drift |
| **Federated Learning** | Differential-privacy aggregation of heal/optimization patterns across tenants (opt-in) | Cross-customer intelligence without data movement |
| **Sovereign + Spatial Ops** | KSA / EU / customer-VPC deployments; XR-based command center for high-complexity ops | Regulated and public-sector wins |
| **Agent-to-Agent Protocols** | A2A / MCP-derived contracts for inter-platform agent collaboration | Ecosystem positioning beyond standalone product |

### 4.3 Technology Bets to Track

- **Anthropic / OpenAI computer-use APIs** — converge or differentiate against trycua/cua.
- **MCP standardization** — likely tool-and-OS interface winner; deepen integration.
- **On-device VLM acceleration** (Apple Silicon, Snapdragon X, NVIDIA RTX) — strengthens local-first posture.
- **EU AI Act + KSA PDPL operationalization** — mandates evidence packs and algorithmic transparency.
- **Browser-side automation APIs** (Chrome DevTools-based) — could disrupt Playwright dominance.

---

# 5. Strategic Opportunities for Competitive Advantage

| # | Opportunity | Defensibility Mechanism |
|---|---|---|
| **S1** | **Trusted autonomous operations as a category** — own a name beyond "RPA" or "agents" | Brand + buyer education |
| **S2** | **Execution intelligence flywheel** — heal data, optimization signals, success patterns compound | Data network effects, proprietary corpora |
| **S3** | **Vertical accelerators** in finance, public sector, healthcare, regulated ops | Domain templates + compliance evidence + partner channels |
| **S4** | **Policy-and-approval-native UX** — make "safe by default" easier than "risky" | UX moat reinforced by switching cost |
| **S5** | **Sovereign / on-prem optionality** — KSA, EU, customer-VPC deployments | Procurement gate competitors won't easily clear |
| **S6** | **Open-core distribution** — community adoption funnels into commercial governance | Two-tier go-to-market |
| **S7** | **Workflow marketplace + partner program** — ISVs and SIs ship vertical packs | Ecosystem leverage; revenue share |
| **S8** | **Local-first by default** — privacy stance is also a cost stance and a differentiator | Architectural posture; hard to retrofit by competitors |

**Anti-patterns to avoid:**
- Competing as a "better RPA" — concedes the category to incumbents.
- Open-sourcing differentiating execution intelligence — undermines the moat.
- Pricing on seats only — leaves usage value uncaptured and misaligns with operator economics.
- Underinvesting in approvals/policy — turns away enterprise budget owners.

---

---

# PART II — Enhanced Product Requirements

# 6. Executive Summary
> `[Improved]` — sharpened thesis, explicit value claims, removed generic phrasing.

The **AI Agent Orchestration Platform (AAOP)** is a production-grade, AI-native automation operating system for designing, executing, governing, and continuously optimizing intelligent workflows that span web applications, desktop software, operating systems, documents, APIs, and human approval steps.

AAOP is differentiated by combining **five capabilities in a single system of record**:

1. **Intent-to-Workflow Reasoning** — hybrid local/cloud planners convert goals into executable graphs with policy-aware recommendations.
2. **Visual No-Code Authoring** — a production canvas linked to runtime, policy, secrets, environments, and observability.
3. **Hybrid Execution Routing** — DOM, vision, OS, connector runtime, API, and human-in-the-loop, chosen per step.
4. **Self-Healing & Runtime Adaptation** — UI drift detection, action re-routing, replanning, and continuous learning.
5. **Enterprise Governance & Intelligence** — observability, approvals, audit, policy-as-code, and predictive optimization built into the operating model.

**Quantified target outcomes (12 months post-GA):**
- ≥ 70% reduction in automation maintenance effort versus legacy RPA baselines (measured against design-partner cohorts).
- ≥ 95% workflow execution success rate; ≥ 85% self-healing recovery rate.
- ≤ 10 minutes median authoring time for a standard 10-step workflow.
- 70%+ gross margin via local-first model routing and CUA sandbox pooling.

**Strategic posture:** AAOP is built on an open, modular architecture (trycua/cua, LangGraph, LlamaIndex, Activepieces, Dify, Healenium). The defensible advantage is not these components; it is the **production architecture, policy model, orchestration intelligence, and execution data flywheel** built around them.

---

# 7. Vision, Mission & Guiding Principles

### 🎯 Vision
> *"To become the trusted autonomous work platform that allows organizations to design, govern, and continuously improve resilient AI-driven workflows across every digital surface."*

### 🚀 Mission
Build a production-grade, AI-native automation platform that:
- Enables users to create automation visually and operate it confidently in production.
- Unifies AI planning, hybrid execution, self-healing, and human oversight in one system.
- Makes automation safe, observable, explainable, and extensible for enterprise use.
- Compounds customer value through execution intelligence, reusable assets, and domain accelerators.

### 🧭 Guiding Principles
1. **Production-first.** Every artifact must be deployable, governable, and observable.
2. **Intent over scripting.** Users define goals and policies; the platform handles operational complexity.
3. **Visual by default, code when needed.** No-code is the main path; advanced extensibility remains available.
4. **Trust through control.** Approvals, policy enforcement, audit, and explainability are built in.
5. **Hybrid execution wins.** Resilient automation requires DOM, vision, OS, API, and human steps under one orchestrator.
6. **Learning systems create advantage.** Each run improves future reliability, recommendations, and efficiency.
7. **Open and composable.** Core components are replaceable, extensible, and deployable across customer environments.

---

# 8. Problem Statement & Market Context

Modern operations are no longer linear or API-complete. Critical work spans SaaS platforms, legacy web portals, desktop applications, documents, spreadsheets, operating systems, and human approvals. Existing platforms solve only fragments of this reality.

### 8.1 Pain Points

| Category | Problem | Impact |
|---|---|---|
| Traditional RPA | High implementation cost, brittle selectors, specialized staffing, weak adaptability | Slow ROI, heavy maintenance, low organizational adoption |
| API Automation | Strong for structured integrations but weak for UI-driven or legacy systems | Large portions of business work remain unautomated |
| Agent Frameworks | Powerful for developers but disconnected from enterprise runtime operations | Poor usability, low governance, limited business-user adoption |
| Standalone CUA | Impressive demos but limited workflow persistence, governance, reliability controls | Insufficient for production operations |
| Low-Code Builders | Easy to start; weak in observability, policy, lifecycle, and adaptive execution | Teams outgrow them when automation becomes mission-critical |

### 8.2 Root Causes
- Most automation tools optimize **task execution**, not **operational resilience**.
- Workflow design, execution, approvals, and observability are fragmented across tools.
- No dominant platform unifies visual no-code, agentic reasoning, hybrid execution, and enterprise governance.
- No-code systems are disconnected from runtime concerns; users design but cannot govern or scale safely.
- Current tools do not learn from failures, drift, user feedback, or business outcomes.

### 8.3 User Needs (Met / Latent / Future)

**Met by AAOP at GA:** No-code production deployment; enterprise governance; resilience across legacy systems; faster troubleshooting; safe rollout controls.

**Latent (often unstated):** Guidance on what to automate first; trust signals (safe, healthy, cost-effective); optimization recommendations; clear separation of experimentation, staging, production.

**Future-prepared:** Multimodal authoring (text, voice, demonstration); shared organizational workflow memory; fine-grained AI governance and sovereign deployment; simulation environments.

### 8.4 Why Now
- LLMs and multimodal models have crossed practical thresholds for planning and UI interpretation.
- Enterprises are moving from AI experimentation to operationalization and governance.
- Browser, OS, and agent tooling ecosystems have matured to support production-grade orchestration.
- Economic pressure is increasing demand for resilient automation with measurable productivity gains.
- The market is open for a category leader combining usability, resilience, and trust.

---

# 9. Market Analysis & Competitive Positioning

### 9.1 Positioning
AAOP is positioned as a **production autonomous operations platform** — not a workflow builder, low-code tool, or developer agent framework. Its strongest market posture is at the intersection of enterprise automation, agentic operations, and resilient execution.

### 9.2 Competitive Matrix

| Dimension | Legacy RPA | API Automation | Agent Frameworks | Standalone CUA | **AAOP** |
|---|---|---|---|---|---|
| No-code workflow design | ⚠️ | ✅ | ❌ | ⚠️ | ✅ |
| Production governance | ✅ | ⚠️ | ❌ | ❌ | ✅ |
| Hybrid DOM + vision + OS execution | ⚠️ | ❌ | ❌ | ✅ | ✅ |
| Self-healing and runtime learning | ⚠️ | ❌ | ⚠️ | ⚠️ | ✅ |
| Enterprise deployment flexibility | ✅ | ✅ | ⚠️ | ⚠️ | ✅ |
| Full lifecycle (design → operations) | ⚠️ | ⚠️ | ❌ | ❌ | ✅ |
| Business-user usability | ⚠️ | ✅ | ❌ | ⚠️ | ✅ |
| Local-first + sovereign options | ❌ | ❌ | ⚠️ | ⚠️ | ✅ |

### 9.3 Durable Differentiators
1. **Application-linked visual workflow design** rather than disconnected diagramming.
2. **Execution intelligence network effects** from accumulated runs, failures, and heals.
3. **Hybrid execution orchestration** across APIs, DOM, vision, OS, and human approvals.
4. **Policy-aware production lifecycle** with review, promotion, rollback, audit, evidence.
5. **Domain accelerators** for industries where brittle UI automation and governance both matter.
6. **Local-first / sovereign** deployment optionality.

### 9.4 Corrected Assumptions
- Feature breadth alone does not create defensibility; reliability, trust, and operational data do.
- OSS components do not automatically reduce enterprise risk; integration and governance do.
- Non-technical adoption requires guardrails, explainability, onboarding, and recoverability — not just a canvas.
- Enterprise buyers will not trust autonomous automation without approvals, policy, and measurable outcomes.

---

# 10. Stakeholders & RACI Matrix
> `[Added]` — explicit ownership and decision rights.

### 10.1 Internal Stakeholders

| Role | Interest | Decision Rights |
|---|---|---|
| CTO / Head of Product | Vision, technical direction | Final arbiter on architecture, OSS strategy |
| VP Engineering | Delivery, velocity, quality | Engineering org structure, release cadence |
| VP Product | Market fit, prioritization | Roadmap, persona prioritization |
| Head of Design | UX quality, accessibility | Design system, IA, journeys |
| CISO | Security posture | Security gates, threat model, compliance |
| Head of GTM | Pricing, packaging, channel | Pricing tiers, partner program |
| Head of Customer Success | Onboarding, retention | Onboarding flow, vertical packs prioritization |
| Open Source Steward | Community, governance | OSS contribution policy, license decisions |

### 10.2 RACI for Major Workstreams

**Legend:** R = Responsible · A = Accountable · C = Consulted · I = Informed

| Workstream | Product | Eng | Design | Security | GTM | OSS |
|---|---|---|---|---|---|---|
| Visual Designer & Authoring UX | A | R | R | C | I | I |
| Workflow Engine & Execution | C | A,R | I | C | I | C |
| AI Planner & Eval Harness | A | R | C | C | I | C |
| CUA Sandbox & Self-Healing | C | A,R | I | C | I | C |
| Approval Center & Policy | A | R | R | A | C | I |
| Observability & FinOps | C | A,R | C | C | I | I |
| Marketplace & Vertical Packs | A | R | C | C | A | C |
| OSS Distribution | C | C | I | C | I | A,R |
| Pricing & Packaging | A | I | I | I | A,R | I |
| Compliance Roadmap (SOC 2, ISO, PDPL) | C | R | I | A,R | C | I |

### 10.3 External Stakeholders
- **Design partners (20)** — beta feedback, reference architectures, evidence for case studies.
- **Vertical alpha customers** — finance, HR, public sector — drive accelerator prioritization.
- **OSS community** — contributors to trycua/cua, LangGraph, LlamaIndex, Activepieces, Healenium.
- **Auditors** — SOC 2, ISO 27001 assessors; PDPL / GDPR DPAs.
- **Channel partners** — SIs, consultants, marketplace builders.

---

# 11. User Personas & Jobs-to-be-Done
> `[Improved]` — added JTBD framing, day-in-the-life context, and friction observations.

### Persona 1 — Operations Designer "Operator Omar" (Primary)

| Attribute | Detail |
|---|---|
| Role | Business operator / ops analyst / process owner |
| Technical fluency | Low–medium; comfortable with spreadsheets, basic SaaS |
| Tools today | Excel, Outlook, Slack, internal portals, point RPA bots |
| **JTBD** | *"When I see a recurring multi-step process eating my team's hours, I want to build a reliable, governed automation visually so my operations scale without re-hiring."* |
| Success criteria | Faster delivery, fewer breakdowns, clear status indicators, AI-assisted authoring |
| Friction today | Existing low-code tools feel toy-like in production; RPA requires specialist team |

### Persona 2 — Automation Engineer "Developer Dana"

| Attribute | Detail |
|---|---|
| Role | Automation developer / solution architect / platform engineer |
| Technical fluency | High — Python, JS, APIs, CI/CD |
| **JTBD** | *"When operators ask for complex automations, I want a platform where I can extend nodes, enforce standards, and guarantee reliability without rebuilding the runtime."* |
| Success criteria | Reusable assets, observability, robust APIs, code extensibility, deployment controls |
| Friction today | RPA is opaque; agent frameworks lack ops; building from scratch is wasteful |

### Persona 3 — Platform Administrator "Enterprise Eva"

| Attribute | Detail |
|---|---|
| Role | Enterprise platform owner / IAM admin / DevOps lead |
| Technical fluency | High — Kubernetes, IAM, IaC |
| **JTBD** | *"When automation goes platform-scale, I need to manage environments, secrets, policy, tenancy, and access without blocking the operators or engineers."* |
| Success criteria | Stable ops, governance, tenancy controls, operational efficiency |

### Persona 4 — Risk & Compliance Lead "Compliance Kareem"

| Attribute | Detail |
|---|---|
| Role | Audit / risk / legal / compliance |
| Technical fluency | Low–medium |
| **JTBD** | *"When an autonomous system acts on regulated data, I need evidence, traceability, policy enforcement, and reduced operational risk — without slowing the business."* |
| Success criteria | Evidence, traceability, policy enforcement, audit-ready exports |

### Persona 5 — Ecosystem Builder "Builder Bilal"

| Attribute | Detail |
|---|---|
| Role | Consultant / SI / marketplace creator |
| **JTBD** | *"When I have repeatable vertical solutions, I want to package, distribute, and monetize them on a platform customers already trust."* |
| Success criteria | Monetization, portability, distribution, platform stability |

---

# 12. User Journeys & Flows
> `[Added]` — connecting personas to surfaces and moments of truth.

### 12.1 Journey A — Operator Omar: First Workflow to Production (Day 1 → Day 14)

```
Day 1   ─ Onboarding wizard (persona-aware) → Workspace + first integration connected
Day 2   ─ "Describe your workflow" prompt → AI Planner generates 8-node draft
Day 3   ─ Inspect canvas → AI side panel suggests retries + approval gates
Day 4   ─ Test run in CUA sandbox → step 4 fails, Self-Healing Engine recovers
Day 5   ─ Inline node test passes; cost preview shown
Day 6   ─ Submit for approval → Engineer reviews, signs off
Day 7   ─ Promote draft → staging → eval harness runs → green
Day 10  ─ Promote staging → production with progressive rollout
Day 14  ─ First weekly health report: 95% success, 2 heals applied automatically
```

**Moments of truth:** AI draft accuracy (Day 2); first heal visibility (Day 4); promotion gates clarity (Day 7); first health report quality (Day 14).
**Failure-to-rescue paths:** If AI draft is poor → "regenerate with feedback" + template fallback; if heal fails → routed to engineer with full diagnostic bundle.

### 12.2 Journey B — Developer Dana: Custom Node + LangGraph Agent

```
Discovery → Repo template + CLI scaffolds custom node
Local dev → SDK + types + local test harness
Publish    → CI verifies schema, security scan, license check
Distribute → Private workspace registry → optionally public marketplace
Monitor    → Observability dashboard for node usage, error rates, p95 latency
```

### 12.3 Journey C — Enterprise Eva: Platform Onboarding

```
Procurement evidence pack → DPA + SOC2 + SBOM delivered
Tenant provisioning  → Region selected; SSO/SCIM configured; SCIM groups → roles
Policy authoring     → Policy-as-code repo connected; CI gates enabled
Environment setup    → Dev/Staging/Prod environments; secrets vault brokered
Cost guardrails      → FinOps budgets per workspace; alerts to admins
Go-live              → First production run with full audit log; quarterly DR drill
```

### 12.4 Journey D — Compliance Kareem: Quarterly Audit

```
Evidence portal → Pull audit logs + heal diffs + policy decisions for Q
Filter           → By workspace, workflow, severity, action class
Export           → Signed audit bundle (PDF + JSON) to GRC tool
Review           → Anomalies surfaced via AAOP risk scoring; flag for follow-up
Close            → Audit attestation completed; evidence pack archived
```

### 12.5 Journey E — Builder Bilal: Publishing a Vertical Pack

```
Author     → Build "Bank Reconciliation Pack" (5 workflows + policy + dashboard)
Validate   → Marketplace lint; security review; pricing model selected
Publish    → Listed under Finance vertical; preview run available
Adopt      → Customers install → SLA + support tier selected
Earn       → Revenue share + usage analytics dashboard
```

---

# 13. SMART Goals, Objectives & Success Metrics
> `[Improved]` — every goal made specific, measurable, achievable, relevant, time-bound. DORA metrics added.

### 13.1 SMART Strategic Goals

| ID | Goal | Specific | Measurable | Time-Bound |
|---|---|---|---|---|
| G-1 | Achieve enterprise category leadership | 100 enterprise + mid-market customers signed | Customer count via CRM | 24 months from GA |
| G-2 | Prove resilience superiority | ≥ 95% execution success, ≥ 85% heal rate on benchmark | AAOP eval harness + Cua-Bench | 12 months from GA |
| G-3 | Build durable platform lock-in | ≥ 1,000 reusable templates and accelerators in marketplace | Marketplace registry | 18 months from GA |
| G-4 | Achieve enterprise trust milestones | SOC 2 Type II, ISO 27001 (Y2), KSA PDPL alignment | Audit attestations | 12 / 24 months |
| G-5 | Reach efficient revenue scale | $25M ARR at 78%+ gross margin | Finance reporting | 24 months from GA |
| G-6 | Build ecosystem flywheel | 20%+ revenue from marketplace/partner solutions | GTM reporting | 24 months from GA |

### 13.2 Product KPIs

| Metric | Target | Measurement |
|---|---|---|
| Workflow execution success rate | ≥ 95% | Run-level outcome telemetry |
| Self-healing recovery rate | ≥ 85% | Heal events / total recoverable failures |
| Authoring time (10-step workflow) | ≤ 10 min p50 | Designer session telemetry |
| First-deployment success without engineer | ≥ 75% | Run telemetry on operator-only flows |
| MTTI (mean time to identify root cause) | ≤ 5 min | Trace + AI diagnostic suggestion latency |
| Workflows with health score | ≥ 90% | Coverage telemetry |
| Promotion rollback time | ≤ 2 min | Blue/green orchestration logs |

### 13.3 Engineering Health (DORA)

| Metric | Target by GA | Target Y1 |
|---|---|---|
| Deployment Frequency | ≥ Daily (control plane) | ≥ Multiple/day |
| Lead Time for Change | ≤ 24 h | ≤ 4 h |
| Change Failure Rate | ≤ 15% | ≤ 10% |
| MTTR (mean time to restore) | ≤ 60 min | ≤ 30 min |
| Test coverage (core) | ≥ 80% | ≥ 85% |
| AI eval suite pass rate | ≥ 95% | ≥ 97% |

### 13.4 Business KPIs

| Metric | 12 Months | 24 Months |
|---|---|---|
| Paying customers | 50 | 200 |
| ARR | $5M | $25M |
| Net Revenue Retention | ≥ 115% | ≥ 125% |
| Workflow executions / month | ≥ 50,000 | ≥ 2M |
| Marketplace / partner revenue mix | 10% | 20% |
| Gross margin | 70% | 78% |

---

# 14. Product Scope

### 14.1 In Scope (Production Release)

✅ React-based visual workflow designer linked to the full AAOP application
✅ Custom AAOP workflow engine as system of record for orchestration, retries, state, governance
✅ Embedded Activepieces connector runtime for integrations and reusable pieces
✅ AI planner with local + cloud model routing
✅ Hybrid execution: Playwright, vision/CUA, MCP tools, API actions, human approvals
✅ Production lifecycle: draft → review → approve → publish → rollback → clone → promote
✅ Workflow health scoring, predictive recommendations, anomaly detection
✅ Secrets management, environment isolation, RBAC, audit logs, policy controls
✅ Observability layer: traces, screenshots, metrics, alerts, root-cause AI suggestions
✅ Workflow templates, vertical solution packs, marketplace foundations
✅ Data residency controls and configurable model governance boundaries
✅ Partner / ecosystem extension model

### 14.2 Out of Scope (Deferred Beyond GA)

❌ Consumer-focused automation marketplace
❌ Fully autonomous high-risk financial / legal execution without approvals
❌ Shadow-IT connectors that bypass platform policy and observability
❌ XR / spatial command-center surfaces as default UI
❌ Synchronous low-latency RPC into real-time trading systems

### 14.3 Assumptions
- Customers need both no-code simplicity and enterprise-grade controls.
- Regulated industries require hybrid deployments, auditability, and environment separation.
- Optimization and recommendations meaningfully increase workflow value.
- Connector breadth, execution reliability, and reuse drive platform competitiveness.

### 14.4 Constraints
- Visual authoring must remain responsive on workflows with 500+ nodes.
- Runtime cost must be actively managed across inference, browser sessions, sandboxes.
- Sensitive automations must support policy gates, approvals, data-handling restrictions.
- Cross-environment promotion must preserve integrity, audit history, rollback.

---

# 15. System Architecture

### 15.1 High-Level Architecture

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                              EXPERIENCE LAYER                                  │
│ Visual Designer │ Run Console │ Approval Center │ Admin Console │ Marketplace  │
└──────────────────────┬───────────────────────┬─────────────────┬───────────────┘
                       │ HTTPS / WSS          │                 │
┌──────────────────────▼───────────────────────▼─────────────────▼───────────────┐
│                              API GATEWAY (Envoy + WAF)                         │
│ AuthN/AuthZ │ Tenant routing │ Policy enforcement │ Rate limit │ OpenAPI / SDK │
└──────────────────────┬─────────────────────────────────────────────────────────┘
                       │ mTLS (Istio service mesh)
┌──────────────────────▼─────────────────────────────────────────────────────────┐
│                          CONTROL & DESIGN PLANE                                │
│ Workflow Svc │ Designer Sync │ Planner Svc │ Scheduler │ Approval Svc          │
│ Policy Svc   │ Template Svc  │ Marketplace │ Webhook Manager                   │
└──────────────────────┬─────────────────────────────────────────────────────────┘
                       │
┌──────────────────────▼─────────────────────────────────────────────────────────┐
│                       INTELLIGENCE & DECISION LAYER                            │
│ Planner LLMs │ Vision Models │ Embeddings │ Retrieval/Memory │ Recommender     │
│ LangGraph Orchestrator │ Risk Scoring │ Optimization │ Eval Harness            │
└──────────────────────┬─────────────────────────────────────────────────────────┘
                       │
┌──────────────────────▼─────────────────────────────────────────────────────────┐
│                            EXECUTION ORCHESTRATOR                              │
│ Routes steps → Playwright │ Vision/CUA │ MCP │ Activepieces │ API │ HITL       │
└────────┬──────────────────────┬─────────────────────┬──────────────────────────┘
         │                      │                     │
┌────────▼─────────┐ ┌──────────▼────────┐ ┌──────────▼───────────────────────┐
│ Web/DOM Workers  │ │ Vision/CUA Runtime│ │ OS / Connector / API Runtime     │
│ Playwright +     │ │ trycua/cua        │ │ MCP tools + Activepieces runtime │
│ Healenium        │ │ sandboxes         │ │                                  │
└────────┬─────────┘ └──────────┬────────┘ └──────────┬───────────────────────┘
         │                      │                     │
┌────────▼──────────────────────▼─────────────────────▼──────────────────────────┐
│                         DATA & GOVERNANCE LAYER                                │
│ PostgreSQL │ Object Storage │ Vector DB │ Redis │ Event Stream │ Audit │ FStore│
└────────┬───────────────────────────────────────────────────────────────────────┘
         │
┌────────▼───────────────────────────────────────────────────────────────────────┐
│                       OBSERVABILITY & LEARNING LOOP                            │
│ Metrics │ Traces │ Logs │ Alerts │ Health Scores │ Recs │ Drift Detection      │
└────────────────────────────────────────────────────────────────────────────────┘
```

### 15.2 Architectural Patterns
- **Canonical workflow definition** shared across design, execution, approvals, observability.
- **Event-driven runtime** for scale, retries, async coordination.
- **Policy-as-code** at design time, deploy time, run time.
- **Hexagonal abstraction** for models, connectors, execution engines.
- **Data products architecture** — telemetry, health scores, recommendations from standardized run data.
- **Environment promotion model** for draft → staging → production lifecycle.

### 15.3 Visual Designer Architecture
- **Designer frontend** with typed node registry, validation engine, AI assistance, accessibility, contextual telemetry.
- **Designer sync service** persists graph changes, manages versioning, conflict resolution, approval status.
- **Runtime binding layer** maps graph nodes to execution primitives, secrets, policies, environment params.
- **Operational linkage** exposes traces, logs, incidents, prior runs directly in the designer.

### 15.4 Scalability Posture
- Horizontal scaling for workers, intelligence services, event processors.
- Regional deployment options (US, EU, KSA) for residency and sovereignty.
- FinOps controls for model routing, sandbox allocation, connector cost.
- Chaos testing, sandbox replay, benchmark suites for resilience validation.

---

# 16. Core Component Specifications

### 16.1 🎨 Visual Workflow Designer

**Purpose:** Production-grade no-code workflow designer fully connected to AAOP runtime systems.

**Strategic Requirements**
- Canvas is the primary production authoring surface and maps to the canonical workflow definition.
- Typed nodes, connectors, conditions, loops, approvals, retries, schedules, integrations.
- Linked to environments, secrets, telemetry, policy checks, deployment state, templates, rollback history.
- Per-node execution history, failure patterns, recommended fixes, AI-generated guidance.
- Accessibility: keyboard nav, screen-reader labels, zoom, high-contrast, reduced-motion.
- Collaborative review comments, approval handoffs, ownership metadata, controlled publishing.
- Confidence and safety layer showing automation risk, model usage, human-review checkpoints.

**Core Features**
- Drag-and-drop graph editing with smart snapping and large-scale navigation.
- AI-assisted authoring from NL, demonstrations, or templates.
- Inline validation: schema, permissions, environment bindings, unsafe pattern detection.
- Lifecycle actions: draft, review, approve, publish, rollback, clone, compare versions, promote.
- Deep links to traces, screenshots, logs, incidents from any node.

### 16.2 ⚙️ Workflow Engine

**Purpose:** Execute AAOP-native workflow graphs reliably at enterprise scale.

**Architecture Note:** AAOP owns orchestration, execution state, deployment lifecycle, approvals, audit, observability. Activepieces is used only as embedded connector runtime, never as primary workflow engine.

**Capabilities**
- DAG execution with branching, looping, retries, checkpoints, subflows, human approval nodes.
- Idempotent execution, resumability, rollback-safe state.
- Environment-specific bindings for credentials, endpoints, policies, quotas.
- Event-driven dispatch to specialized runtime workers.
- Real-time telemetry emission for monitoring, health scoring, optimization.
- Policy hooks for risk, cost, data movement, approvals.

### 16.3 🧠 AI Agent Planner

**Purpose:** Convert business intent to reliable workflow logic; recommend best execution path; optimize over time.

**Responsibilities**
1. Convert NL goals into structured workflow graphs.
2. Recommend execution mode per step: API, connector, DOM, vision, OS, human.
3. Propose guardrails, policies, approval checkpoints for risky workflows.
4. Generate debugging, optimization, healing suggestions from execution history.
5. Personalize via role-aware prompts, organizational memory, learned patterns.

**Advanced Intelligence Roadmap**
- Cost-aware model routing.
- Confidence-based escalation to human review.
- Predictive workflow optimization recommendations.
- Simulation-informed authoring.

### 16.4 👁️ Computer-Using Agent (CUA)

**Purpose:** Perceive and act on screens like a human.

**Pipeline**
```
Screenshot → Preprocessing → VLM Analysis → Element Map →
Goal Reasoning → Action Decision → Mouse/Keyboard → Verify
```

**Capabilities**
- UI element detection (buttons, fields, menus) with bounding boxes and labels.
- OCR for text regions (PaddleOCR / Tesseract / cloud OCR).
- Semantic matching ("find Submit button near bottom").
- Visual diff to detect screen change between actions.
- Coordinate normalization across DPI / zoom.
- Sandbox execution inside isolated VMs/containers.
- Cua Driver for background macOS automation without focus theft.

**Models**
- Detection: OmniParser, YOLOv8 fine-tuned, or commercial VLM (Claude vision, GPT-4V).
- OCR: PaddleOCR (default), Tesseract (fallback), cloud OCR for scale.
- Reasoning: planner LLM with vision-grounded prompts.

**CUA Infrastructure (trycua/cua)**
- **Cua Sandbox** — multi-OS VM/container sandboxes (Linux, macOS, Windows, Android) via QEMU/KVM or Apple Virtualization.Framework.
- **Cua Driver** — background computer-use on macOS without stealing cursor/focus.
- **CuaBot** — co-op CUA CLI for running agents in sandboxes with H.265 streaming.
- **Lume** — macOS/Linux VM management on Apple Silicon.
- **Cua-Bench** — OSWorld, ScreenSpot, Windows Arena benchmarks for regression testing.

**Output Schema**
```json
{
  "screen_id": "scr_a93...",
  "timestamp": "2026-05-03T08:01:12Z",
  "elements": [
    {
      "id": "el_001",
      "type": "button",
      "label": "Submit",
      "bbox": [820, 540, 940, 580],
      "confidence": 0.96,
      "interactable": true
    }
  ],
  "page_signature": "hash_for_change_detection",
  "sandbox_id": "sb_cua_..."
}
```

### 16.5 🚦 Execution Orchestrator

**Routing Decision Matrix**

| Signal | DOM (Playwright) | Vision (CUA) | OS (MCP) | Activepieces | CUA Sandbox |
|---|:---:|:---:|:---:|:---:|:---:|
| Stable selector available | ✅ Primary | Fallback | — | — | — |
| Selector fails / dynamic UI | Fallback | ✅ Primary | — | — | — |
| Canvas / iframe / non-DOM UI | — | ✅ Primary | — | — | — |
| Desktop application | — | Possible | ✅ Primary | — | ✅ Primary |
| File system / shell action | — | — | ✅ Primary | — | — |
| OS-level focus required | Possible | Possible | ✅ Primary | — | — |
| API-based integration | — | — | — | ✅ Primary | — |
| Isolated browser session | — | — | — | — | ✅ Primary |
| Cross-platform mobile | — | — | — | — | ✅ Primary |

**Fallback Chain Example**
```
Step: "Click Submit"
  Try: Playwright (selector "#submit") → 2 attempts
  Fail → Healenium ML selector remap → 1 attempt
  Fail → Vision (find "Submit" button) → 2 attempts
  Fail → MCP (focus app + send keystroke "Tab+Enter")
  Fail → Trigger Self-Healing Engine → if exhausted, escalate to human
```

### 16.6 🔄 Self-Healing Engine

**Failure Detection Signals**
- Selector not found / timeout
- Visual verification failed
- Unexpected modal / popup detected
- LLM judge reports state mismatch
- Execution exceeded time budget

**Recovery Strategies (priority order)**
1. Retry with backoff (transient flakiness)
2. Healenium ML remap
3. Selector remap via vision
4. Page wait + revalidate
5. Replan step (Planner LLM)
6. Replan workflow
7. Pause + notify human

**Learning Loop**
- Successful heals update `ui_mappings`.
- Failed heals add negative examples for planner prompts.
- Healenium model retrained monthly on aggregated heal data.
- Aggregate patterns inform fine-tuning datasets.

### 16.7 🗄️ Memory & UI Mapping Store

**Stores:** Workflow library; execution history; UI mapping; embedding vectors; audit trail; LangGraph checkpoints.

**Storage Choices:** PostgreSQL (relational core); Object storage (S3/MinIO); Vector DB (pgvector / Qdrant); Redis (cache, queues, rate limiting).

### 16.8 📊 Observability & Learning Loop

**Capabilities**
- Real-time run dashboard: current runs, queue depth, error rates.
- Per-workflow analytics: success rate, p50/p95 latency, retry rate, heal rate.
- Drill-down trace per run: every node, every action, every screenshot.
- Anomaly detection vs. baseline.
- Eval harness: regression suite of workflows, nightly.
- Feedback capture: user thumbs-up/down on auto-healed actions.
- LangSmith integration for LLM tracing.
- Cua-Bench for computer-use benchmarking on model changes.

**Tools:** OpenTelemetry, Prometheus + Grafana, Loki/ELK, internal eval harness, LangSmith.

---

# 17. Functional Requirements & User Stories
> `[Improved]` — every P0/P1 requirement now has a user story and Given/When/Then acceptance criteria.

> Priorities: **P0** = launch-blocking · **P1** = launch-important · **P2** = post-GA.

### 17.1 Workflow Authoring (FR-A)

#### FR-A1 — Create, save, name a workflow `[P0]`
**User story:** As Operator Omar, I want to create and name a new workflow so I can organize my automations.
**Acceptance criteria:**
- **Given** I am authenticated and have `editor` role on a workspace,
- **When** I click "New workflow" and provide a name (1–80 chars, no leading/trailing spaces),
- **Then** the system creates a workflow with status `draft`, version `1`, and emits an `audit_log` entry with `action=workflow.create`.
- **And** I am redirected to the canvas within 2 seconds.
- **Edge case:** Duplicate name within workspace → system suggests `name (2)` and accepts; never errors silently.

#### FR-A2 — Drag/drop nodes from palette onto canvas `[P0]`
**User story:** As Operator Omar, I want to drag nodes from a palette onto a canvas so I can compose a workflow visually.
**Acceptance criteria:**
- **Given** I am on a workflow canvas,
- **When** I drag a node from the palette and drop it on the canvas,
- **Then** the node is added with default config; canvas auto-saves within 500ms.
- **And** keyboard equivalent (Cmd-K → "add node") is supported for accessibility.

#### FR-A3 — Connect nodes with directional edges `[P0]`
**User story:** As Operator Omar, I want to connect nodes with edges so I can express execution order.
**Acceptance criteria:**
- **Given** two nodes exist on the canvas,
- **When** I drag from one node's output port to another node's input port,
- **Then** an edge is created if the type system allows the connection.
- **And** if types are incompatible, the edge is rejected with an inline message: *"Cannot connect <type A> output to <type B> input"*.

#### FR-A4 — Configure node parameters `[P0]`
**User story:** As Operator Omar, I want to configure nodes via a side panel so I can specify behavior without touching code.
**Acceptance criteria:**
- **Given** I select a node,
- **When** the inspector opens,
- **Then** schema-driven form fields render with help text, validation, and secret-reference autocomplete.
- **And** unsaved changes are preserved across navigation; explicit "Discard" action required to lose them.

#### FR-A5 — Validate graph before save `[P0]`
**User story:** As Developer Dana, I want graph validation so cycles, broken edges, and type errors are caught early.
**Acceptance criteria:**
- **Given** a workflow with cycles, dangling edges, or type mismatches,
- **When** I attempt to save,
- **Then** the system rejects the save and presents a list of issues with anchors to the offending nodes.
- **And** validation runs incrementally on edit, surfacing problems within 200ms.

#### FR-A6 — NL → workflow draft `[P0]`
**User story:** As Operator Omar, I want to describe my workflow in plain English so I can start from a generated draft.
**Acceptance criteria:**
- **Given** I provide a prompt of 10–500 chars,
- **When** I submit it to the AI Planner,
- **Then** the planner returns a syntactically valid workflow within 30s, populated on the canvas.
- **And** every generated node carries an "AI-suggested" badge until reviewed.
- **And** generation respects workspace policy (cannot include disallowed action types).

#### FR-A7 — Record actions and convert to workflow `[P1]`
**User story:** As Operator Omar, I want to record my browser actions and have the system generate a workflow draft.
**Acceptance criteria:**
- **Given** I install the recorder extension and start a recording session,
- **When** I perform actions in a target web app and stop the recording,
- **Then** the system produces a draft workflow with one node per significant action, deduped and parameterized where possible.

#### FR-A8 — Clone, version, rollback `[P0]`
**User story:** As Developer Dana, I want versioning and rollback so I can recover from bad changes.
**Acceptance criteria:**
- **Given** a workflow with multiple versions,
- **When** I select a prior version and click "Restore",
- **Then** the system creates a new version equal to the chosen version's graph and updates `current_version_id`.
- **And** all changes are auditable via `audit_logs`.

#### FR-A9 — Import/export JSON `[P1]`
**User story:** As Developer Dana, I want JSON import/export so I can manage workflows in source control.
**Acceptance criteria:** schema-validated import; export includes schema version and minimal metadata; round-trip is byte-stable.

#### FR-A10 — Share with permissions `[P1]`
**User story:** As Operator Omar, I want to share workflows with read/edit/run permissions so my team can collaborate safely.
**Acceptance criteria:** per-workflow ACL; least-privilege defaults; `audit_logs` capture every share/unshare.

#### FR-A11 — Publish to marketplace `[P1]`
**User story:** As Builder Bilal, I want to publish workflows as templates so others can install them.
**Acceptance criteria:** marketplace lint passes; security scan clears; pricing model selectable; publish record auditable.

#### FR-A12 — Import LangGraph definitions `[P1]`
**User story:** As Developer Dana, I want to import LangGraph workflows so I can leverage existing agent patterns.
**Acceptance criteria:** subset of LangGraph schema supported; unsupported features flagged; generated graph runnable.

#### FR-A13 — Manage prompts via embedded Dify editor `[P1]`
**User story:** As Developer Dana, I want to manage LLM prompts in a versioned editor so I can iterate safely.
**Acceptance criteria:** prompt versions tracked; A/B test scaffold available; rollout requires eval pass.

### 17.2 Execution (FR-B)

#### FR-B1 — Manual run `[P0]`
**User story:** As Operator Omar, I want to run a workflow manually so I can test it.
**Acceptance criteria:**
- **Given** a published workflow,
- **When** I click "Run" and provide required inputs,
- **Then** a run is queued within 1s; live stream begins within 3s of dispatch.

#### FR-B2 — Schedule (cron / fixed) `[P0]`
**Acceptance criteria:** cron expressions validated; timezone-aware; missed runs handled per policy (skip / catch-up bounded).

#### FR-B3 — Webhook trigger `[P0]`
**Acceptance criteria:** unique tokenized webhook URL; HMAC signature optional; replay protection via nonce + timestamp window.

#### FR-B4 — Parallel branches and joins `[P0]`
**Acceptance criteria:** explicit join semantics (all/any/threshold); deadlock detection in validation.

#### FR-B5 — Bounded loops `[P0]`
**Acceptance criteria:** mandatory max iteration (default 100); runtime guard halts and emits incident if exceeded.

#### FR-B6 — Try/catch error handling `[P0]`
**Acceptance criteria:** typed error catches (network, auth, timeout, policy); error context propagated to handler.

#### FR-B7 — Pause / resume / cancel `[P1]`
**Acceptance criteria:** state-safe; in-flight side effects flagged on cancel; resume restores from last checkpoint.

#### FR-B8 — Crash-recovery state persistence `[P0]`
**Acceptance criteria:** every node-run boundary checkpointed; recovery test in chaos suite.

#### FR-B9 — Remote workers (customer machines) `[P0]`
**Acceptance criteria:** secure agent uses outbound-only mTLS; identity rotation; remote workers visible in admin console.

#### FR-B10 — Runtime input parameters `[P0]`
**Acceptance criteria:** typed inputs; schema-driven UI; secrets references resolved at runtime.

#### FR-B11 — Run inside CUA sandbox `[P0]`
**Acceptance criteria:** sandbox launched within 5s p95; auto-destroyed after run; resource caps enforced.

#### FR-B12 — Invoke Activepieces actions `[P1]`
**Acceptance criteria:** typed wrapping of Activepieces pieces; failures surface piece-level errors; secrets brokered ephemerally.

### 17.3 AI Planner (FR-C)

#### FR-C1 — NL planner with policy awareness `[P0]`
**Acceptance criteria:** plans validated against schema; disallowed action types rejected; cost estimate produced.

#### FR-C2 — Replan failing step `[P0]`
**Acceptance criteria:** triggered on heal escalation; respects retry budget and cost ceiling.

#### FR-C3 — Explain workflow in plain language `[P1]`
**Acceptance criteria:** explanation cites nodes and policies; ≤ 200 words; does not leak secrets.

#### FR-C4 — Cost-aware model routing `[P1]`
**Acceptance criteria:** routing decisions logged; per-workspace budgets enforced; fallbacks documented.

### 17.4 Self-Healing (FR-D)

#### FR-D1 — Healenium ML remap on selector failure `[P0]`
**Acceptance criteria:** remap attempted within 500ms; success rate ≥ 70% on benchmark.

#### FR-D2 — Vision-based recovery `[P0]`
**Acceptance criteria:** confidence threshold ≥ 0.85; below threshold escalates.

#### FR-D3 — Heal record + diff visible to user `[P1]`
**Acceptance criteria:** every heal stored with before/after selectors and screenshots; surfaced in run trace.

### 17.5 Observability (FR-E)

#### FR-E1 — Per-run trace with screenshots `[P0]`
**Acceptance criteria:** every node-run carries a unique trace id; screenshots captured at action boundaries; PII redacted per workspace policy.

#### FR-E2 — Workflow analytics dashboard `[P0]`
**Acceptance criteria:** success rate, p50/p95 latency, retry/heal rate, cost; filterable by environment, time, workflow.

#### FR-E3 — Anomaly detection on baselines `[P1]`
**Acceptance criteria:** alerts fire on > 2σ deviation sustained over rolling window; tunable per workflow.

### 17.6 Governance (FR-F)

#### FR-F1 — RBAC + workflow-level ACL `[P0]`
**Acceptance criteria:** roles {`owner`, `admin`, `editor`, `runner`, `viewer`}; ACL overrides at workflow level; deny-by-default.

#### FR-F2 — Approval Center with SLA routing `[P0]`
**Acceptance criteria:** approval requests routed by workflow + risk class; SLA timer; escalation policy; full audit trail.

#### FR-F3 — Policy-as-code gates `[P0]`
**Acceptance criteria:** policies declared in repo; evaluated at design time, deploy time, run time; violations block with explanatory message.

#### FR-F4 — Audit log export `[P0]`
**Acceptance criteria:** signed export bundle (PDF + JSON); time range filterable; chain-of-custody hash chain.

### 17.7 Marketplace (FR-G)

#### FR-G1 — Browse, install templates `[P1]`
#### FR-G2 — Publish workflow as template `[P1]`
#### FR-G3 — Vertical solution packs (Finance, HR, Public Sector) `[P1]`

---

# 18. Non-Functional Requirements

### 18.1 Performance

| NFR | Target | Test Method |
|---|---|---|
| API p95 latency | < 300ms (read), < 800ms (write) | k6 load tests; OTel histograms |
| Designer canvas FPS | ≥ 50 FPS for 200-node workflow | Browser perf tests |
| Run dispatch latency | < 1s p95 from queue → worker | Internal benchmarks |
| CUA sandbox cold start | < 5s p95 | Cua-Bench |
| Concurrent runs cluster-wide | 10,000 | Sustained load test |
| Webhook ingest | 1,000 RPS / workspace | Load test |

### 18.2 Scalability

| Aspect | Approach |
|---|---|
| Stateless services | Horizontal autoscaling (HPA on CPU + queue depth) |
| Workers | Queue-driven scaling; customer-side workers for sovereignty |
| Database | Vertical first → read replicas → workspace-shard at > 10k tenants |
| Object storage | S3 / GCS / Azure Blob — practically unlimited |
| Vector DB | Workspace-sharded |
| Caching | API gateway + UI mapping cache |
| Async-by-default | Long planner / vision calls return job IDs |

### 18.3 Reliability & Resilience

| NFR | Target |
|---|---|
| Control-plane SLA | 99.9% |
| Run dispatch SLA | 99.95% |
| RTO (region failover) | ≤ 15 min |
| RPO | ≤ 5 min |
| Backup retention | 30 days primary, 1 year archival (encrypted) |
| Restore drill | Quarterly |
| Chaos exercise | Twice yearly |

### 18.4 Security (summary; full detail Section 22)

| NFR | Target |
|---|---|
| Encryption at rest | AES-256 |
| Encryption in transit | TLS 1.3 |
| Secret storage | HashiCorp Vault / cloud KMS |
| Authentication | OIDC / SAML / OAuth 2.1; MFA for admins |
| Vulnerability SLA | Critical < 24h; High < 7d |
| Pentest | Annual third-party |
| Sandbox isolation | VM-level for CUA; seccomp + AppArmor for containers |

### 18.5 Compliance

- **SOC 2 Type II** within 12 months of GA
- **GDPR / CCPA** day-1 alignment
- **ISO 27001** roadmap (Year 2)
- **HIPAA** readiness (Year 2)
- **KSA PDPL** day-1 alignment
- Data residency: US, EU, KSA at launch
- OSS license compliance via SBOM + dependency scanning

### 18.6 Maintainability
- Hexagonal architecture; pluggable engines.
- ≥ 80% unit coverage on core packages.
- Public APIs under semantic versioning.
- All services emit OpenTelemetry traces.
- OSS components have documented upgrade paths.

### 18.7 Usability & Accessibility
- WCAG 2.1 AA across builder + dashboards.
- i18n framework: English at launch; Arabic, Spanish, French, German, Japanese in v1.5.
- RTL layout for Arabic / Hebrew.
- Keyboard navigation across all builder interactions.

---

# 19. Data Model & Storage

### 19.1 Logical Entities

```
User ──┬── Membership ── Workspace ──┬── Workflow ──┬── Version
       │                             │              └── Run ── NodeRun
       │                             ├── Secret
       │                             ├── Integration
       │                             ├── Schedule
       │                             ├── Audit Log
       │                             ├── UI Mapping (per app/url)
       │                             ├── Approval Request
       │                             ├── Policy Document
       │                             └── LangGraph Checkpoint
       │
       └── ApiToken
```

### 19.2 PostgreSQL Schema (selected tables — unchanged from v5 plus additions for approvals & policy)

```sql
-- Identity
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  hashed_password TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ
);

CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  plan TEXT DEFAULT 'free',
  region TEXT DEFAULT 'us-east-1',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE memberships (
  user_id UUID REFERENCES users(id),
  workspace_id UUID REFERENCES workspaces(id),
  role TEXT CHECK (role IN ('owner','admin','editor','runner','viewer')),
  PRIMARY KEY (user_id, workspace_id)
);

-- Workflows
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id),
  name TEXT NOT NULL,
  description TEXT,
  current_version_id UUID,
  status TEXT DEFAULT 'draft',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE workflow_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES workflows(id),
  version INT NOT NULL,
  graph JSONB NOT NULL,
  langgraph_config JSONB,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (workflow_id, version)
);

-- Execution
CREATE TABLE runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES workflows(id),
  version_id UUID REFERENCES workflow_versions(id),
  status TEXT NOT NULL,
  trigger TEXT,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  duration_ms INT,
  error TEXT,
  cost_credits NUMERIC(10,4) DEFAULT 0,
  sandbox_id TEXT,
  langgraph_checkpoint TEXT
);

CREATE TABLE node_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES runs(id),
  node_id TEXT NOT NULL,
  engine TEXT NOT NULL,
  status TEXT NOT NULL,
  attempt INT DEFAULT 1,
  input JSONB,
  output JSONB,
  error TEXT,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  duration_ms INT,
  screenshot_url TEXT,
  healed BOOLEAN DEFAULT false,
  healenium_remap BOOLEAN DEFAULT false
);

-- UI Mapping
CREATE TABLE ui_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id),
  app_url TEXT NOT NULL,
  page_signature TEXT,
  element_label TEXT,
  selector TEXT,
  bbox JSONB,
  confidence NUMERIC(4,3),
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  observed_count INT DEFAULT 1
);
CREATE INDEX idx_uimap_lookup ON ui_mappings(workspace_id, app_url, element_label);

-- Audit
CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  workspace_id UUID,
  actor_id UUID,
  actor_type TEXT,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  meta JSONB,
  hash_chain TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Secrets
CREATE TABLE secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id),
  name TEXT NOT NULL,
  vault_ref TEXT NOT NULL,
  rotation_policy TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- LangGraph Checkpoints
CREATE TABLE langgraph_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES runs(id),
  checkpoint_id TEXT NOT NULL,
  thread_id TEXT NOT NULL,
  state JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_lg_checkpoint ON langgraph_checkpoints(run_id, thread_id);

-- [Added] Approvals
CREATE TABLE approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES runs(id),
  node_id TEXT NOT NULL,
  risk_class TEXT NOT NULL,        -- low|medium|high|critical
  required_approvers INT DEFAULT 1,
  status TEXT NOT NULL,            -- pending|approved|rejected|expired
  sla_deadline TIMESTAMPTZ,
  context JSONB,                   -- payload + screenshot URLs
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
CREATE INDEX idx_approval_pending ON approval_requests(status, sla_deadline);

CREATE TABLE approval_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES approval_requests(id),
  approver_id UUID REFERENCES users(id),
  decision TEXT NOT NULL,          -- approved|rejected
  reason TEXT,
  decided_at TIMESTAMPTZ DEFAULT now()
);

-- [Added] Policy documents
CREATE TABLE policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id),
  name TEXT NOT NULL,
  scope TEXT NOT NULL,             -- workspace|workflow|environment
  scope_id UUID,
  rego TEXT,                       -- OPA policy source (optional)
  schema JSONB,                    -- structured rule definition
  enforced_at TEXT[] NOT NULL,     -- {'design','deploy','run'}
  version INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_policy_scope ON policies(workspace_id, scope, scope_id);
```

### 19.3 Canonical Workflow Graph (JSON)

```json
{
  "schema_version": "1.0",
  "name": "Daily Bank Reconciliation",
  "variables": { "today": "2026-05-03" },
  "nodes": [
    { "id": "trigger_1", "type": "trigger.schedule", "config": { "cron": "0 9 * * 1-5" } },
    { "id": "open_bank", "type": "web.open_url", "config": { "url": "https://bank.example.com" } },
    { "id": "login", "type": "web.login", "config": { "username_secret": "bank_user", "password_secret": "bank_pass" } },
    { "id": "find_statement", "type": "vision.find_element", "config": { "description": "Today's statement download button" } },
    { "id": "download", "type": "web.click", "config": { "target_ref": "find_statement.element" } },
    { "id": "integration_process", "type": "integration.activepieces.run", "config": { "piece": "custom.reconcile_statement", "action": "process_file", "inputs": { "file": "{{download.path}}" } } },
    { "id": "agent_review", "type": "langgraph.agent", "config": { "agent_type": "reviewer", "prompt": "Review the reconciliation summary..." } }
  ],
  "edges": [
    { "from": "trigger_1", "to": "open_bank" },
    { "from": "open_bank", "to": "login" },
    { "from": "login", "to": "find_statement" },
    { "from": "find_statement", "to": "download" },
    { "from": "download", "to": "integration_process" },
    { "from": "integration_process", "to": "agent_review" }
  ],
  "policies": {
    "on_error": "self_heal",
    "max_runtime_seconds": 600,
    "retry": { "max_attempts": 3, "backoff": "exponential" },
    "sandbox": { "enabled": true, "image": "linux-chrome:latest" }
  }
}
```

---

# 20. API Specifications & Contracts
> `[Improved]` — adds OpenAPI contract examples, error model, idempotency, and rate-limit headers.

### 20.1 API Principles
- REST + JSON for resource APIs; gRPC for internal service-to-service.
- WebSocket for live execution streams.
- Versioned at `/v1`; additive changes only.
- Bearer token auth (workspace-scoped); MFA required for sensitive operations.
- Rate-limit per token and per workspace; standard `X-RateLimit-*` headers.
- OpenAPI 3.1 spec published and kept in sync via CI.
- **Idempotency:** all `POST` endpoints accept `Idempotency-Key` header (24h TTL).
- **Correlation:** every request returns `X-Correlation-ID` matching internal traces.
- **Pagination:** cursor-based (`?cursor=...&limit=...`).

### 20.2 Standard Error Model

```json
{
  "error": {
    "code": "policy_violation",
    "message": "Workflow contains a disallowed action type for this workspace.",
    "type": "validation_error",
    "details": {
      "node_id": "send_external_email",
      "policy_id": "pol_8a3...",
      "violations": ["external_egress_disabled"]
    },
    "correlation_id": "req_3f9..."
  }
}
```

**Error categories:** `validation_error`, `auth_error`, `permission_error`, `not_found`, `conflict`, `rate_limited`, `policy_violation`, `internal_error`.

### 20.3 Selected Endpoints

```
# Workflows
POST   /v1/workflows                    Create workflow
GET    /v1/workflows                    List workflows
GET    /v1/workflows/{id}               Get workflow
PATCH  /v1/workflows/{id}               Update workflow
DELETE /v1/workflows/{id}               Delete workflow
POST   /v1/workflows/{id}/versions      Save new version
GET    /v1/workflows/{id}/versions      List versions
POST   /v1/workflows/{id}/promote       Promote across environments
POST   /v1/workflows/{id}/import        Import from LangGraph JSON

# Runs
POST   /v1/workflows/{id}/runs          Start a run
GET    /v1/runs/{run_id}                Get run details
POST   /v1/runs/{run_id}/cancel         Cancel
POST   /v1/runs/{run_id}/pause          Pause
POST   /v1/runs/{run_id}/resume         Resume
GET    /v1/runs/{run_id}/nodes          Per-node trace
GET    /v1/runs/{run_id}/screenshots    Screenshots index
WS     /v1/runs/{run_id}/stream         Live event stream

# AI Planner
POST   /v1/planner/generate             NL → workflow draft
POST   /v1/planner/replan               Replan a failing step
POST   /v1/planner/explain              Plain-language explanation

# Vision / CUA
POST   /v1/cua/analyze                  Analyze screenshot
POST   /v1/cua/find                     Find element by description
POST   /v1/cua/sandbox                  Launch sandbox
DELETE /v1/cua/sandbox/{id}             Destroy sandbox
POST   /v1/cua/sandbox/{id}/screenshot  Capture screenshot

# Approvals  [Added]
POST   /v1/approvals                    Create approval request (system-internal)
GET    /v1/approvals                    List pending approvals (filterable)
POST   /v1/approvals/{id}/decide        Approve / reject
GET    /v1/approvals/{id}               Get approval context

# Policies  [Added]
POST   /v1/policies                     Create / update policy
GET    /v1/policies                     List policies in workspace
POST   /v1/policies/{id}/evaluate       Dry-run evaluation against a workflow

# UI Mapping
GET    /v1/ui-mappings                  Query mappings by URL
POST   /v1/ui-mappings                  Upsert (system-internal)

# Schedules / Triggers
POST   /v1/workflows/{id}/schedules     Create schedule
DELETE /v1/schedules/{schedule_id}      Remove

# Webhooks
POST   /v1/webhooks/{token}             Inbound trigger

# Identity & Workspace
POST   /v1/auth/login                   Email + password
POST   /v1/auth/oauth/{provider}        OAuth callback
GET    /v1/me                           Current user
POST   /v1/workspaces                   Create workspace
POST   /v1/workspaces/{id}/members      Invite member

# Secrets
POST   /v1/secrets                      Create secret reference
GET    /v1/secrets                      List (no values)
DELETE /v1/secrets/{id}                 Remove

# Marketplace
GET    /v1/marketplace/templates        Browse
POST   /v1/marketplace/install/{id}     Install
POST   /v1/marketplace/publish          Publish (draft / review)

# Activepieces
POST   /v1/integrations/activepieces/actions/execute
GET    /v1/integrations/activepieces/pieces
GET    /v1/integrations/activepieces/actions

# LangGraph
POST   /v1/langgraph/invoke
GET    /v1/langgraph/checkpoints
```

### 20.4 OpenAPI Snippet — Create a Run

```yaml
paths:
  /v1/workflows/{id}/runs:
    post:
      summary: Start a workflow run
      operationId: createRun
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string, format: uuid }
        - name: Idempotency-Key
          in: header
          schema: { type: string, maxLength: 64 }
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [trigger]
              properties:
                trigger: { type: string, enum: [manual, schedule, webhook, api] }
                inputs: { type: object, additionalProperties: true }
                execution_mode: { type: string, enum: [test, staging, production], default: test }
                preferred_engine: { type: string, enum: [auto, dom, vision, mcp], default: auto }
                sandbox:
                  type: object
                  properties:
                    enabled: { type: boolean, default: true }
                    image: { type: string }
      responses:
        '202':
          description: Run accepted
          content:
            application/json:
              schema:
                type: object
                properties:
                  run_id: { type: string, format: uuid }
                  status: { type: string, enum: [queued] }
                  stream_url: { type: string, format: uri }
                  sandbox_id: { type: string, nullable: true }
        '400': { $ref: '#/components/responses/ValidationError' }
        '403': { $ref: '#/components/responses/PolicyViolation' }
        '429': { $ref: '#/components/responses/RateLimited' }
```

### 20.5 Live Event Stream (WebSocket frames)

```json
{ "type": "node.started",   "node_id": "open_bank", "ts": "..." }
{ "type": "node.action",    "node_id": "open_bank", "engine": "playwright" }
{ "type": "node.screenshot","node_id": "login",     "url": "s3://..." }
{ "type": "node.failed",    "node_id": "login",     "error": "selector_not_found" }
{ "type": "heal.started",   "node_id": "login",     "strategy": "healenium_remap" }
{ "type": "heal.succeeded", "node_id": "login",     "new_selector": "..." }
{ "type": "node.succeeded", "node_id": "login" }
{ "type": "approval.requested", "request_id": "ar_...", "sla_deadline": "..." }
{ "type": "run.succeeded",  "run_id": "run_77d2..." }
```

---

# 21. AI / ML Strategy

### 21.1 Model Strategy by Capability

| Capability | Default (Local) | Premium (Cloud) | Why |
|---|---|---|---|
| Planning | Llama 3.1 8B / Qwen 2.5 7B (Ollama) | Claude 3.5 Sonnet, GPT-4o | Stronger reasoning |
| Vision (CUA) | OmniParser + small VLM | Claude (vision), GPT-4V | Higher niche-UI accuracy |
| OCR | PaddleOCR | Cloud OCR | Multilingual, scale |
| Embeddings | bge-large-en-v1.5 | text-embedding-3-large | Cross-lingual, retrieval quality |
| Decisioning | Same as planner | Same as planner | Consistency |
| Agent Orchestration | LangGraph + local LLM | LangGraph + cloud LLM | Stateful graphs |

### 21.2 Hybrid Routing Policy
- **Privacy-first workspaces:** Local-only by default; cloud disabled unless explicitly opted in.
- **Cost-optimized:** Local for routine; cloud for complex tasks or after N local failures.
- **Performance:** Cloud only when latency budget allows; otherwise local.

### 21.3 Prompt & Tool-Calling Discipline
- All planning prompts use **structured tool calling** (JSON schemas) — no free-text plans.
- All inputs sanitized and length-bounded.
- Planner outputs validated; invalid plans regenerated up to N times.
- **Prompt registry** (Dify) stores versioned templates; changes require A/B testing.

### 21.4 Evaluation Harness
- 200+ representative workflows across web, desktop, OS.
- Cua-Bench integration: OSWorld, ScreenSpot, Windows Arena on every model change.
- Metrics: success rate, retries, latency, token cost, heal rate.
- Nightly on every model candidate.
- **Promotion criteria:** ≥ 95% of baseline success and ≤ 110% of baseline cost.

### 21.5 Continuous Learning
- Captured signals: heal outcomes, user thumbs-up/down, manual edits to AI plans.
- Used for: RAG corpus updates (LlamaIndex); prompt iteration (Dify); fine-tuning datasets (v2 small models).
- **Privacy:** customer data never used for global model training without explicit opt-in. Workspace-local fine-tuning offered for enterprise.

### 21.6 Safety & Guardrails
- Action allow/denylists per workspace.
- Cost ceilings per run / per workspace.
- HITL for high-risk steps (financial, irreversible deletes).
- **Prompt injection defenses:** strict tool-calling, content-source separation, untrusted-content sandbox.
- **PII scrubber** on screenshots and logs (configurable).

---

# 22. Security, Privacy & Compliance

### 22.1 Threat Model
- External attackers targeting tenant credentials and data.
- Compromised workflows running malicious actions.
- Prompt injection from untrusted page content.
- Supply-chain attacks on dependencies.
- Insider risk from workspace users.
- Sandbox escape from CUA VM/container environments.

### 22.2 Controls

| Control | Implementation |
|---|---|
| AuthN | OIDC / SAML / OAuth 2.1; MFA required for admins |
| AuthZ | RBAC with least-privilege; per-workflow ACL overrides |
| Secrets | Vault / KMS; never logged; ephemeral runtime injection |
| Network | mTLS service-to-service; egress filtering on workers |
| Sandboxing | Browser + MCP in Docker / micro-VM with seccomp + AppArmor; CUA = VM-level |
| Encryption | AES-256 at rest, TLS 1.3 in transit |
| Logging | Append-only audit; tamper-evident hash chain; exportable |
| Backups | Daily encrypted, geo-redundant; quarterly restore drills |
| Vulnerability mgmt | Dependabot / Snyk; SLA: critical < 24h |
| Incident response | Runbook, on-call rotation, customer notification SLA |
| SBOM | Generated per release; dependency scanning in CI |

### 22.3 Privacy
- Data residency selectable per workspace (US, EU, KSA at launch).
- Right to erasure within 30 days.
- DPA available for enterprise customers.
- AI inference can be configured to never leave the customer's region.
- Screenshots redacted of PII regions when configured.
- Open-source core allows customer audit of data handling.

### 22.4 Compliance Roadmap

| Standard | Target |
|---|---|
| SOC 2 Type I | Month 6 |
| SOC 2 Type II | Month 12 |
| GDPR / CCPA | Day 1 |
| ISO 27001 | Year 2 |
| HIPAA readiness | Year 2 |
| KSA PDPL alignment | Day 1 |
| OSS license compliance | Day 1 (FOSSA / Snyk) |
| EU AI Act preparation | Month 18 |

---

# 23. Performance & Scalability

### 23.1 Target Sizing (12 months post-GA)

| Resource | Capacity |
|---|---|
| Concurrent runs | 10,000 cluster-wide |
| Daily run volume | 5M+ |
| Workflow definitions | 5M+ across tenants |
| Screenshots / day | 100M+ (with TTL) |
| CUA sandboxes / day | 50,000+ |
| Activepieces connector calls / day | 1M+ |

### 23.2 Scaling Approach
- **Stateless services** behind LB; HPA on CPU and queue depth.
- **Workers** scale on queue length; customer-owned machines via secure agent.
- **CUA Sandbox pool** — pre-warmed for < 5s launch; auto-scaled.
- **Database** vertical first → read replicas → workspace-shard at > 10k tenants.
- **Object storage** — S3 / GCS / Azure Blob.
- **Vector DB** — workspace-sharded.
- **Caching** at API gateway and for hot UI mappings.
- **Async-by-default** — long planner / vision calls return job IDs.

### 23.3 Cost Optimization
- Local LLM by default; cloud as opt-in or per-feature.
- Aggressive caching of vision element maps with page-signature invalidation.
- Per-workspace cost budgets (soft + hard caps).
- Spot / preemptible workers for batch.
- CUA sandbox pooling + recycling.
- FinOps dashboards per workspace and per workflow.

---

# 24. UX / UI Requirements & Component Library
> `[Improved]` — concrete component standards, IA refined, accessibility checklist added.

### 24.1 Information Architecture
- **Home / Dashboard** — recent runs, alerts, recommendations.
- **Workflows** — library, search, filter, tags, status.
- **Builder** — full-screen canvas, palette, inspector, AI side panel.
- **Runs** — list + drill-down traces.
- **Approval Center** `[Added]` — pending requests, SLA timers, decision log.
- **Marketplace** — discover, install.
- **Integrations & Secrets** — vault, Activepieces piece browser, connection health.
- **AI Studio** — prompts (Dify), model selection, eval results.
- **FinOps** `[Added]` — cost dashboards, budgets, alerts.
- **Compliance & Audit** `[Added]` — audit logs, evidence exports, policy management.
- **Settings** — workspace, members, billing, security, regions.

### 24.2 Design Principles
- **Progressive disclosure** — simple by default, power on demand.
- **AI as collaborator, not magic** — always show what AI proposed and why.
- **Live feedback** — every change validated immediately.
- **Visual debugging** — screenshots and traces front-and-center.
- **No surprises** — destructive actions always confirmed; cost / time previewed.

### 24.3 UI Component Catalog (selected)

| Component | Purpose | Key states |
|---|---|---|
| Workflow Card | Library list item | default, draft, healthy, degraded, archived |
| Run Status Badge | Run list / dashboard | queued, running, succeeded, failed, paused, awaiting-approval |
| Heal Diff Viewer | Inspect a heal event | before/after selector, before/after screenshot, confidence |
| Approval Request Card | Approval Center | pending, approved, rejected, expired |
| Policy Violation Banner | Designer / promotion gate | inline rejection, with rule + remediation |
| Cost Preview Tile | Run start, planner output | cost estimate, model breakdown, budget remaining |
| Trace Drill-down | Run detail | per-node timeline, per-action screenshot, log viewer |
| Health Score Gauge | Workflow detail | 0–100 with trend, contributing factors |
| Anomaly Alert Toast | Dashboard | severity, link to run, acknowledge action |
| RBAC Matrix Editor | Settings | roles × permissions, with inheritance |

### 24.4 Builder UX Highlights
- **Command palette (Cmd/Ctrl-K)** for power users.
- **AI side panel** that converses to refine the workflow.
- **Inline node test** — run a single node against sample input.
- **Diff view** — visualize changes between versions.
- **Keyboard-first** layout; mouse-optional.
- **LangGraph subgraph visualization** — render agent reasoning graphs inline.
- **Embedded Dify prompt editor** for LLM nodes.

### 24.5 Accessibility Checklist
- WCAG 2.1 AA conformance verified per release.
- Color palette tested for color-blind users.
- All interactive nodes screen-reader labeled.
- Keyboard-only flow tested for canvas, palette, inspector, dialogs.
- Reduced-motion mode disables non-essential animation.
- RTL layout for Arabic / Hebrew.
- Focus management on modal open/close; focus trap on modals.

---

# 25. Integration Architecture

### 25.1 Native Integrations (v1)
- Google Workspace (Gmail, Drive, Calendar, Sheets, Docs)
- Microsoft 365 (Outlook, OneDrive, Excel, Teams)
- Slack, Discord
- Notion, Confluence
- Jira, Linear, GitHub, GitLab
- Salesforce, HubSpot, Zendesk
- AWS S3, generic SFTP, generic HTTP/REST, generic GraphQL

### 25.2 Activepieces Integration Runtime
- Activepieces piece catalog provides reusable integrations; AAOP exposes them as first-class typed nodes.
- Activepieces runs as embedded connector service; AAOP orchestrator invokes via internal contracts.
- Bi-directional: AAOP can execute Activepieces actions/flows; Activepieces-triggered events can start AAOP workflows via governed inbound triggers.
- Shared secret vault: AAOP secrets brokered into Activepieces connections via ephemeral vault references and scoped runtime tokens.

### 25.3 Integration Pattern
- Uniform **node interface** (auth, action set, schemas).
- OAuth flows handled by central **integration broker**.
- Tokens stored in vault; refresh handled centrally.
- Each integration is a versioned package — independent release cadence.

### 25.4 MCP Integration
- Built-in MCP client; can connect to any compliant MCP server.
- Bundled MCP servers for filesystem, shell, common desktop apps, browser control.
- Customer-deployed MCP servers via secure tunnel.

### 25.5 Custom Code Nodes
- JavaScript / Python sandboxed runners (Deno / pyodide / firejail).
- Limited stdlib; explicit network allowlist.
- Memory and CPU caps enforced.

---

# 26. DevOps, Cloud-Native & SRE Strategy
> `[Improved]` — concrete patterns: WAF rules, IAM trust boundaries, secrets brokering, rollback playbook, observability cardinality budgets.

### 26.1 Environments

| Env | Purpose | Topology |
|---|---|---|
| Dev | Per-engineer ephemeral | Namespace-per-dev on shared cluster; tilt/skaffold |
| Staging | Production-like; full eval suite | Multi-AZ; eval harness gate before promote |
| Production | Customer-facing | Multi-region active-active control plane; regional workers; per-tenant residency routing |

### 26.2 CI / CD

- **Trunk-based development** with feature flags (LaunchDarkly / OpenFeature).
- **PR gates:** review, CI green, security scan, design doc for major features.
- **Pipeline:** build → unit → contract → integration → SAST/DAST → SBOM → image sign (Cosign) → staging deploy → eval harness → progressive prod rollout (canary → 25% → 50% → 100%).
- **Rollback:** blue/green for control plane (≤ 2 min); feature flags for feature-level rollback (instant).
- **OSS publishing:** packages to npm/PyPI on every release; SemVer enforced.

### 26.3 Infrastructure Components

| Layer | Tooling | Notes |
|---|---|---|
| Container orchestration | Kubernetes (EKS / GKE / AKS) | Multi-region; node autoscaling; GPU node pools for inference |
| Service mesh | Istio (or Linkerd) | mTLS everywhere; traffic mirroring for canary |
| Ingress | Envoy + WAF (Cloudflare / AWS WAF) | OWASP CRS rules; bot protection; rate-limit by IP+token |
| Message bus | Redis Streams (default) → Kafka (enterprise) | Documented migration path |
| Observability | OpenTelemetry, Prometheus, Grafana, Loki, Tempo, LangSmith | Cardinality budget per service |
| Secrets | HashiCorp Vault or cloud KMS | Workload identity; ephemeral injection |
| CI/CD | GitHub Actions + ArgoCD | GitOps for cluster state |
| IaC | Terraform | Modular per layer; remote state with locking |
| Browser farm | Playwright workers in Docker; pooled, recycled | Image hardened; minimal user agent attack surface |
| CUA Sandbox farm | trycua/cua on QEMU/KVM or Apple Virtualization.Framework | Per-tenant isolation; pool size autoscaled |
| LLM serving | Ollama (local), vLLM / TGI (self-hosted), provider APIs (cloud) | Multi-provider abstraction |
| Integration runtime | Activepieces with AAOP adapters per execution namespace | Adapter boundary preserved |

### 26.4 IAM Trust Boundaries

```
[Customer Browser]
   ↓ (OIDC/SAML SSO)
[API Gateway + WAF]
   ↓ (workload identity, mTLS)
[Control Plane Services] ── (role-based service identity) ──> [Vault / KMS]
   ↓ (signed task tokens, short TTL)
[Worker Pool] ── (egress filter; per-tenant network policies)
   ↓ (ephemeral creds resolved at run start, never logged)
[External SaaS / Customer System]
```

**Principles:**
- No shared secrets across services; workload identity (SPIFFE / cloud IAM) only.
- Secrets never written to disk on workers; injected as env vars at process boundary, scrubbed from process memory after use where supported.
- Outbound egress restricted by allowlist per worker pool; deny-by-default.

### 26.5 WAF Policy (illustrative rules)
- OWASP Core Rule Set (paranoia level 2) on all public endpoints.
- IP-based rate limiting (5,000 req/min/IP for unauthenticated; 50,000/min/token for authenticated).
- Geo-restrictions configurable per tenant (e.g., KSA tenants can restrict to KSA + allowlist).
- Body size limit: 10MB default; configurable per route.
- Webhook endpoints: HMAC signature verification at WAF layer when possible.

### 26.6 Observability — Cardinality Budgets

| Signal | Target dimensions | Cardinality budget |
|---|---|---|
| Metrics (Prometheus) | service, workspace, status, environment | ≤ 100k active series / cluster |
| Traces (Tempo) | trace_id, run_id, node_id, engine | 100% sample for failed; 10% for succeeded |
| Logs (Loki) | service, level, workspace_id | structured JSON; 30-day hot retention |
| LLM traces (LangSmith) | model, prompt_version, eval_set | sample 100% on prompt-version change |

### 26.7 SLOs, Error Budgets, and Runbooks
- SLOs published per service; error budgets enforced (release freeze when budget exhausted).
- Runbooks for top 20 alert types; on-call rotation 24/7 once GA.
- Quarterly disaster recovery drill (region failover, restore from backup).
- Chaos engineering (gameday) twice yearly: kill workers, sever DB, fail provider APIs.

### 26.8 Rollback Playbook

| Trigger | Action | Target time |
|---|---|---|
| Bad deploy detected (SLO breach within 10 min) | Auto-rollback via ArgoCD blue/green | ≤ 2 min |
| Bad feature flag | Disable flag via console | ≤ 30 s |
| Bad model version | Switch routing back to prior | ≤ 1 min |
| Bad prompt version (Dify) | Revert via prompt registry | ≤ 1 min |
| Schema migration regression | Forward-fix preferred; reverse migration with data backfill drill | ≤ 60 min |

---

# 27. Edge Cases & Error Handling
> `[Added]` — explicit catalog of failure modes, recovery, and user-visible behavior.

| # | Failure Mode | Detection | Recovery / UX |
|---|---|---|---|
| **EC-1** | Network partition mid-run | Heartbeat timeout; checkpoint missed | Pause run; surface "awaiting reconnection"; resume from last checkpoint when network returns |
| **EC-2** | Sandbox pool exhausted | Sandbox launch timeout > 5s p95 sustained | Queue run with capacity message; auto-scale; promote to higher-priority pool for paying tiers |
| **EC-3** | Partial OAuth token failure | Provider 401 mid-run | Attempt refresh; if fail, pause and notify owner; secret rotation flag raised |
| **EC-4** | Clock skew on remote worker | NTP drift > 60s | Reject worker registration; alert admin; do not dispatch sensitive workloads |
| **EC-5** | Vision model disagreement (two models, different elements) | Confidence < threshold or bbox overlap < 0.5 | Escalate to LLM judge; if still ambiguous, request human approval |
| **EC-6** | DOM element exists but not interactable | Playwright click/visibility check fails | Wait + revalidate → vision fallback → MCP keystroke fallback |
| **EC-7** | Captcha / 2FA challenge | Page signature includes challenge marker | Pause, surface to user with screenshot; 2FA flow via approved providers only |
| **EC-8** | LLM rate-limited or 5xx | Provider error | Failover to alternate provider; if all fail, fall back to local model with reduced confidence; surface degraded mode |
| **EC-9** | Approval SLA expired | Timer fires | Per policy: auto-reject (default for high-risk) or escalate to backup approver |
| **EC-10** | Webhook payload exceeds size limit | WAF body-size rule | 413 with structured error; do not retry automatically |
| **EC-11** | Webhook replay attempt | Nonce/timestamp window violation | 401; alert workspace admin; do not execute |
| **EC-12** | Concurrent edit conflict in designer | OCC version mismatch | Show diff; user picks merge / overwrite / discard |
| **EC-13** | Schema migration in flight during run | Migration coordinator | Block runs that would touch migrating tables; resume after; surface short delay |
| **EC-14** | Customer cost cap reached mid-run | Budget guard | Pause run; notify owner; require explicit acknowledgement to resume |
| **EC-15** | Self-healing infinite loop | Heal counter > N (default 5) | Circuit-break workflow; route to human; record pattern for analysis |
| **EC-16** | Heal succeeded but post-action verification failed | Visual diff or LLM judge | Roll back step if reversible; halt if not; notify owner |
| **EC-17** | Activepieces piece deprecated upstream | Catalog drift detection | Warn at design time; block at deploy time once piece marked end-of-life |
| **EC-18** | Customer KMS unavailable (BYOK) | KMS health probe | Fail-closed for sensitive data ops; cached non-sensitive ops continue briefly |
| **EC-19** | Browser memory leak / runaway worker | Resource ceiling exceeded | Kill worker; recycle; mark image for investigation; rerun affected steps |
| **EC-20** | Region failover during run | Region health probe | In-flight runs paused at next checkpoint; resumed in healthy region |
| **EC-21** | Prompt injection detected in scraped content | Injection classifier flags content | Quarantine the content from planner; human review; do not execute generated plan from injected content |
| **EC-22** | Secret value attempted in log | Log scrubber detection | Redact at write; alert security; rotate secret if leaked path detected |
| **EC-23** | Time-based trigger storm (catch-up after outage) | Scheduler queue spike | Cap catch-up to N runs per workflow per hour; rest skipped with audit entry |
| **EC-24** | Customer revokes integration mid-run | OAuth provider error | Fail-fast on the dependent step; flag workflow as needing reconnection |
| **EC-25** | LangGraph checkpoint corruption | Checksum mismatch | Restart from prior valid checkpoint; alert; preserve corrupted state for diagnosis |

---

# 28. Testing & Quality Strategy

### 28.1 Test Pyramid
- **Unit** — per package, ≥ 80% coverage on core libs.
- **Contract** — service-to-service contracts (Pact / OpenAPI conformance).
- **Integration** — multi-service flows in staging.
- **End-to-end** — full workflow scenarios across DOM, vision, OS, API.
- **AI eval suite** — 200+ workflows, nightly.
- **Cua-Bench** — computer-use benchmarks on sandbox environments, nightly.
- **Load** — sustained 1k concurrent runs target.
- **Chaos** — random worker / DB / dependency failure (gameday twice yearly).
- **Security** — SAST, DAST, dependency scanning, annual pentest.

### 28.2 AI Eval Taxonomy `[Improved]`

| Tier | Purpose | Cadence |
|---|---|---|
| Regression | Catch behavioral regressions on existing workflows | Every commit |
| Capability | Measure new model / prompt capability on new tasks | Weekly |
| Safety | Adversarial / injection / policy-bypass prompts | Every model + prompt change |
| Drift | UI changes in target apps over time | Daily for tracked apps |

### 28.3 AI Quality Gates
- Every model upgrade must beat baseline on the eval suite or be rejected.
- Every prompt change must pass A/B test or be rejected.
- Heal-rate, false-heal-rate, user-override rate are first-class metrics.
- Cua-Bench regression: ≥ 90% success on OSWorld for vision model changes.

### 28.4 Beta & Dogfooding
- Internal team uses AAOP for our own ops (recruiting, finance, support).
- Closed beta with 20 design partners before GA.
- Public beta 8 weeks before GA with rate-limited access.
- OSS community beta for self-hosted edition.

---

# 29. Dependencies — Internal & External
> `[Added]` — explicit dependency map.

### 29.1 Internal Dependencies (cross-team)

| Dependency | Owner | Required by | Risk if late |
|---|---|---|---|
| Identity & SSO platform | Platform | Auth, all surfaces | Cannot enable enterprise procurement |
| Vault / KMS workload identity | Security | Workers, runtime | Secrets handling fallback insecure |
| Observability stack (OTel + Loki + Tempo) | SRE | All services | Reduced production confidence |
| Eval harness | AI/ML | Planner, CUA | Cannot promote models safely |
| FinOps dashboards | Platform | Pricing/GTM | Margin not measurable |
| Marketplace registry | Backend + GTM | Builders, vertical packs | Ecosystem flywheel delayed |

### 29.2 External Dependencies

| Dependency | Type | Mitigation |
|---|---|---|
| trycua/cua | OSS, MIT | Hexagonal abstraction; contributor relationship |
| LangGraph / LangChain / LlamaIndex | OSS, MIT | Multi-framework abstraction at orchestration layer |
| Activepieces | OSS, MIT | Adapter boundary; version-pin pieces |
| Healenium | OSS, Apache 2.0 | Replaceable via vision-only fallback |
| Playwright | OSS, Apache 2.0 | Provider abstraction; could swap for CDP-based alt |
| Anthropic / OpenAI / Google APIs | Commercial | Multi-provider routing; local fallback |
| Cloud providers (AWS/GCP/Azure) | Commercial | Multi-cloud-capable; abstracted via Terraform |
| OmniParser | OSS, CC-BY-4.0 | Replaceable with commercial VLM |
| Cosign / Sigstore | OSS | Industry standard; low risk |

### 29.3 Compliance & Legal Dependencies
- DPA template approval (Legal).
- Sub-processor list maintenance (Legal + Security).
- Customer-facing security documentation (CISO + DocOps).
- KSA PDPL legal review (regional counsel).

---

# 30. Risk Analysis & Mitigation

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|:---:|:---:|---|
| R-1 | LLM hallucination produces destructive plan | M | H | Tool-calling schemas, allowlists, HITL on risky actions, cost caps |
| R-2 | Prompt injection from web content | H | H | Content source separation, untrusted-content sandbox, planner cannot self-modify policies |
| R-3 | Vision model misidentifies UI element | M | M | Confidence thresholds, fallback engines, verify-after-action |
| R-4 | Self-healing infinite loop | L | M | Max heal attempts, circuit breaker, human escalation |
| R-5 | Customer credential leakage | L | H | Vault, ephemeral injection, never logged, encryption everywhere |
| R-6 | Cost overruns from cloud LLM usage | M | M | Per-workspace ceilings, default to local, FinOps dashboards |
| R-7 | Browser farm scalability bottleneck | M | M | Worker pooling, recycling, customer-side workers |
| R-8 | Regulatory shift (AI Act, data laws) | M | H | Modular compliance layer, regional residency, SOC 2/ISO roadmap |
| R-9 | Competitive pressure (incumbents copy features) | H | M | Speed of execution, marketplace lock-in, local-first differentiator |
| R-10 | Talent risk (specialist skills) | M | M | Distributed hiring, partnerships, contractor bench |
| R-11 | Dependency risk (Playwright / providers change terms) | L | M | Hexagonal abstractions, multi-provider, OSS forks where viable |
| R-12 | Customer data exposure via screenshots | M | H | PII redaction, region-restricted storage, configurable retention |
| R-13 | CUA sandbox escape | L | H | VM-level isolation, seccomp, AppArmor, regular audits |
| R-14 | OSS community fragmentation | M | M | Clear governance, CLA, paid core team, regular community calls |
| R-15 | Activepieces upstream drift | M | M | Adapter boundary, version pin, contribute upstream |
| R-16 | OAuth provider dependency outage | M | M | Multi-provider where feasible; graceful degradation; status page |
| R-17 | Pricing erosion from open-source clones | M | M | Vertical accelerators, governance, sovereign deployment as moat |
| R-18 | Misuse of platform (CSAM, illegal automation) | L | H | Acceptable use policy, content classifiers, abuse-response runbook |

---

# 31. Release Plan & Milestones
> `[Improved]` — adds engineering health gates per phase and DORA targets.

### 31.1 Phase Plan (18 months)

```
Phase 0  | Discovery & Foundations          | Months 1–2
Phase 1  | Alpha — Custom Workflow Core     | Months 3–5
Phase 2  | Closed Beta — Self-Healing + CUA | Months 6–8
Phase 3  | Public Beta — Marketplace + OSS  | Months 9–11
Phase 4  | GA Production Release            | Month 12
Phase 5  | v1.5 — Enterprise & SSO          | Months 13–15
Phase 6  | v2.0 — Multi-Agent & Mobile      | Months 16–18
```

### 31.2 Milestones with Engineering Health Gates

| Milestone | Month | Definition of Done | Engineering Health Gate |
|---|---|---|---|
| M0 — Architecture sign-off | 1 | High-level design + ADRs approved; OSS stack selected | Repo set up; CI green; SBOM generated |
| M1 — UI Builder APP | 3 | Drag, connect, save, run a 5-node workflow | Lead time ≤ 48h; coverage ≥ 70% |
| M2 — Playwright + Vision routing | 4 | Hybrid execution chooses correct engine on benchmark | DORA dashboards live |
| M3 — AI Planner v1 | 5 | NL → workflow with ≥ 60% first-try success on benchmark | Eval harness running nightly |
| M4 — CUA Sandbox integration | 6 | Sandboxes launch, execute, destroy reliably on Linux/macOS | Sandbox cold start < 5s p95 |
| M5 — Self-Healing v1 | 7 | Heal rate ≥ 70% on synthetic UI-change tests | Chaos test passed |
| M6 — Closed Beta launch | 8 | 20 design partners onboarded; Activepieces connector functional | MTTR ≤ 60 min in staging |
| M7 — Marketplace v1 | 10 | Publish, browse, install templates | Marketplace lint + scan in CI |
| M8 — Observability dashboards | 11 | Per-workflow analytics live; LangSmith integrated | Cardinality budgets enforced |
| M9 — OSS core release | 11 | Workflow engine + builder on GitHub under Apache 2.0 | OSS CI green; CLA bot live |
| M10 — GA Production Release | 12 | All P0 NFRs met; SOC 2 Type I; SLA published | DORA at GA targets |
| M11 — SSO + on-prem | 14 | First on-prem deployment in production | Air-gapped install validated |
| M12 — Multi-agent swarm | 17 | Two agents collaborating on a single workflow via LangGraph | Multi-agent eval suite running |

### 31.3 Sprint Cadence
- 2-week sprints, quarterly OKRs.
- Bi-weekly demo to leadership; monthly to design partners.
- Public changelog from Phase 2 onward.
- Monthly OSS community call from Phase 3 onward.

---

# 32. Team Structure & Resourcing

### 32.1 Org Chart (target by Month 12)

```
CTO / Head of Product
├── Frontend (4)        — Builder, dashboards, design system
├── Backend (5)         — API, workflow engine, integrations
├── AI / ML (4)         — Planner, CUA, evals, fine-tuning
├── Platform / SRE (3)  — Infra, observability, security
├── Design (2)          — Product design, UX research
├── QA / Eval (2)       — Test automation, AI eval harness
├── Developer Relations (1)
├── Product Manager (2)
├── Security & Compliance (1)
└── OSS Community (1)
TOTAL: ~26
```

### 32.2 Key Hires (priority order — first six months)
1. Founding Engineer, Workflow Engine
2. Founding Engineer, AI/Planner
3. Senior PM, Enterprise & Compliance
4. Staff SRE
5. Senior Designer, Builder UX
6. Security & Compliance Lead

---

# 33. Budget & Cost Considerations

### 33.1 Pricing Tiers `[Improved]` — value-tier rationale added

| Tier | Price | Includes | Why this tier |
|---|---|---|---|
| Free / OSS | $0 | Self-hosted, local LLM only, community support | Adoption funnel; OSS distribution |
| Pro | $49 / user / mo | 5,000 runs, cloud LLM credits, integrations, CUA sandboxes | Operator + small team; usage-aware |
| Team | $199 / user / mo | 50,000 runs, RBAC, SSO, Activepieces connector runtime | Mid-market; governance starts here |
| Enterprise | Custom | Unlimited, on-prem, dedicated success, SLA, custom models, sovereign deployment | Regulated, large ops, public sector |

### 33.2 Cost Drivers & Levers
- **Inference cost** — local-first routing, prompt caching, model downsizing.
- **Sandbox cost** — pooling, image hardening, recycling.
- **Storage** — TTL for screenshots, cold-tier for old runs.
- **Egress** — regional architecture; minimize cross-region data flow.
- **Support cost** — self-serve onboarding; in-product diagnostics.

---

# 34. Open Source Governance & Community

### 34.1 Governance Model
- **Benevolent Dictator + Core Team:** CTO is final arbiter; core team of 5 senior engineers has merge rights.
- **Technical Steering Committee (TSC):** formed at 50 external contributors; oversees roadmap, architecture, release cadence.
- **Working Groups:** domain-specific (CUA Integration WG, Self-Healing WG, etc.) with rotating leads.

### 34.2 Contribution Process
1. Issue triage within 48 hours; community votes on feature requests.
2. PRs require 2 core-team approvals; CI must pass; CLA signed.
3. Monthly minor releases; quarterly major releases; LTS branch for enterprise.
4. All features include docs PR; API docs auto-generated from OpenAPI.

### 34.3 Community Programs
- Ambassador program; bug bounty (HackerOne); quarterly hackathons; weekly office hours.

### 34.4 Commercial vs. OSS Boundary

| Feature | OSS (Apache 2.0) | Commercial |
|---|---|---|
| Workflow engine | ✅ | — |
| UI Builder | ✅ | — |
| Playwright DOM | ✅ | — |
| Basic AI Planner (local) | ✅ | — |
| REST API (core) | ✅ | — |
| PostgreSQL schema | ✅ | — |
| CUA Sandbox orchestration at scale | — | ✅ |
| Cloud LLM integration | — | ✅ |
| Advanced self-healing | — | ✅ |
| Activepieces connector runtime (managed) | — | ✅ |
| Enterprise RBAC / SSO | — | ✅ |
| Marketplace monetization | — | ✅ |
| Managed hosting / SLA | — | ✅ |

---

# 35. Open Questions

1. Final brand and product name (AAOP is working title).
2. Self-host vs. SaaS-first for initial GTM — which to optimize?
3. Should the marketplace launch with paid templates from day 1, or only free?
4. SLA / refund policy for cloud customers in v1?
5. How aggressive should the local-first stance be in marketing?
6. Which 3 integrations matter most for the first vertical (finance vs. HR vs. retail)?
7. Build vs. partner: do we build our own VLM or rely on Anthropic / OpenAI?
8. KSA / Middle East as a launch region — what compliance + localization is required?
9. How do we surface heal-rate to end users without eroding trust?
10. How deep should the embedded Activepieces layer go vs. AAOP-native connectors for strategic integrations?
11. Contribution model for CUA ecosystem — upstream-first or fork-and-patch?
12. How do we monetize the OSS edition without alienating the community?
13. Governance transition plan from benevolent dictator to TSC?
14. **`[Added]`** Should we offer an audit-only "compliance read replica" tenant model for regulated buyers?
15. **`[Added]`** What is our position on EU AI Act high-risk classification for the platform?

---

# 36. Glossary

| Term | Definition |
|---|---|
| **AAOP** | AI Agent Orchestration Platform — the product. |
| **Agent** | Autonomous component that perceives, plans, and acts. |
| **Approval Center** | Surface where pending HITL approvals are routed, tracked, and decided. |
| **CUA** | Computer-Using Agent — vision-grounded agent that operates a UI like a human. |
| **CUA Sandbox** | Isolated VM/container environment for safe agent execution (trycua/cua). |
| **DAG** | Directed Acyclic Graph — workflow execution model. |
| **DOM** | Document Object Model — structured representation of a web page. |
| **DORA** | DevOps Research & Assessment metrics: deploy frequency, lead time, MTTR, change failure rate. |
| **Heal** | Automatic recovery action by the Self-Healing Engine. |
| **MCP** | Model Context Protocol — standardized agent-tool interface. |
| **Node** | Single step in a workflow graph. |
| **Planner** | LLM service turning intent into executable plans. |
| **Policy-as-Code** | Machine-readable rules enforced at design / deploy / run time. |
| **RAG** | Retrieval-Augmented Generation. |
| **RPA** | Robotic Process Automation. |
| **Selector** | CSS / XPath query locating a DOM element. |
| **VLM** | Vision-Language Model. |
| **Workflow** | User-authored automation defined as a graph of nodes. |
| **Workspace** | Multi-user tenant container. |
| **LangGraph** | Graph-based agent orchestration framework from LangChain. |
| **LlamaIndex** | Data framework for connecting LLMs to data. |
| **Activepieces** | OSS automation/connector framework used as embedded integration runtime. |
| **Dify** | OSS LLM application development platform. |
| **Healenium** | OSS self-healing library for UI automation. |
| **OmniParser** | Microsoft research project for parsing UI screenshots into structured elements. |

---

# 37. Appendices

### Appendix A — End-to-End Example Walkthrough

**Goal:** *"Every weekday at 9 AM, log into our bank, download yesterday's statement, save it to Google Drive, and post a summary to #finance Slack."*

1. **Author:** Operator Omar types the goal into the AI assistant. The Planner (LlamaIndex RAG retrieves similar past workflows) generates an 8-node graph and renders it on the canvas.
2. **Review:** Omar inspects nodes; he edits the credentials reference and sets the schedule to 09:00 KSA time.
3. **Test run:** He runs once manually inside a CUA Sandbox (Linux + Chrome). Step 4 ("click Download") fails — the bank changed the layout overnight.
4. **Self-heal:** The engine captures a screenshot, Healenium attempts ML-based selector remap, fails, then the CUA finds the new "Download statement" button via vision, generates a new selector, retries successfully, and updates the UI mapping store.
5. **Activepieces connector runtime:** Statement downloads to a temp folder, is processed by a custom reconciliation action built on Activepieces, summarized by an LLM node, and posted to Slack via an Activepieces-backed connector.
6. **Agent review:** A LangGraph agent node reviews the summary for anomalies and flags a discrepancy for human review.
7. **Schedule:** The schedule activates; subsequent days run unattended inside fresh sandboxes. The next time the bank UI changes, the prior heal makes recovery faster.

### Appendix B — Architecture Decision Records (initial set)

- **ADR-001:** React Flow over BPMN for the canvas (developer ergonomics).
- **ADR-002:** Adopt MCP as the OS / tool interface standard.
- **ADR-003:** PostgreSQL primary; pgvector before introducing Qdrant.
- **ADR-004:** Local-first LLM by default; cloud opt-in.
- **ADR-005:** Hexagonal architecture for swappable engines.
- **ADR-006:** Redis Streams for v1 message bus; Kafka migration documented for enterprise scale.
- **ADR-007:** Adopt trycua/cua as primary CUA infrastructure.
- **ADR-008:** Adopt LangGraph for agent orchestration layer.
- **ADR-009:** Adopt LlamaIndex for RAG and memory retrieval.
- **ADR-010:** Adopt Activepieces as embedded connector runtime; AAOP retains custom orchestration.
- **ADR-011:** Adopt Dify for prompt management and LLM app lifecycle.
- **ADR-012:** Adopt Healenium for ML-based DOM self-healing.
- **ADR-013:** Open-core model — engine + builder Apache 2.0; commercial features proprietary.
- **ADR-014:** Adopt OmniParser for local UI element detection.
- **ADR-015:** Adopt browser-use for programmatic web agent workflows.
- **ADR-016:** `[Added]` Adopt OPA/Rego for policy-as-code; embedded library + sidecar mode.
- **ADR-017:** `[Added]` Adopt Cosign + SLSA L3 for supply chain integrity.

### Appendix C — Reference Workflow Categories for Marketplace (seed list)

- **Finance:** invoice ingestion, bank reconciliation, expense reporting.
- **HR:** candidate sourcing, onboarding, offboarding.
- **Sales / RevOps:** lead enrichment, CRM hygiene, pipeline reporting.
- **Customer Support:** ticket triage, KB sync, SLA monitoring.
- **IT Ops:** account provisioning, license audits, ticket auto-resolve.
- **Procurement:** vendor PO creation, three-way match.
- **Marketing:** competitor monitoring, content cross-posting, lead scoring.
- **DevOps:** CI/CD pipeline monitoring, deployment automation, incident response.
- **QA:** visual regression testing, cross-browser automation, sandbox-based testing.
- **Public Sector:** form submission, regulatory filings, eligibility checks.
- **Healthcare:** claims reconciliation, prior-authorization tracking.

### Appendix D — Build/Buy Decisions

| Component | Decision | Notes |
|---|---|---|
| Browser automation | OSS: Playwright | Mature, well-maintained |
| Local LLM serving | OSS: Ollama | Excellent DX, cross-platform |
| Vision parsing | Hybrid: OmniParser + cloud VLM | Local for privacy, cloud for accuracy |
| OCR | OSS: PaddleOCR | Multi-language |
| Vector DB | OSS: pgvector first | Simpler ops; migrate if scale demands |
| Auth | Build on Auth.js / Keycloak | Avoid rolling our own crypto |
| Workflow engine | Build | Core IP; differentiator |
| Self-healing engine | Build | Core IP; differentiator |
| Observability | OSS: OTel + Grafana | Standard stack |
| CUA Infrastructure | OSS: trycua/cua | Best-in-class |
| Agent Orchestration | OSS: LangGraph | Production-grade stateful graphs |
| RAG / Memory | OSS: LlamaIndex | Leading framework |
| Integration Runtime | OSS: Activepieces | AAOP keeps orchestration core IP |
| Prompt Management | OSS: Dify | Open-source LLM app platform |
| DOM Self-Healing | OSS: Healenium | ML-based selector recovery |
| Web Agent | OSS: browser-use | Programmatic browser agent |
| Policy engine | OSS: OPA | `[Added]` Industry standard |
| Supply chain | OSS: Cosign + SLSA | `[Added]` Industry standard |

### Appendix E — Definition of Done (any user-facing feature)
1. Functional spec linked to PRD with GWT acceptance criteria.
2. Design review approved.
3. Unit + integration tests, ≥ 80% coverage on touched code.
4. Telemetry: events emitted, dashboards updated.
5. Documentation: user guide + API reference updated.
6. Accessibility check passed.
7. Security review for any new data flow or external dependency.
8. Feature flagged; rolled out progressively.
9. Eval harness updated where AI behavior changed.
10. Runbook entry for on-call.
11. OSS docs updated (if touching core).
12. CLA check passed for external contributions.
13. **`[Added]`** Edge cases from Section 27 addressed where applicable.

### Appendix F — Open Source License Compliance Matrix

| Dependency | License | Usage | Compliance Action |
|---|---|---|---|
| trycua/cua | MIT | CUA infrastructure | Attribution; contribute upstream |
| LangGraph | MIT | Agent orchestration | Attribution; contribute upstream |
| LangChain | MIT | LLM framework | Attribution; contribute upstream |
| LlamaIndex | MIT | RAG / memory | Attribution; contribute upstream |
| Activepieces | MIT | Embedded integration runtime | Full compliance; contribute upstream where strategic |
| Dify | Apache 2.0 | Prompt management | Full compliance; can fork if needed |
| Healenium | Apache 2.0 | Self-healing DOM | Full compliance; can fork if needed |
| Playwright | Apache 2.0 | Browser automation | Full compliance |
| OmniParser | CC-BY-4.0 | Screen parsing | Attribution required |
| browser-use | MIT | Web agent | Attribution; contribute upstream |
| Ollama | MIT | Local LLM serving | Attribution |
| pgvector | PostgreSQL License | Vector DB | Full compliance |
| OpenTelemetry | Apache 2.0 | Observability | Full compliance |
| CrewAI | MIT | Multi-agent reference | Attribution |
| OpenHands | MIT | Coding agent integration | Attribution; contribute upstream |
| Agno | MIT | Lightweight agent framework | Attribution |
| OPA | Apache 2.0 | Policy engine `[Added]` | Full compliance |

### Appendix G — Sample Kubernetes Manifest Patterns `[Added]`

```yaml
# Minimal Workflow Worker Deployment (illustrative, redacted)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: workflow-worker
  namespace: aaop-runtime
spec:
  replicas: 6
  selector:
    matchLabels: { app: workflow-worker }
  template:
    metadata:
      labels: { app: workflow-worker }
      annotations:
        sidecar.istio.io/inject: "true"
    spec:
      serviceAccountName: workflow-worker-sa     # SPIFFE identity
      automountServiceAccountToken: true
      containers:
        - name: worker
          image: ghcr.io/aaop/worker@sha256:...  # signed by Cosign
          resources:
            requests: { cpu: "500m", memory: "512Mi" }
            limits:   { cpu: "2",    memory: "2Gi" }
          securityContext:
            runAsNonRoot: true
            readOnlyRootFilesystem: true
            allowPrivilegeEscalation: false
            capabilities: { drop: ["ALL"] }
          env:
            - name: VAULT_ADDR
              valueFrom: { configMapKeyRef: { name: aaop-config, key: vault_addr } }
          volumeMounts:
            - { name: tmp, mountPath: /tmp }
      volumes:
        - { name: tmp, emptyDir: {} }
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata: { name: workflow-worker, namespace: aaop-runtime }
spec:
  scaleTargetRef: { apiVersion: apps/v1, kind: Deployment, name: workflow-worker }
  minReplicas: 6
  maxReplicas: 200
  metrics:
    - type: Resource
      resource: { name: cpu, target: { type: Utilization, averageUtilization: 65 } }
    - type: External
      external:
        metric: { name: queue_depth, selector: { matchLabels: { queue: workflows } } }
        target: { type: AverageValue, averageValue: "10" }
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: workflow-worker-egress, namespace: aaop-runtime }
spec:
  podSelector: { matchLabels: { app: workflow-worker } }
  policyTypes: [Egress]
  egress:
    - to:
        - namespaceSelector: { matchLabels: { name: aaop-data } }
    - to:
        - ipBlock: { cidr: 0.0.0.0/0 }
      ports:
        - { protocol: TCP, port: 443 }   # HTTPS only by default
```

### Appendix H — Sample Terraform Module Structure `[Added]`

```
infra/
├── modules/
│   ├── network/        # VPC, subnets, NAT, peering
│   ├── eks/            # Cluster, node groups, IRSA, OIDC
│   ├── data/           # RDS Postgres, S3 buckets, encryption
│   ├── secrets/        # Vault deployment, KMS keys, IAM trust
│   ├── observability/  # OTel collector, Prom, Loki, Tempo, Grafana
│   ├── waf/            # WAF rules, ACLs, rate limiting
│   ├── cdn/            # Front-door + edge cache
│   └── sandbox-pool/   # CUA sandbox infra (KVM hosts or AVF)
└── envs/
    ├── dev/
    ├── staging/
    └── prod-{us,eu,ksa}/
```

---

**End of Document — v6.0 Enhanced Production Edition**

> *This PRD is a living document. Contributions are welcome via PR to the `/docs/prd/` repository. Material changes require sign-off from Product, Engineering, Design, Security, and Open Source Governance.*
