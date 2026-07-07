# 03 · Validation Plan — Assumptions Register & Kill Criteria

Founding rule: **every shilling of engineering spend must trace to a validated assumption or an explicitly accepted bet.** This register is the contract between strategy and build. Owner: CEO. Review cadence: fortnightly.

## 1. Assumptions register

Ranked by (impact × uncertainty). Status values: `UNTESTED`, `TESTING`, `VALIDATED`, `INVALIDATED`, `ACCEPTED-BET`.

| ID | Assumption | Impact if wrong | Validation method | Kill / pivot criterion | Status |
|----|-----------|-----------------|-------------------|------------------------|--------|
| A1 | Remote builders will pay ≥5% of construction value for verified delivery | Fatal | 30 problem interviews + 10 paid concierge pilots at full price (no discounts — discounted validation is fake) | <5 of first 25 qualified prospects convert at full price in 90 days | UNTESTED |
| A2 | The acute pain is money control + verification (not matching, not design) | Wedge is wrong | Interview coding: rank pains; track which module pilots actually use | If <60% rank money/verification top-2, re-sequence wedge | UNTESTED |
| A3 | Credible contractors will accept milestone-locked payment + evidence duties | Supply side collapses | Recruit 10 contractors for pilot terms; measure refusal reasons | >70% of vetted contractors refuse terms even with pipeline offer | UNTESTED |
| A4 | ~Half of prospects arrive with designs already; journey must be modular | Product shape | Intake data from first 50 leads | n/a — shapes design, no kill | UNTESTED |
| A5 | A delivery manager can run 8+ concurrent projects with software support | Unit economics | Time-and-motion on pilot projects; load simulation | Sustained <6 with tooling → repricing or model change | UNTESTED |
| A6 | Geotagged photo/video + inspector spot-checks are sufficient evidence for owners to release money remotely | Core mechanism | Pilot: measure approval latency, dispute rate, "flew home anyway" rate | Owners routinely refuse remote release (>30% of milestones) | UNTESTED |
| A7 | Partner bank will operate dual-mandate project accounts at acceptable cost | Escrow mechanics | Term sheets from 2+ banks/regulated PSPs by month 3 | No partner at <1% of throughput cost → interim manual dual-signatory model | UNTESTED |
| A8 | Diaspora channels (churches, saccos, WhatsApp groups, employer networks) deliver CAC ≤ KES 120K | Growth model | 3 channel experiments, 60 days each, tracked to signed setup fees | Blended CAC >250K after experiments | UNTESTED |
| A9 | Serviceable segment ≥ 8,000 projects/yr ≥ KES 5M with remote/time-poor owner | Market size | Bottom-up: county approval registers ×4 counties, NCA registrations, 200-lead funnel data | Segment <2,000/yr → move upmarket or add landlord segment early | UNTESTED |
| A10 | County permit processes can be reliably navigated on predictable timelines without improper payments | Compliance + brand | Run 5 permit processes across 3 counties; document timelines | Impossible without improper payments in a county → exit that county | UNTESTED |
| A11 | Owners value the Home File enough for it to drive Phase-3 retention | Long-term moat | Deferred: proxy-test via pilot NPS verbatims + willingness-to-pay probes | n/a — accepted bet until Phase 2 | ACCEPTED-BET |
| A12 | Legal owner's-rep structure (owner contracts pros directly) is enforceable and insurable in Kenya | Liability | Kenyan construction counsel opinion + PI insurance quote, month 1–2 | Uninsurable → restructure as licensed PM firm | UNTESTED |

## 2. Validation sprint (months 0–6)

**Phase V0 — Desk + interviews (weeks 1–6).** 30 problem interviews (15 diaspora, 15 Nairobi professionals; recruit via 3 diaspora groups + 2 saccos + personal networks). 10 supply-side interviews (architects, QSs, contractors). Counsel opinion on A12. Bank conversations for A7. Bottom-up sizing for A9. Competitive re-scan (V12): verify current state of Jumba-type materials platforms, fundi apps, iBUILD-type entrants, bank construction products.

**Phase V1 — Concierge pilots (weeks 6–26).** Sell and run **10–15 real projects at full price** with a deliberately thin spine (doc 08 §3): WhatsApp + a minimal portal + manual disbursement via dual-signatory accounts. Everything else is human. Instrument every step: hours per project per role, milestone approval latency, evidence disputes, payment cycle time, owner check-in frequency.

**Decision gate (month 6):** proceed to Systematize build only if A1, A3, A6 validated and A5 plausibly on-track. Partial failures have named pivots in the table above — the most likely pivot is **bank-channel first** (sell verified-milestone disbursement to construction lenders as infrastructure) if consumer willingness-to-pay disappoints while the verification mechanism itself validates.

## 3. Research operations standards

- Interviews recorded (with consent), transcribed, coded against a shared pain taxonomy in the research repo; no anecdote-driven decisions — claims cite interview IDs.
- Every pilot project gets a post-milestone micro-survey (2 questions) and a post-project debrief; verbatims feed the service blueprint (doc 04).
- Ethics: interviewees told this is commercial research; pilot customers get real contractual protections, not "beta" disclaimers — we are practicing on their homes and price/staff accordingly (senior delivery attention on all pilots).

## 4. Standing metrics that continue past validation

North star: **verified milestones delivered on-time and on-budget per month.**
Guardrails: dispute rate per 100 milestones; evidence-pack completeness; disbursement cycle time (owner approval → funds moved); load ratio; NPS; referral share of new projects; permit cycle time by county.
