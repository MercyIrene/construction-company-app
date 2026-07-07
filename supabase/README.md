# Msingi database

Executable form of the domain model (`docs/09-domain-model.md`). PostgreSQL 15+, Supabase-flavoured (uses `auth.users`, RLS with `auth.uid()`).

## Migrations

| File | Contents |
|---|---|
| `00001_core_domain.sql` | Enums, all bounded-context tables (identity, professional network, delivery, money, evidence, workflow, comms, home file, outbox/audit) |
| `00002_invariants_and_rls.sql` | Database-enforced invariants (balanced ledger journals, append-only tables, evidence immutability, milestone/disbursement gates) + RLS baseline (default-deny, project-scoped read isolation) |

## Run locally

```bash
npx supabase init      # once, if supabase/config.toml absent
npx supabase start     # local stack (Postgres, Auth, Storage)
npx supabase db reset  # applies migrations in order
```

Requires Docker. PostGIS is used for site geofencing (`create extension postgis` is in migration 00001; available on Supabase by default).

## Conventions

- **Forward-only** migrations; each PR touching money paths needs a rollback note and second reviewer (`docs/12-implementation-plan.md` §4).
- Append-only tables (`ledger_entries`, `domain_events`, `audit_log`, `reliability_score_events`, `evidence_items`) are trigger-protected — corrections are new rows (reversing entries / annotations), never edits.
- Client keys are read-isolated by RLS; all writes on money/certification paths go through the application service layer (service role) which enforces the business state machines. The DB triggers are backstops, not the primary logic.
- RLS tests (pgTAP, `supabase/tests/`) are merge-blocking once the app scaffold lands (epic E0).
