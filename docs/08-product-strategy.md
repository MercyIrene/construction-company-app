# 08 · Product Strategy & Roadmap

## 1. Product thesis

The product is **the delivery operation, made legible and controllable**: for owners, a trust instrument; for delivery staff, a leverage machine; for professionals, a pipeline and a credential. We build one platform with three faces over a single domain model — never three apps with three databases.

Prioritization rule for every ticket: does it (a) increase verified trust, (b) raise the load ratio, or (c) compound the data moat? Otherwise it waits.

## 2. Users & surfaces

| Surface | Users | Form factor | Notes |
|---|---|---|---|
| **Owner portal** | P1–P3 homeowners | Responsive web (PWA), WhatsApp notifications deep-linking in | Consumption-optimized; approvals are the critical flows |
| **Ops console** | DMs, Head of Delivery, vetting office, finance ops | Web app | Exception-driven dashboards; the internal tool *is* the company |
| **Field app** | Inspectors, contractors' site leads | PWA, offline-first, low-end-Android-tolerant | Evidence capture, checklists, snags; ruthlessly simple |
| **Pro portal (Phase 2)** | Architects, contractors, QSs | Web | Profile/score, pipeline, bids, payment status |

One codebase, role-scoped (ADR-0002, ADR-0004).

## 3. Phase 0 — Thin spine (months 0–6, validation-grade)

Deliberately minimal; supports 15 concierge projects. **Build (~8 engineer-weeks):** project + milestone + budget models; evidence upload with geotag/EXIF validation; evidence-pack pages shareable to owners (auth-lite magic links); owner approval action with audit trail; simple ledger (recorded, manually executed payments); WhatsApp notifications via template sender; ops checklist tracking. **Explicitly not built yet:** matching, bidding, pro portal, automated disbursement, score computation (events are *captured* from day one so scores can be computed retroactively — data before features).

## 4. Phase 1 — Verified Delivery product (months 6–18)

Everything in doc 04's journey, productized:

- **P1.1 Core loop hardening:** milestone templates by construction system; hard-gated evidence packs; QS certification flow; owner approval → disbursement instruction generation with bank-file export; full double-entry ledger with retention & WHT handling; variation/change-order flow.
- **P1.2 Field excellence:** offline queue + sync; inspection routing; snag lifecycle with photo anchors; hold-point enforcement (schedule blocks until sign-off).
- **P1.3 Owner experience:** weekly report auto-drafting; budget explorer (baseline vs certified vs projected); decision-request module with option cards; document vault; bilingual UI.
- **P1.4 Workflow engine:** county permit templates, setup checklists, handover flows as configurable `workflow_templates` (the generalization that later powers any new county/process without code).
- **P1.5 Vetting pipeline:** gate tracking, licence-expiry alerts, reference-visit reports.
- **P1.6 Home File v1:** structured handover archive: documents, as-builts, warranty register, evidence history.

## 5. Phase 2 — Network (months 18–30)

Matching (brief → shortlist with verified portfolios); standardized bidding on BoQs; **Reliability Score** computation + public profiles (methodology published); pro portal with payment-status transparency (the retention feature for pros); materials ordering integration with negotiated-rate suppliers; bank/sacco API for milestone-verified loan disbursement (the institutional product — likely a separate sales motion, same platform primitive).

## 6. Phase 3 — Home OS (months 30+)

Maintenance plans & dispatch; renovation re-entry flows; Home File portability (owner-controlled sharing, e.g., to a buyer or bank — a home with a complete Msingi file should command a premium, which becomes self-reinforcing demand); East Africa localization layer (country packs = regulatory workflow templates + contract packs + payment rails).

## 7. AI strategy (applied, not decorative)

Sequenced behind data accumulation; all assistive-with-human-signoff in anything touching money or certification:

1. **Now (cheap, high value):** weekly-report drafting from platform events; evidence-photo triage (blur/duplicate/wrong-subject detection); WhatsApp intake structuring; bilingual copy assistance.
2. **Phase 1–2:** photo-vs-checklist assistance for inspectors (flag missing rebar-stage shots, etc.); budget-anomaly detection vs county cost benchmarks; permit-timeline prediction per county from our own cycle data; BoQ line-item extraction from uploaded QS documents.
3. **Phase 2–3 (data moat compounding):** cost-benchmark products ("what does a 4-bed maisonette actually cost in Kajiado, from 300 verified projects"); risk scoring at underwriting quality for bank partners; Reliability Score enrichment.
   **Rule:** AI never auto-certifies, auto-releases funds, or auto-scores conduct. Verification is human-accountable; AI raises inspector throughput, not replaces the inspector's signature.

## 8. Success metrics per phase

- **Phase 0:** 10+ full-price pilots; milestone approval latency < 72h; zero evidence-integrity failures; A1/A3/A6 validated.
- **Phase 1:** load ratio ≥ 10; disbursement cycle ≤ 48h; ≥ 95% first-time evidence-pack completeness; NPS ≥ 60; 100% of milestones evidence-verified.
- **Phase 2:** ≥ 50 pros with computed scores; ≥ 30% of new projects matched (vs brought-own); first bank disbursing on our verification; materials attach ≥ 25% of active projects.
- **Phase 3:** ≥ 40% of completed-project owners on a paid plan within 12 months of handover; renovation re-entry CAC ≈ 0.
