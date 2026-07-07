# 10 · Technical Architecture

Derived from requirements, not preference. Full justifications in `docs/adr/`. This section states the requirements first, then the design that falls out of them.

## 1. Requirements that drive everything

| # | Requirement (from business docs) | Architectural consequence |
|---|---|---|
| R1 | Money-adjacent correctness: milestone gates, double-entry ledger, immutable evidence, auditability | Relational DB with strong constraints & transactions → **PostgreSQL**; append-only patterns; DB-level invariants where possible |
| R2 | Tiny engineering team (4–6) must ship a service business's whole surface | **Modular monolith**, one language across stack, managed infrastructure, minimal ops (ADR-0001, ADR-0002, ADR-0003) |
| R3 | Field conditions: low-end Androids, intermittent connectivity, data-cost sensitivity | **Offline-first PWA**, aggressive media handling (client-side compression, resumable uploads), no app-store friction for contractors (ADR-0004) |
| R4 | WhatsApp is the customer's habitat; portal is the system of record | Notification orchestration + template messaging via WhatsApp BSP; deep links; approvals only in-portal (ADR-0006) |
| R5 | Media-heavy: thousands of photos/videos per project, retained ~permanently | Object storage with lifecycle tiering; hash-at-upload integrity; CDN delivery |
| R6 | Kenya DPA + trust brand: data residency defensibility, RLS-grade isolation between parties | Postgres **Row-Level Security** as a real defense layer; af-south-1 region; audit trails (ADR-0003, doc 11) |
| R7 | Workflow variability (counties, milestone types) without per-case code | Template-driven workflow engine as data (`workflow_templates`) |
| R8 | Payments: instruct-and-reconcile against bank/M-Pesa rails; we never hold funds | Adapter-based payment integration; instruction files/APIs + callback reconciliation; idempotency keys everywhere money moves |
| R9 | Score/data moat: events must be replayable years later | Append-only `domain_events` + `reliability_score_events`; formula versioning |
| R10 | Cost: infra ≤ ~USD 500/mo pre-scale | Managed PaaS over self-run Kubernetes; serverless where idle-heavy |

## 2. System design

```
                        ┌───────────────────────────────────────────┐
   Owner (P1–P3)  ──────►                                           │
   Ops staff      ──────►   Next.js app (TypeScript, App Router)    │
   Field users    ──────►   web portal · ops console · field PWA    │
   Pros (Ph.2)    ──────►   (one codebase, role-scoped surfaces)    │
                        └───────┬───────────────────────────────────┘
                                │ typed server actions / route handlers
                        ┌───────┴───────────────────────────────────┐
                        │  Domain modules (modular monolith)        │
                        │  identity · network · delivery · money ·  │
                        │  evidence · workflow · comms · homefile   │
                        │  — module interfaces + domain-event outbox│
                        └───────┬───────────────────────────────────┘
                                │
        ┌────────────┬──────────┴────────┬──────────────┬───────────┐
        │ Supabase   │ Supabase Storage  │ Edge/cron    │ Adapters  │
        │ Postgres   │ (media, docs)     │ workers      │ WhatsApp  │
        │ + RLS      │ + CDN             │ (outbox,     │ BSP · bank│
        │ + Auth     │                   │ reports,     │ files ·   │
        │            │                   │ media checks)│ M-Pesa    │
        └────────────┴───────────────────┴──────────────┴───────────┘
```

**Stack:** TypeScript everywhere · Next.js (App Router) on Vercel · Supabase (Postgres 15+, Auth, Storage, in AWS af-south-1) · background work via Supabase cron + queue-table workers (no broker until metrics demand one) · WhatsApp Business API via a BSP · Sentry + structured logs · GitHub Actions CI. Rationale and revisit-triggers per component in ADR-0002/0003/0005.

## 3. Cross-cutting designs

**Authorization (layered):** (1) Supabase Auth session → (2) application-layer policy checks in module services (the source of truth for business rules like "only `owner_approver` may release") → (3) **Postgres RLS as the backstop** so that even a bug in layer 2 cannot leak one project's data to another party. RLS policies derive from `project_members` and staff roles. Storage buckets mirror the same policies via path conventions + signed URLs.

**Evidence integrity pipeline:** client computes SHA-256 + captures EXIF/geo → resumable upload to Storage → worker validates (hash match, EXIF consistency, geofence, duplicate-hash lookup, perceptual-hash near-duplicate flag) → `evidence_items` row marked `verified_origin` or flagged. Originals immutable; derivatives (thumbnails, compressed web versions) generated alongside, never replacing.

**Money movement:** owner approval (portal, re-authenticated for large releases) → `disbursements` row `instructed` with idempotency key → adapter emits bank instruction (file/API per partner capability) → callback/manual confirmation → reconciliation posts balanced `ledger_entries` → contractor + owner notified. Every state change audited. Manual-execution mode (validation phase) uses the same tables with a human executing the instruction — the system is the record either way.

**Workflow engine (deliberately boring):** `workflow_templates` (JSON step definitions: checklist items, required documents, role assignments, gates) instantiated as `workflow_instances`/`workflow_steps` per project. No BPMN engine — a status machine over rows, because our workflows are checklists with gates, not arbitrary graphs. Revisit if we ever need parallel branching beyond what step dependencies express.

**Offline field app:** PWA with IndexedDB queue for checklists and media capture; background sync; conflict policy is append-only (field data is observations, not edits, so conflicts are rare by construction). Media upload deferred to Wi-Fi optionally.

**Notifications:** orchestration module maps domain events → channel templates (WhatsApp primary, SMS fallback, email for documents) with per-user preferences, quiet hours (diaspora time zones — send at recipient-local morning), digest batching, and delivery tracking.

## 4. Environments, delivery, operations

- `main` → production; PR previews (Vercel) + a persistent staging Supabase branch with seeded synthetic data. Migrations via Supabase CLI, forward-only, reviewed like code.
- Backups: PITR on Postgres; storage versioning; quarterly restore drills (calendar item, not aspiration).
- Observability: Sentry (errors), structured request/domain-event logs, a small ops-metrics dashboard (approval latency, disbursement cycle, queue depths) built on our own data — our SLAs are business SLAs.
- Cost posture at pilot scale: Vercel + Supabase Pro + BSP fees ≈ USD 200–400/mo (R10 satisfied).

## 5. Evolution path (pre-decided so growth is boring)

| Trigger | Move |
|---|---|
| Queue-table workers hit contention / need fan-out | Introduce real queue (SQS/Upstash) behind existing outbox interface |
| Media processing grows heavy | Extract media worker to dedicated service (interfaces already isolate it) |
| Bank/API partners demand uptime isolation | Extract Money adapters behind stable internal API |
| East Africa expansion | Country packs (workflow templates, contract packs, rails adapters); per-country data-residency review; schema already carries `country_code` on jurisdictional entities |
| Team > ~10 engineers | Consider service extraction along context boundaries — the outbox + module discipline makes this a refactor, not a rewrite |
