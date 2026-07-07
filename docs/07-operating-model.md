# 07 · Operating Model & Organization

## 1. Operating principle

Msingi is a **software-run operations company**. The service is human; the consistency is software. Every operational process below has (a) a playbook, (b) a system surface in the product, (c) an owner, and (d) a metric. If a process lives only in someone's head or a spreadsheet, it is a defect.

## 2. Core operating processes

| Process | Playbook output | System surface | Key metric |
|---|---|---|---|
| Lead → qualified prospect | Feasibility snapshot | Intake + feasibility tools | Qualified-lead conversion |
| Project setup | Setup checklist, contract pack, permit roadmap | Project setup workflow | Setup cycle time (target ≤ 21 days to design start) |
| Professional vetting | Gate records G1–G5 | Vetting pipeline | Time-to-vet; % passing per gate |
| Design management | Stage gates, decision log | Design stage workflow | Design cycle time; decision latency |
| Milestone delivery loop | Evidence pack, certification, disbursement | The core loop (doc 04 §3) | On-time milestone rate; approval latency; disbursement cycle ≤ 48h |
| Inspection routing | Weekly route plans | Scheduling + field app | Visits/inspector/day; checklist completion |
| Dispute resolution | Determination records | Dispute ladder | Resolution time per rung; disputes/100 milestones |
| Handover & defects | Home File, warranty register | Handover workflow | Snag closure velocity; retention release on time |

## 3. Organization design

### Founding team (months 0–6, ~8–12 people)
- **CEO (founder):** strategy, fundraising, demand-side sales, regulatory relationships.
- **Head of Delivery** (licensed architect or QS with site-supervision background) — *first critical hire*; owns playbooks, quality, professional network.
- **Founding engineer ×2** (full-stack; one leans product/design): the thin spine, then Phase-1 product.
- **Delivery managers ×2–3** (construction PM background; hired ahead of project load).
- **QA/field inspector ×1–2** (clerk-of-works profile).
- **Ops/finance associate:** disbursement administration, bookkeeping, compliance register.
- Fractional: CFO, counsel, brand/growth.

### Scale shape (months 18+)
Pods of 1 senior DM + 2 DMs + 2 inspectors + shared compliance associate carry ~30–40 concurrent projects in a geographic cluster. Central: engineering/product, vetting office, finance ops, growth. **The pod is the scaling unit; opening a new county = staffing a pod + localizing the permit playbook.**

### Engineering org
Stays deliberately small (4–6 through month 18): the leverage is one excellent product surface, not many. Standards in doc 12. No CTO title until Series A unless a co-founder-grade person appears; Head of Engineering reports to CEO.

## 4. Delivery capacity model

Load ratio (concurrent projects per DM) is the economics driver (doc 02 §2): pilot 6–8 → target 12 by month 18 via: evidence review automation, inspection routing, exception-based dashboards (DM attention goes only to variances), owner-comms automation (weekly reports auto-drafted from platform events, DM edits and approves). **Quality floor:** load never rises past the point where hold-point inspection SLAs slip — that tradeoff is decided by policy (Head of Delivery), not by DM heroics.

## 5. Metrics & cadence

- **North star:** verified milestones delivered on-time/on-budget per month.
- Weekly ops review: per-project exception list (schedule variance > 1wk, budget variance > 3%, evidence gaps, disputes, permit stalls).
- Monthly: unit economics per project cohort, load ratio, NPS, referral share, vetting funnel.
- Quarterly: assumptions register review (doc 03), pricing review, county expansion decision.

## 6. Resilience playbooks (summaries; full versions in ops manual)

- **Contractor abandonment:** 48h site-preservation checklist (secure materials, photograph state, notify insurer), formal notice per contract, re-tender to network within 10 days, retention + performance mechanisms applied.
- **Owner funding pause:** graceful-pause protocol — no new work authorized, site preserved, contractor released to other work with recall terms, no fee accrual during pause beyond caretaking. Removes the acrimony spiral that kills stalled projects.
- **Safety incident:** immediate work stop at affected area, DOSH notification via contractor, independent review, conduct event recorded; severe/fatal → external investigation, full cooperation.
- **Fraud detected (any party):** evidence preserved, involved disbursements frozen, client informed within 24h, professional suspended pending panel, report to registries/authorities where substantiated. **Including our own staff** — segregation of duties (pack assembler ≠ verifier ≠ disbursement initiator) is designed into roles and enforced in software (doc 11 §4).

## 7. Culture & conduct

Values operationalized, not postered: **Evidence over assurance** (claims cite records — in the product and in meetings alike) · **The owner's shilling** (every process defends the client's money as if it were a fiduciary duty) · **Clean hands** (zero facilitation payments; walking away from revenue that requires them; anonymous reporting channel from day one) · **Build the playbook** (every incident ends with a playbook diff). Hiring screens test for integrity under pressure with scenario interviews; delivery staff compensation includes a quality component, never a volume-only bonus (volume bonuses corrupt certification).
