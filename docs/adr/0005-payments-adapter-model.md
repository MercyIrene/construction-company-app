# ADR-0005 · Payments as adapters over an internal instruction/ledger core

**Status:** Accepted · 2026-07-07

## Context
Money flows: owner funds project account (bank transfer, M-Pesa, diaspora remittance rails); disbursements to contractors/suppliers (bank/M-Pesa B2B); fee tranches to Msingi; retention and WHT withholding. Partners and rails WILL change (assumption A7 — bank partner unconfirmed; validation phase runs manual dual-signatory execution). We never hold funds (ADR-0007).

## Decision
The domain owns a rail-agnostic core: `disbursements` (instructions with idempotency keys and state machine) + `ledger_entries` (double-entry, append-only). Rails are **adapters** implementing a narrow interface: `prepareInstruction`, `submit`, `parseConfirmation`. Phase-0 adapter is `manual` (generates a human task + instruction sheet; confirmation entered by finance ops with dual control). Later adapters: partner-bank API/file, M-Pesa Daraja B2B/B2C, remittance partners.

## Rationale
- The audit trail, gating, and accounting are OUR product; the rail is a commodity. Designing rail-first (e.g., building around Daraja specifics) would couple the trust core to a vendor.
- Manual mode as a first-class adapter means the pilot's paper reality and the future automated reality share one record system — pilot data stays valid forever.
- Idempotency keys + reconciliation-by-confirmation handle the well-known double-fire/timeout failure modes of mobile-money APIs.

## Consequences
- Slightly more abstraction than a pilot strictly needs; accepted because money-path rework is the most expensive kind.
- Reconciliation is a required daily job from day one (unmatched-entry alerting), even in manual mode.
