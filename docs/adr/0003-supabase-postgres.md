# ADR-0003 · Supabase (managed PostgreSQL + Auth + Storage), af-south-1

**Status:** Accepted · 2026-07-07

## Context
R1 demands relational integrity and transactions (ledger, milestone gates); R6 demands tenant isolation and data-residency defensibility; R5 demands object storage for heavy media; R10 caps infra spend; R2 caps ops headcount at zero dedicated.

## Decision
**PostgreSQL** is non-negotiable for the domain (constraints, transactions, RLS, mature tooling). We consume it via **Supabase** hosted in **AWS af-south-1 (Cape Town)**: managed Postgres with PITR, Auth (email/phone/OTP — phone-first fits our users), Storage with CDN and policy-controlled access, and cron/queues for background work.

## Rationale
- Buys auth, storage, backups, and connection infrastructure for ~USD 25–100/mo — months of engineer time redirected to the core loop.
- **RLS as a product feature:** Supabase's model pushes us to write row-level policies, which is exactly the T4 backstop doc 11 requires.
- Zero lock-in of substance: it is standard Postgres + S3-compatible storage; the exit is `pg_dump` and an S3 sync to self-managed RDS/GCS if scale or terms demand.
- af-south-1 minimizes latency for Kenyan users among managed options and keeps data on the continent, simplifying the DPA cross-border narrative (doc 06 §6).

## Alternatives rejected
- **Self-managed RDS + custom auth:** more control, but burns our scarcest resource (engineer time) on undifferentiated plumbing.
- **MongoDB/Firestore:** document stores fit the media metadata but fail the ledger/invariant requirements; two databases is worse than one.
- **Local Kenyan hosting:** no managed Postgres of comparable maturity; residency is satisfiable via safeguards + af-south-1.

## Revisit when
Sustained DB > USD 2K/mo, need for read replicas beyond offering, or a regulatory mandate for in-country primary storage.
