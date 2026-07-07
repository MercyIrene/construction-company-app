# 06 · Regulatory, Legal & Compliance Framework (Kenya)

> Working framework compiled by the founding team; item **A12** in the validation plan requires confirmation of the load-bearing positions by Kenyan construction counsel before first client contract. Regulations cited as understood at 2026-07; the compliance register (§9) is the living source of truth.

## 1. Our regulatory posture

Msingi operates as an **owner's representative / project-management consultancy**, not a contractor and not a financial institution. Design and construction services are performed by independently licensed professionals contracting directly with the homeowner on standard forms we administer. This posture minimizes our licensing surface while we scale, and we revisit it deliberately at Phase 2 (see §7).

## 2. Construction-sector regime (per project)

| Requirement | Authority | Notes for our workflows |
|---|---|---|
| Development permission (architectural + structural plan approval) | County government (physical planning dept) | Filed by the registered architect; timelines vary by county — tracked per-county in the permit playbooks; e-permitting (e.g., Nairobi e-DAMS-style systems) where available |
| Project registration + construction levy | National Construction Authority (NCA) | Registration before commencement; levy applies above the statutory value threshold; NCA site board & compliance certificate |
| Environmental (EIA/SPR) | NEMA | Triggered by project type/scale/location (e.g., riparian proximity, borehole); screening is a Stage-1 checklist item |
| Structural design sign-off | EBK-registered engineer | Mandatory for structural elements; we require it universally |
| Water abstraction (borehole) | WRA permit + hydrogeological survey | Common in our segment; standard sub-workflow |
| Utility connections | KPLC (power), county/water company (water/sewer) | Application lead times feed the master schedule |
| Occupation certificate | County | Handover gate item |
| Worksite safety | DOSH (OSH Act) — contractor duty | Contractor obligation contractually; our inspections include safety checklist items; incidents are conduct events |

**Professional licensure of supply side:** contractors — NCA registration in appropriate class/category; architects & QSs — BORAQS; engineers — EBK. Verified at vetting gate G2 and re-verified per engagement (doc 05).

## 3. Contract architecture

Standard pack, derived from JBC (Joint Building & Construction Council) / FIDIC-informed forms, adapted by counsel:

1. **Msingi Services Agreement** (owner ↔ Msingi): owner's-rep scope, fee schedule, evidence and disbursement mechanics, data consent, limitation of liability, dispute path.
2. **Design Agreement** (owner ↔ architect/engineers): deliverables per stage, fee milestones, IP/licence of designs to owner (with archival licence to Msingi for the Home File).
3. **Construction Agreement** (owner ↔ contractor): milestone schedule annexed; payment strictly against certified milestones; retention; defects liability period (6 months standard); variation procedure (pre-approval mandatory); hold points; evidence duties; abandonment and termination mechanics; named independent arbiter.
4. **Project Account Mandate** (owner ↔ bank, with Msingi instruction rights): dual-control disbursement per §5.
5. **Professional Network Agreement** (professional ↔ Msingi): code of conduct, vetting consent, evidence duties, score participation, fee schedule (Phase 2).

Key drafting principles: every money movement traces to a certified milestone; every certificate traces to evidence; Msingi certifies *progress*, professionals certify *technical adequacy* (liability stays with the licensed professional for design and workmanship — our PI covers our PM scope only).

## 4. Entity & tax

Kenyan operating company (private limited). VAT registration (services VATable at 16%); withholding-tax handling on professional fees (we administer payments, so our systems must compute WHT correctly per payee type — this is a ledger feature, not an afterthought: schema `ledger_entries.tax_withholding`). Payroll: PAYE/NSSF/SHIF. Investor topco structure decided with counsel at fundraise; irrelevant to operations.

## 5. Client funds & payments law

Positions (counsel to confirm, A7/A12):
- Dual-mandate project accounts keep client funds at a regulated bank in the client's name → Msingi is not taking deposits and does not require a payments licence for the core flow.
- If Phase-2/3 flows require us to touch funds (e.g., materials pass-through), we either use partner rails (PSP holding the licence) or obtain the appropriate CBK authorization at that point — a deliberate, priced decision, never an accident.
- AML/KYC: bank partner carries statutory duties; we implement mirror KYC on onboarding (identity, source-of-funds declaration for large projects) because our brand cannot survive facilitating laundering through construction — a known typology. Suspicious-pattern escalation procedure documented in ops manual.

## 6. Data protection (Kenya DPA 2019)

- Register as **data controller** (and processor where applicable) with the ODPC.
- Lawful bases mapped per processing purpose: contract performance (project data), consent (marketing, portfolio publication, vetting checks like CRB), legitimate interest (fraud prevention, score computation — documented balancing test).
- **Cross-border transfers:** cloud hosting outside Kenya is permitted with safeguards and disclosure; our stack keeps primary data in AWS af-south-1 (Cape Town) via Supabase region selection to simplify the analysis and latency both (ADR-0003). Transfer-impact records maintained.
- Data-subject rights tooling: export and deletion workflows are product requirements (doc 11 §5), with construction-record retention carve-outs (statutory/contractual retention overrides deletion for project records; personal marketing data deletes cleanly).
- Special care: site photos capture workers' faces; worker notice/consent handled via contractor onboarding pack + signage standard.

## 7. Regulatory evolution triggers (we re-open posture when...)

- NCA or a successor regime introduces licensing for construction project managers → register immediately (we should meet requirements trivially).
- We begin materials procurement as principal (Phase 2) → trading terms, product liability, VAT mechanics revisited.
- We begin financing referrals → CBK/insurance (IRA) intermediation rules assessed per product.
- Marketplace opens (Phase 2) → consumer-protection review of matching claims; Reliability Score published with a documented, defensible methodology (defamation-resistant: truth + honest computation).

## 8. Brand & IP

Trademark search and registration for the operating name (KIPI) in month 1 — **"Msingi" is a working name and may collide with existing marks; clearance before public launch.** Domain + social handles secured concurrently. Platform code and playbooks: standard IP assignment in all employment/contractor agreements.

## 9. Compliance operations

A living **compliance register** (owner: Head of Delivery until a compliance hire) tracks: per-county permit playbooks (steps, fees, documents, realistic timelines, contacts), licence expiry calendar for all network professionals, entity obligations calendar (tax, ODPC, insurance renewals), and incident log. The register's project-facing parts are *in the product* (permit workflow templates per county — schema `workflow_templates`), not in a spreadsheet, because permit navigation is a customer-visible feature.

**Ethics red line (also doc 07 §7):** no facilitation payments, ever, anywhere in the chain — including via professionals acting on our projects. Contractual flow-down, training, and an anonymous reporting channel. Where a county process stalls without improper payment, we escalate formally and transparently to the client; if a county proves unnavigable cleanly, we exit it (assumption A10).
