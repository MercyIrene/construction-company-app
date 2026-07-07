# 05 · Trust & Verification System

This is the company's core IP. Everything here must be auditable, evidence-based, and immune to commercial pressure (see pricing rules, doc 02 §4).

## 1. Professional vetting pipeline

Five gates before a professional can take platform work. All gate outcomes and evidence are stored on the `professional_vetting` records (schema: `supabase/migrations`).

| Gate | Checks | Evidence stored |
|---|---|---|
| **G1 Identity & legal** | National ID/passport, company registration (BRS search), KRA PIN & tax compliance certificate, directors screening | Document copies, registry extracts, check dates |
| **G2 Licensure** | NCA registration & category (contractors), BORAQS (architects/QSs), EBK (engineers), practicing licence currency | Registration numbers, verification method, expiry dates; re-verified annually and before each engagement |
| **G3 Track record** | Minimum 3 completed reference projects; ≥1 physically visited by our inspector; reference-client structured interviews | Site-visit report with photos, interview notes, scored rubric |
| **G4 Financial & conduct** | CRB check (with consent), litigation search, insurance status (contractor all-risk, PI for consultants) | Reports, policy documents |
| **G5 Working session** | Standards onboarding: evidence duties, payment mechanics, quality checklists, code of conduct signed | Signed onboarding pack, assessment score |

**Tiering (caps our risk while pros build history):**
- **T1 Probation:** first 2 platform projects, ≤ KES 10M each, enhanced inspection cadence (2×/week), higher retention (7.5%).
- **T2 Established:** ≥2 completed platform projects with Reliability ≥ 70. Standard terms.
- **T3 Preferred:** ≥5 projects, Reliability ≥ 85, zero substantiated conduct incidents. Priority matching, faster payment SLA (24h), featured profile.

Suspension/removal: automatic review triggers (substantiated safety incident, falsified evidence — instant removal and registry report; abandoned site; Reliability < 50). Removal decisions by a 3-person internal panel with written findings; the professional may respond. We keep records defensible because delisting will be litigated eventually.

## 2. Evidence standards

An **evidence item** is admissible when it has: capture timestamp, GPS within the project geofence (tolerance configurable per site), the capturing identity, and integrity hash computed at upload. The field app captures these automatically; gallery uploads are accepted but flagged `unverified_origin` and cannot satisfy hard gates. Server-side checks: EXIF consistency, geofence validation, duplicate-hash detection (catches the classic "same photo, two milestones" fraud), and burst-sequence sanity.

**Evidence pack** = the bundle attached to a milestone claim: required checklist items (per milestone-type template, e.g., *foundation*: excavation depth vs drawing, blinding, reinforcement layout before pour, DPM, cube test docket), photos/video, delivery notes for major materials, inspector report, QS certificate where the milestone carries valuation. **Hard gate: packs missing required items cannot be submitted.**

## 3. Inspection regime

- **Routine:** weekly DM or QA-inspector visit, structured checklist per current stage, snags raised with photo anchors and severity (blocker / major / minor).
- **Hold points:** defined stages that must not proceed without inspection sign-off (e.g., reinforcement before concrete pour, DPC level, ring beam, roof structure before covering). Hold-point violations are contract breaches with payment consequences.
- **Milestone verification:** independent of the routine cadence; uses the milestone's checklist; inspector must be different from the pack assembler where staffing allows (segregation of duties).
- **Statutory:** county/NCA inspection scheduling tracked as first-class tasks with document capture.
- **Third-party tests:** concrete cube tests, soil bearing (at design stage), electrical certification, plumbing pressure tests — tracked with lab dockets in the evidence system.

## 4. Reliability Score

Purpose: convert verified delivery events into a portable performance credential. Computed, never edited.

**Inputs (all machine-derivable from platform events):** milestone on-time rate (schedule variance distribution), budget adherence (certified vs baseline, variation-adjusted), defect intensity (snags per milestone, weighted by severity, and snag-closure velocity), evidence compliance (pack completeness first-time rate), conduct incidents (substantiated only), client rating (capped at 20% weight — ratings are gameable; verified events are not).

**Design rules:** score 0–100, computed per completed milestone and decayed over 24 months (recent performance dominates); confidence interval shown until ≥3 projects ("Reliability 82 ±9"); disputes annotate rather than erase events; formula version-stamped (`reliability_score_events` are immutable, recomputation is always possible). Anti-gaming: only platform-verified events count; self-reported history shows as "unverified background," never in the score.

Phase 2: score becomes public on professional profiles. We expect it to become the de-facto hiring credential — that is the strategic intent.

## 5. Money control (escrow mechanics)

Principle: **Msingi never takes custody of client funds** (ADR-0007; legal basis doc 06 §5).

- Each project gets a **dedicated project account** at a partner bank under dual mandate: movements require owner's standing instruction framework + Msingi-verified milestone certificate. Owner funds it per the funding schedule (fund N+1 milestones ahead — protects contractor cash-flow certainty without exposing whole budget).
- Disbursement flow: milestone approved by owner in portal → platform generates disbursement instruction (contractor amount, fee tranche, retention withholding, any materials-supplier direct payments) → bank executes → confirmations reconciled against the platform **ledger** (double-entry, append-only; schema `ledger_entries`).
- Retention: typically 5% (7.5% for T1) withheld per payment, released post defects-liability period.
- Variations: change orders priced by QS, owner-approved in portal *before* execution; unapproved work is at contractor risk. This single rule kills the most common budget-blowup mechanism.
- Interim state before bank partnership (validation phase): dual-signatory accounts with manual execution — mechanics identical, automation later (assumption A7).

## 6. Disputes

Ladder: (1) structured evidence query in-portal → (2) DM resolution meeting with re-inspection option → (3) Head of Delivery review with written determination → (4) contractually-named independent arbiter (QS/architect panel per JBC-style forms) → (5) arbitration per contract. SLAs at each rung (48h / 5d / 10d). All rungs leave structured records — dispute data is product-improvement gold and legal protection.

## 7. Insurance stack

Required per project: contractor all-risk (CAR) + workmanship guarantee where available; consultants carry PI; Msingi carries its own PI (owner's-rep scope) and public liability. Phase 2: negotiate a master CAR facility (volume pricing becomes a platform benefit). Insurance certificates are vetting-gate and mobilization-gate items with expiry tracking.
