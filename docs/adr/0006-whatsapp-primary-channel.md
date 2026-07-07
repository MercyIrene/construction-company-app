# ADR-0006 · WhatsApp as primary notification channel; approvals portal-only

**Status:** Accepted · 2026-07-07

## Context
Our customers live in WhatsApp (R4); email open rates in this demographic are poor; SMS is costly and unformatted. But chat is unauditable, spoofable (threat T7), and legally weak for money decisions.

## Decision
- **WhatsApp Business API (via a BSP; Meta-verified sender)** carries notifications, weekly reports, and deep links into the portal. SMS fallback for delivery failures; email for document-heavy sends.
- **All approvals, releases, and decisions execute only in the authenticated portal.** WhatsApp never carries an actionable "reply YES to release funds" — by policy and by product design.
- Inbound WhatsApp goes to a support inbox workflow; anything decision-like is converted by staff into a portal decision request.

## Rationale
- Meets users where they are without making chat the system of record.
- The portal-only rule is our strongest defense against the inevitable fake-Msingi-number scams and gives every money action session auth, MFA where required, and full audit context (what evidence version the approver saw).

## Consequences
- BSP costs per conversation (budgeted, R10); template pre-approval lead times mean notification copy changes need planning.
- One extra tap for users (chat → portal); we optimize with magic-link deep links bound to short-lived sessions for low-risk views, full auth for approvals.
