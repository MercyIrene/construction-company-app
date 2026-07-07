# ADR-0002 · TypeScript end-to-end; Next.js as the single application framework

**Status:** Accepted · 2026-07-07

## Context
Requirements R2 (tiny team, whole surface), R3 (PWA field app), plus four user surfaces sharing one domain model (doc 08 §2). Candidate splits considered: Python/Django backend + React frontend; Ruby on Rails; TypeScript full-stack; native mobile for field.

## Decision
**TypeScript everywhere; Next.js (App Router) as the one application** serving owner portal, ops console, field PWA, and later pro portal as role-scoped route groups. Shared `packages/domain` holds types, zod schemas, and state machines used identically on client and server.

## Rationale
- One language halves the surface a 2-engineer team maintains; domain types shared client↔server eliminate a whole defect class in approval/money flows.
- Nairobi hiring pool for TS/React is deep — this is a people decision as much as a technical one.
- Next.js gives SSR for cheap-data-first pages (R3: owners on mobile data), route-level code splitting, and first-class PWA support; Vercel deployment removes ops burden (R10).
- Django/Rails would be equally productive server-side but reintroduce a second language and a separate SPA build for the offline field app — the PWA requirement is the tiebreaker.

## Consequences
- Long-running/CPU work (media processing) must live in workers, not request handlers — acceptable, designed in (doc 10 §3).
- Framework lock-in risk is confined: domain modules are pure TS with no Next imports, portable by construction.

## Revisit when
A native-app requirement emerges that PWA genuinely cannot meet (e.g., background geofenced capture) — then React Native shares `packages/domain`.
