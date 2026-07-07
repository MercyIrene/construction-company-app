# 04 · Service Design — Personas, Journey, Blueprint

## 1. Personas

### P1 — "Wanjiru", diaspora builder (beachhead A)
Nurse in Dallas, 41. Owns ⅛-acre in Kikuyu (bought via sacco). Budget KES 18M saved over 9 years. Her cousin "supervised" her brother's build; KES 2.3M disappeared. **Needs:** absolute money control, proof she can check at 3am CST, someone accountable with a real company behind them. **Devices/channels:** iPhone, WhatsApp, occasional email. **Buying trigger:** testimonial from someone in her church group. **Fear:** being treated as a cash machine because she's abroad.

### P2 — "Otieno", Nairobi professional (beachhead B)
Bank manager, 38, lives in Nairobi, building in Siaya for KES 9M. Can visit monthly at best. Sophisticated about money, unsophisticated about construction. **Needs:** delegation with dashboards; wants to *feel* in control without doing the work. Price-sharper than P1.

### P3 — "Grace & David", local time-poor couple (Phase 1.5)
Both employed in Nairobi, building in Juja, KES 12M, mortgage-plus-savings. Weekly site visits currently consuming every Saturday. **Needs:** their Saturdays back; help judging quality; financing coordination.

### P4 — "Mwangi", tier-2 contractor (supply side)
NCA-registered, 12 crew, does 3–5 homes/yr. Competent, cash-strapped, stung by clients who stop paying mid-project. **Needs:** pipeline of funded, decision-ready clients; *payment certainty*; help looking professional. **Fears:** paperwork burden, being surveilled and blamed, delayed certification. Our pitch: on-time payment is guaranteed by the escrow mechanics — evidence duties are the price of it.

### P5 — "Arch. Njeri", architect (supply side)
Small practice, 6 people, BORAQS-registered. Wins work by referral; portfolio lives on Instagram. **Needs:** clients who have money and decide; protection from scope creep; fee collection. Our pitch: qualified demand + we handle the client management she hates.

Also modelled: QS, structural engineer, county compliance associate, Msingi delivery manager (internal user — the most important "persona" for tooling), field QA inspector.

## 2. The end-to-end journey (owner's view)

Stages are modular — customers enter at any stage (assumption A4). Every stage has a defined entry gate, exit gate, artifacts, and money events.

### Stage 0 — Discover & qualify
Landing → WhatsApp or web intake → 30-min video consult → **feasibility snapshot** (free, automated + reviewed): what your budget realistically builds in your county, timeline, permit map. Exit gate: signed **Setup Agreement** + setup fee paid. *Design intent: the feasibility snapshot is the growth asset — genuinely useful, shareable, and it forces honest budget conversations before anyone is emotionally invested.*

### Stage 1 — Project setup (weeks, not months)
Site assessment visit (documented, geotagged) · land due diligence checklist (title search support, beacons, caveats — partner surveyor/advocate) · brief development (needs, style, budget envelope) · **team assembly**: 2–3 matched architect options with verified portfolios (or onboarding of the owner's existing designs/professionals into our standards) · contract pack on JBC-derived standard forms · project account opened (dual mandate) · permit roadmap for that county. Exit gate: design contract signed OR existing design accepted into QA.

### Stage 2 — Design & documentation
Concept → owner approval → full documentation (architectural, structural, electrical, plumbing, and the full completion scope: water/borehole, power, internet conduit, security, landscaping, waste) → **QS bill of quantities** → owner-approved **baseline budget & milestone plan** (typically 10–16 milestones from mobilization to handover). Statutory approvals run in parallel (county development permission, NCA registration, NEMA where triggered). Exit gate: permits in hand + funded first milestones + signed construction contract.

### Stage 3 — Construction (the core loop)
Repeats per milestone:
1. Contractor executes; posts progress via field app (daily geotagged photos minimum).
2. Milestone completion claimed → **evidence pack** auto-assembled (photos/video, checklists, delivery notes, test results where applicable).
3. **Verification:** Msingi inspector site visit against milestone checklist; QS certification on valuation milestones; defects listed as snags with photo anchors.
4. Owner reviews evidence pack in portal (or via WhatsApp summary + portal link) → **approves release** (or queries; disputes go to the resolution path, doc 05 §6).
5. Disbursement executes from project account; contractor paid within 48h of approval; fee tranche deducted transparently; ledger updated.
6. Next milestone auto-mobilizes; schedule and budget variance recomputed and reported weekly.

Owner-facing rhythm: **weekly report** (photos, % complete, spend vs budget, upcoming decisions, risks) pushed via WhatsApp with portal deep link. Decision requests (e.g., tile selection, variation approval) are structured items with options, cost/schedule impact, and deadlines — never buried in chat.

### Stage 4 — Handover
Snag list to zero (photo-verified) · statutory completion/occupation certificate · commissioning checklist (power, water, drainage tests) · warranty register (contractor workmanship + component warranties) · retention amount held per contract (typically 5%, released after 6-month defects liability period with a final inspection) · **Home File delivered**: full document set, as-builts, approvals, evidence archive, supplier/warranty registry.

### Stage 5 — Live-in (Home OS)
Defects-liability management → maintenance schedule → renovation/extension projects re-enter at Stage 1 with the Home File pre-populating everything.

## 3. Service blueprint (frontstage / backstage / systems)

Excerpt for the **milestone verification loop** — the moment of truth:

| | Step |
|---|---|
| **Owner action** | Receives WhatsApp "Milestone 6 ready for your review" → opens evidence pack → approves |
| **Frontstage** | Evidence pack page: checklist results, inspector notes, photo/video gallery with map pins, QS certificate, amount to be released, running budget |
| **Backstage (people)** | Inspector visit scheduled by routing tool; inspector completes checklist on field app offline; DM reviews pack, resolves gaps before owner ever sees it; QS certifies valuation |
| **Systems** | Evidence-pack assembly (auto); checklist templates per milestone type; photo EXIF/geofence validation; disbursement instruction generation; ledger postings; notification orchestration |
| **Policies** | No pack → no review. Incomplete pack cannot be submitted (hard gate). Owner approval is the *only* trigger for money movement. 48h payment SLA to contractor after approval. |

Failure-path design (as important as the happy path): evidence disputed → structured query thread on specific evidence items → re-inspection if needed → escalation ladder (DM → Head of Delivery → independent QS arbiter per contract). Contractor abandonment → pause-and-preserve protocol → replacement tender from network → insurance/retention mechanics. Owner funds delayed → auto-pause with site-preservation checklist, no debt accrual to contractor (prevents the classic acrimony spiral).

## 4. Experience principles

1. **Evidence before assurance.** Show, never just tell. Every claim in the UI links to a photo, document, or ledger entry.
2. **WhatsApp is the front door; the portal is the record.** Never force channel-switching for consumption; always anchor decisions and approvals in the portal where they are auditable.
3. **Money UX is sacred.** Approvals are explicit, itemized, reversible-until-confirmed, and receipted. No dark patterns, no default-on releases, ever.
4. **Respect the fear.** Copy acknowledges the trust problem directly ("You've heard the stories. Here's exactly how we make them impossible") rather than pretending construction is delightful.
5. **Offline-first field tools.** Sites have bad connectivity; evidence capture must queue and sync (drives PWA/offline requirements, ADR-0004).
6. **Bilingual by design.** English/Swahili from day one; copy register warm-professional, never bureaucratic.
