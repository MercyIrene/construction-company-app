# 12 · Implementation Plan & Engineering Standards

## 1. Sequencing logic

Engineering follows validation (doc 03): months 0–6 build only the **thin spine** while concierge pilots run; the Phase-1 build starts at the month-6 gate. The schema in `supabase/migrations/` is deliberately complete now — data capture starts on day one even where features come later (events before features), and migrations thereafter are additive.

## 2. Twelve-month engineering schedule

| Months | Epic | Delivers |
|---|---|---|
| 0–1 | **E0 Foundation** | Repo scaffold, CI, environments, auth, schema applied, RLS test harness, design tokens/UI kit, seed data |
| 1–3 | **E1 Thin spine** | Projects/milestones/budgets CRUD (ops console), evidence upload + validation pipeline, evidence-pack pages, owner magic-link access + release approval with audit, manual-ledger recording, WhatsApp template notifications |
| 3–6 | **E2 Pilot hardening** | Snags, checklists, weekly-report drafting, decision requests, document vault, intake + feasibility snapshot tool. *Gate: month-6 validation review* |
| 6–9 | **E3 Core loop v1** | Milestone templates, hard evidence gates, QS certification flow, variation flow, full double-entry ledger with retention/WHT, disbursement instruction generation + reconciliation, owner portal GA (bilingual) |
| 9–12 | **E4 Field & workflow** | Offline field PWA (capture, checklists, snag closure), inspection routing, hold-point enforcement, workflow engine + first county permit templates, vetting pipeline, Home File v1 |
| parallel | **E∞ Hardening** | RLS suite growth, pen test (pre-E3 GA), restore drills, load ratio dashboards |

Team: 2 founding engineers months 0–6; +2 at month 6; +1 product designer (contract → hire). Anything beyond this plan gets cut before quality does.

## 3. Repository structure (monorepo)

```
apps/web/                 Next.js app (portal, ops console, field PWA, pro portal)
  src/app/(owner)/        owner-facing routes
  src/app/(ops)/          staff console routes
  src/app/(field)/        field PWA routes
  src/modules/<context>/  domain modules: delivery, money, evidence, network,
                          workflow, comms, homefile, identity
      service.ts          module public interface (only import surface)
      repo.ts             data access (module-private)
      events.ts           domain events emitted/consumed
      __tests__/
packages/domain/          shared types, zod schemas, state machines (pure TS)
packages/ui/              design system components
supabase/migrations/      SQL migrations (forward-only)
supabase/tests/           RLS + DB invariant tests (pgTAP)
docs/                     this body of work; ADRs in docs/adr
```

**Module boundary rule (enforced by ESLint import rules):** app routes import module `service.ts` only; modules import other modules' `service.ts` only; nobody imports another module's `repo.ts` or tables. This is the discipline that keeps the monolith modular (ADR-0001).

## 4. Engineering standards

- **Language/quality:** TypeScript strict; ESLint + Prettier; no `any` in `packages/domain`; state machines defined once in `packages/domain` and reused by UI, services, and DB checks.
- **Testing pyramid:** pure-domain unit tests (state machines, ledger math, score function — property-based where numeric); module service tests against a real Postgres (Supabase local) — no mocked DB for money paths; RLS tests per table (merge-blocking); Playwright E2E for the five critical journeys (intake→setup, claim→certify→approve→disburse, evidence capture offline→sync, dispute open→resolve, handover→Home File).
- **Money-path rule:** any code path that can move or record money requires: property/invariant tests, idempotency test, audit-log assertion, and a second reviewer.
- **Migrations:** forward-only, reviewed like product code, each with a rollback note; destructive changes require a data-preservation plan.
- **Definition of done:** deployed to staging, tests green, RLS covered, audit events emitted, docs updated (ADR if a decision was made), i18n keys extracted.
- **Git/PR:** trunk-based with short-lived branches; PR template includes "money path touched? RLS touched?" checkboxes; CI: typecheck, lint, unit, DB tests, RLS suite, E2E smoke.

## 5. Delivery risks

| Risk | Mitigation |
|---|---|
| Thin spine scope creep during pilots | E1/E2 scope is written down (doc 08 §3); weekly cut-list review; ops asks become playbook entries before product tickets |
| Offline PWA complexity sink | Ship online-first capture in E1; offline queue is its own epic (E4) with a spike first; fall back to "capture offline via native camera + guided upload" if sync proves gnarly |
| Bank integration timeline slips (external dependency) | Manual-execution mode is a permanent, first-class fallback — automation is an optimization, never a blocker |
| Two-engineer bus factor | Everything in this repo; pairing on money paths; no hero systems |

## 6. What "implementation-ready" means here

An engineer starting Monday: clones the repo, runs Supabase local, applies `supabase/migrations`, reads docs 09–11 and the ADRs, and begins E0 with unambiguous scope. Open items that intentionally await validation data are marked in doc 03 — nothing else should be ambiguous. Gaps discovered during build are treated as documentation bugs: fix the doc, then the code.
