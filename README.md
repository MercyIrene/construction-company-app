# Msingi — The Operating System for Building a Home in Kenya

> *Msingi* (Swahili): **foundation**. Working name, pending trademark clearance (see `docs/06-regulatory-compliance.md` §8).

**Msingi is a tech-enabled owner's representative and construction delivery platform.** We take a homeowner from "I have land and a dream" to "I have keys and a complete digital record of my home" — with verified professionals, milestone-locked money, evidence-based progress tracking, and a permanent Home File that lives on after handover.

This repository contains the complete founding body of work: business architecture, operating model, product strategy, domain model, technical architecture, database schema, and implementation plan. It is written to be sufficient for a professional engineering organization to begin implementation immediately.

---

## The one-paragraph thesis

Residential construction in Kenya is a **trust market with no trust infrastructure**. The majority of homes are individually commissioned by families building on their own land, frequently managed remotely (diaspora, urban professionals building upcountry), and financed in cash over months or years. The dominant failure mode is not engineering — it is **misallocated money and unverifiable progress**. Whoever controls the *release of money against verified physical progress* controls the market's trust layer. Msingi starts there — not as a marketplace, not as a design tool — and expands outward along the customer's journey until it is the system of record for the home itself.

## What we changed about the original idea (founder's brief vs. what we're building)

The founding brief described an end-to-end marketplace platform. We stress-tested it and made five structural changes — full reasoning in `docs/01-business-strategy.md` §6:

1. **We do not launch as a marketplace.** Two-sided marketplaces die of cold-start and trust problems in high-stakes, low-frequency purchases. We launch as a **managed service with a software spine** (curated supply, our project managers accountable for outcomes) and open the marketplace only once we have liquidity and performance data.
2. **The wedge is money control + verified evidence, not matching.** Architect matching is a nice front door, but the acute, monetizable pain is "my money is being stolen / wasted and I can't see the site." Escrow-governed milestone payments with geotagged photographic evidence is the product people will pay a premium for on day one.
3. **First beachhead: remote builders** — diaspora Kenyans and Nairobi professionals building in the counties. Highest pain, highest willingness to pay, strongest word-of-mouth channels (churches, saccos, WhatsApp diaspora groups), and they *require* the digital experience rather than tolerating it.
4. **We are an owner's representative, not a general contractor.** The homeowner contracts professionals directly (on standard JBC-derived contracts we supply); we supervise, verify, and control disbursement. This keeps us out of construction liability and NCA contractor-licensing scope while we scale, and aligns our incentives purely with the homeowner.
5. **The durable moat is data, built deliberately:** verified professional performance records (a "credit score" for contractors) and the **Home File** — the permanent, portable digital history of each home. Both are designed into the domain model from day one, not bolted on.

## Reading order

| # | Document | What it answers |
|---|----------|-----------------|
| 00 | [Executive summary](docs/00-executive-summary.md) | The whole company on three pages |
| 01 | [Business strategy](docs/01-business-strategy.md) | Market, segments, competition, positioning, moat |
| 02 | [Business model & finance](docs/02-business-model.md) | Revenue lines, pricing, unit economics, funding plan |
| 03 | [Validation plan](docs/03-validation-plan.md) | Assumptions register and the experiments that kill or confirm them |
| 04 | [Service design](docs/04-service-design.md) | Personas, end-to-end journey, service blueprint |
| 05 | [Trust & verification](docs/05-trust-and-verification.md) | Vetting, tiering, Reliability Score, escrow, inspections, disputes |
| 06 | [Regulatory & compliance](docs/06-regulatory-compliance.md) | NCA, county approvals, NEMA, contracts, data protection |
| 07 | [Operating model](docs/07-operating-model.md) | Org design, delivery playbooks, hiring plan |
| 08 | [Product strategy](docs/08-product-strategy.md) | Phased roadmap, MVP scope, success metrics |
| 09 | [Domain model](docs/09-domain-model.md) | Bounded contexts, ubiquitous language, core entities |
| 10 | [Technical architecture](docs/10-technical-architecture.md) | System design, stack, integrations, infrastructure |
| 11 | [Security & privacy](docs/11-security-and-privacy.md) | Threat model, controls, Kenya DPA compliance |
| 12 | [Implementation plan](docs/12-implementation-plan.md) | Engineering standards, epics, 12-month delivery schedule |
| — | [Architecture decision records](docs/adr/) | Every significant technical choice, justified |
| — | [Database schema](supabase/migrations/) | Complete PostgreSQL schema implementing the domain model |

## Repository layout

```
docs/                     Founding documents (this body of work)
docs/adr/                 Architecture Decision Records
supabase/migrations/      PostgreSQL schema — the domain model, executable
supabase/README.md        How to run the schema locally
```

Application code lands in `apps/` and `packages/` per the structure specified in `docs/12-implementation-plan.md` §3.

## Status

**Stage:** pre-seed, pre-build. This body of work is the input to (a) the validation sprint in `docs/03-validation-plan.md` and (b) the Phase-1 engineering build in `docs/12-implementation-plan.md`. Dated 2026-07-07.
