# 11 · Security & Privacy

Security posture is a brand asset: we ask customers to trust us with life savings and their home's permanent record. Design target: **no single bug, insider, or stolen credential can move money or silently alter evidence.**

## 1. Threat model (top scenarios)

| # | Threat | Primary controls |
|---|---|---|
| T1 | Account takeover of an owner → fraudulent release approval | MFA required for `owner_approver` role; re-authentication on every release approval; release notifications to all project members; 24h cooling window for releases above configurable threshold; device/session anomaly alerts |
| T2 | Contractor evidence fraud (staged/recycled photos) | Field-app capture pipeline (geofence, EXIF, hash, near-duplicate detection); inspector physical verification as the certifying control; duplicate-hash checks across ALL projects |
| T3 | Insider fraud (staff colluding to certify fake progress) | Segregation of duties enforced in code (assembler ≠ verifier ≠ disbursement initiator on the same milestone); immutable audit log; disbursement instructions require owner approval cryptographically tied to the evidence-pack version reviewed |
| T4 | Cross-tenant data leak (project A sees project B) | Postgres RLS backstop on every tenant-scoped table; storage path policies; automated RLS tests in CI for every table (a failing RLS test blocks merge) |
| T5 | Payment instruction tampering | Idempotency keys; instruction checksums; reconciliation against bank confirmations; alerting on unmatched entries; no free-text payee edits after approval |
| T6 | Ransomware/data loss of the Home File archive | Object versioning, PITR, cross-region backup copies, quarterly restore drills |
| T7 | WhatsApp social engineering (fake "Msingi" numbers) | Verified WABA identity; education in onboarding ("we never ask for money over chat — all payments happen only inside the portal"); payment requests exclusively in-portal |
| T8 | Professional PII misuse / score defamation claims | Score = published methodology over verifiable events; disputes annotate; access logging on vetting records |

## 2. Application security standards

- All inputs validated at the boundary (zod schemas shared client/server); no raw SQL string building (typed query layer); output encoding by framework defaults.
- Secrets in platform secret stores only; no secrets in repo (CI secret-scanning gate); quarterly key rotation for integration credentials.
- Dependencies: lockfiles, automated vulnerability alerts, monthly patch cadence, no direct-to-prod dependency additions without review.
- Media handling: uploads virus-scanned, content-type verified server-side, served from a separate origin/CDN with signed URLs (no public buckets).
- Rate limiting + CAPTCHA on auth and intake endpoints; login and approval events fully audited.

## 3. Audit & immutability

`audit_log` records every privileged action (who, what, before/after refs, IP, session) — append-only, exported to cold storage weekly. Domain events and ledger entries are themselves append-only, giving three independent reconstruction paths for any dispute: audit log, event stream, ledger.

## 4. Access control model

Roles: `owner_primary`, `owner_approver`, `owner_viewer`, `pro_member`, `staff_dm`, `staff_inspector`, `staff_finance`, `staff_admin`, `vetting_officer`. Least-privilege defaults; staff access to a project requires assignment (`project_staff`), not blanket role; finance actions and certification actions are mutually exclusive role grants per user (segregation, T3). Quarterly access reviews once headcount > 15.

## 5. Privacy engineering (Kenya DPA 2019 — legal analysis in doc 06 §6)

- **Data map** maintained per context: purpose, lawful basis, retention class. Retention classes: `project_record` (contractual/statutory — retained 7+ years and in the Home File per owner's ongoing contract), `marketing` (consent, deletable on request), `vetting_pii` (retained while network member + statutory period), `telemetry` (rolling 13 months).
- Subject-rights tooling: self-serve export (owner gets their full project data — also a feature, not just compliance); deletion workflow honoring retention carve-outs with a documented decision per request.
- Minimization examples: CRB checks store outcome + reference, not full report, where permissible; worker face-blurring available for published/portfolio media; phone numbers of counterparties masked in UI until a project relationship exists.
- Processor register: Supabase/AWS, Vercel, BSP, Sentry — DPAs on file; transfer-impact records for any processing outside Kenya; ODPC registration and renewals in the compliance calendar.

## 6. Incident response

Severity ladder with response-time targets (Sev1 — money moved wrongly or data breach: all-hands, 1h acknowledge, client comms within 24h with facts, ODPC notification within statutory 72h where applicable). Post-incident: blameless review, playbook diff, control added. Breach-notification templates pre-drafted. Annual tabletop exercise (T1 and T3 scenarios first).

## 7. Verification of these controls

Security acceptance tests live in CI: RLS test suite per table; approval-flow tests asserting re-auth and segregation rules; ledger balance property tests; evidence-immutability tests. External penetration test before Phase-1 GA and annually after; findings tracked to closure in the same issue tracker as product work.
