# ADR-0004 · PWA-first for the field app (no native mobile in Phase 0–1)

**Status:** Accepted · 2026-07-07

## Context
Field users (inspectors, contractor site leads — persona P4) carry low-to-mid-range Androids on intermittent connectivity with expensive data. They will not reliably install/update a Play Store app, and contractors churn across projects. Evidence capture (geotagged photos, checklists, snags) is the critical workflow (R3).

## Decision
The field surface is a **PWA route group inside the main Next.js app**: installable, offline-capable (service worker + IndexedDB queue for checklists/snags; deferred media upload), camera + geolocation via web APIs, client-side image compression before upload.

## Rationale
- Zero install friction: a WhatsApp link opens the field app — decisive for contractor adoption.
- One codebase (ADR-0002); shipping updates instantly matters when playbooks iterate weekly during pilots.
- Web geolocation + camera capture with EXIF is sufficient for our evidence standard because the *authoritative* location check is server-side geofence validation plus physical inspection (doc 05 §2) — we are not relying on client honesty.

## Consequences & mitigations
- No background sync guarantees on iOS Safari — acceptable: field users are ~all Android; owners (who may be iOS) only consume.
- Web capture metadata is spoofable by a sophisticated attacker — mitigated by the layered evidence model (hash registry, near-duplicate detection, human inspection as the certifying control). We do not claim cryptographic provenance, we claim *audited* provenance.
- Staged delivery: E1 ships online-first capture; the offline queue is epic E4 with an explicit fallback (doc 12 §5).

## Revisit when
Field workflows need background geofenced capture, BLE sensor integration, or offline video beyond PWA practicality → React Native app sharing `packages/domain`.
