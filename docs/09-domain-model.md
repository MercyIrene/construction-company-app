# 09 · Domain Model

Domain-driven design applied pragmatically: one system, clearly separated **bounded contexts**, a shared ubiquitous language, and module boundaries that mirror the contexts (ADR-0001). The PostgreSQL schema in `supabase/migrations/` is the executable form of this document.

## 1. Bounded contexts

```
┌────────────────┐  ┌────────────────────┐  ┌───────────────────┐
│ Identity &     │  │ Professional        │  │ Project Delivery  │
│ Access         │  │ Network             │  │ (CORE)            │
│ people, orgs,  │  │ vetting, tiering,   │  │ projects, stages, │
│ roles, auth    │  │ credentials,        │  │ milestones, tasks,│
└──────┬─────────┘  │ reliability events  │  │ inspections, snags│
       │            └─────────┬──────────┘  └────────┬──────────┘
       │                      │                      │
┌──────┴─────────┐  ┌─────────┴──────────┐  ┌────────┴──────────┐
│ Money          │  │ Evidence &         │  │ Workflow &        │
│ budgets, BoQ,  │  │ Documents          │  │ Compliance        │
│ disbursements, │  │ media, integrity,  │  │ templates, permit │
│ ledger,        │  │ evidence packs,    │  │ processes, gates  │
│ retention      │  │ document vault     │  │                   │
└────────────────┘  └────────────────────┘  └───────────────────┘
┌────────────────┐  ┌────────────────────┐
│ Communication  │  │ Home File          │
│ threads,       │  │ as-built record,   │
│ notifications, │  │ warranties,        │
│ decisions      │  │ maintenance        │
└────────────────┘  └────────────────────┘
```

**Core domain** (where we out-invest everyone): Project Delivery + Evidence + Money — the verified milestone loop. **Supporting:** Professional Network, Workflow & Compliance, Home File. **Generic** (buy/adopt): Identity & Access (Supabase Auth), Communication transport (WhatsApp BSP, email).

## 2. Ubiquitous language (excerpt — the terms everyone must use identically)

| Term | Definition |
|---|---|
| **Project** | One home-construction engagement for one owner on one site |
| **Stage** | Major journey phase: `setup`, `design`, `approvals`, `construction`, `handover`, `defects_liability`, `closed` |
| **Milestone** | A contracted, payable unit of physical progress with a checklist, a value, and an evidence requirement. *The* atomic trust unit |
| **Evidence item** | A media file or document with capture metadata and integrity hash; `verified_origin` if captured through the field app inside the geofence |
| **Evidence pack** | The assembled bundle a milestone claim must present to pass its hard gate |
| **Certification** | A professional's formal attestation (QS valuation, engineer sign-off, inspector pass) — always attributable, always evidence-linked |
| **Release approval** | The owner's explicit authorization to disburse against a certified milestone |
| **Disbursement** | An instructed movement of funds from the project account; splits into contractor payment, fee tranche, retention withholding, WHT |
| **Hold point** | A stage that must not proceed without inspection sign-off |
| **Snag** | A defect observation with photo anchor, severity, assignee, and closure evidence |
| **Variation** | An owner-pre-approved change to scope/cost/schedule, priced before execution |
| **Reliability event** | An immutable, machine-derived fact about professional performance feeding the score |
| **Home File** | The permanent structured record of the home, owned by the owner |

## 3. Aggregates & invariants (the rules the software must make unbreakable)

**Project** (root of delivery context)
- Has exactly one owner party, one site, one active baseline budget version.
- Stage transitions follow the defined state machine; entering `construction` requires: signed construction contract, permits recorded, funded project account, approved baseline.

**Milestone**
- States: `planned → in_progress → claimed → certified → approved → disbursed → closed` (+ `disputed`, `cancelled` side-states).
- Invariants: cannot reach `claimed` without a complete evidence pack (hard gate); cannot reach `approved` without required certifications; cannot reach `disbursed` without owner release approval; monetary value changes only via approved variation.

**Evidence item**
- Immutable after upload (hash-anchored); metadata corrections append, never overwrite.

**Ledger**
- Double-entry, append-only; every disbursement produces balanced entries across project-account, contractor-payable, fee-revenue, retention-held, and WHT accounts; corrections are reversing entries.

**Reliability events**
- Append-only; score is a pure function `f(events, formula_version)` — recomputable at any time; no manual score writes exist anywhere in the system.

**Vetting**
- A professional may take platform work only with all five gates `passed` and unexpired licence verifications; tier caps enforced at assignment time.

## 4. Key state machines

```
Milestone:  planned → in_progress → claimed → certified → approved → disbursed → closed
                          ↑            │  (evidence gate)      │ (owner-only action)
                          └─ rejected ─┘        disputed ⇄ (any post-claim state)

Project stage: lead → setup → design → approvals → construction → handover
               → defects_liability → closed        (pause allowed from any active stage)

Vetting gate:  pending → in_review → passed | failed | waived(reasoned, senior-approved)

Dispute:       opened → dm_review → hod_review → arbiter → resolved | withdrawn
```

## 5. Context interactions (chosen integration styles)

- Within the modular monolith, contexts call each other through **module service interfaces**, never through each other's tables (enforced by module boundaries + lint rules, doc 12 §4).
- Cross-context facts propagate as **domain events** on an outbox table (`domain_events`): e.g., `milestone.certified` → Money prepares disbursement; `milestone.disbursed` → Professional Network appends reliability events; `project.handover_completed` → Home File assembles the archive. The outbox gives us audit, async processing, and a future path to extracted services without a message broker today (ADR-0001).
- External integrations (bank files, WhatsApp, M-Pesa confirmation callbacks) live in adapter modules at the edge; the domain never imports vendor SDKs.

## 6. Identity model note

People are `users` (auth identities) linked to `parties` (legal/commercial actors: individuals or organizations). A contractor firm is a party with member users; the *firm* holds vetting status and score; users hold roles. Owners may have multiple stakeholders on one project (spouse, diaspora sibling co-funder) with distinct permissions — `project_members` with roles (`owner_primary`, `owner_viewer`, `owner_approver`) covers the real family dynamics of Kenyan home building (approval rights are explicit, not assumed).
