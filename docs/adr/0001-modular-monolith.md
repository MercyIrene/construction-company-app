# ADR-0001 · Modular monolith with domain-event outbox

**Status:** Accepted · 2026-07-07

## Context
Team of 2–6 engineers must ship an ops console, owner portal, field app, payments workflows, and evidence pipeline. The domain (doc 09) has clear bounded contexts. Microservices would add network boundaries, deployment topology, and distributed-failure modes we cannot afford; a boundary-less monolith would rot into a ball of mud exactly where correctness matters most (money, evidence).

## Decision
One deployable application organized as **domain modules mirroring bounded contexts** (`delivery`, `money`, `evidence`, `network`, `workflow`, `comms`, `homefile`, `identity`). Modules expose a single `service.ts` interface; cross-module table access is forbidden and lint-enforced. Cross-context facts propagate via an **outbox table (`domain_events`)** processed by background workers — giving audit, async decoupling, and replay without a message broker.

## Consequences
- One deploy, one database, transactional consistency where money needs it.
- Event log doubles as the data-moat substrate (reliability events, analytics) — R9.
- Future extraction of a service (e.g., media processing, bank adapters) is a refactor along existing seams, not a rewrite.
- Discipline cost: import rules and code review must actually enforce boundaries; we accept this as the cheapest available rigor.

## Revisit when
Team > ~10 engineers, or a component demonstrably needs independent scaling/isolation (see doc 10 §5).
