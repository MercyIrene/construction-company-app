# ADR-0007 · Msingi never takes custody of client funds

**Status:** Accepted · 2026-07-07 · (Business+technical ADR — binds product design)

## Context
The wedge is money control. The naive design — client pays Msingi, Msingi pays contractors — creates deposit-taking/payments-licensing exposure (CBK), balance-sheet risk, AML burden as principal, and a catastrophic single point of failure for trust (any Msingi insolvency or fraud event torches every client's project funds).

## Decision
Client funds sit in a **dedicated project account in the client's name at a regulated bank**, under a dual-mandate: disbursements execute only on (client release approval) + (Msingi-verified milestone certificate), per the account mandate contract. Msingi holds **instruction rights, never title or custody**. Our fee tranches are disbursed from the same mechanism with the same transparency. Validation phase implements this as dual-signatory accounts with manual execution; the automated bank partnership preserves identical legal structure (assumption A7).

## Consequences
- Product: the platform generates and tracks *instructions* and reconciles *confirmations*; it never operates a wallet. All schema and adapter design (ADR-0005) follows.
- Sales: "your money never touches us" is a headline trust feature, not a limitation.
- Constraint: rails that require merchant custody (e.g., collecting into our paybill and forwarding) are prohibited for construction funds; acceptable only for our own fee invoices if ever needed.
- If Phase-2/3 products require custody-like flows (materials pass-through), they run on a licensed partner or we obtain authorization first (doc 06 §5).
