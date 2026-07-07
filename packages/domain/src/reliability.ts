/**
 * Reliability Score v1 (docs/05 §4).
 * Pure function of append-only reliability_score_events. Never edited by hand;
 * recomputable at any time. Formula version is stamped on outputs so historic
 * scores can be reproduced exactly.
 */

export const RELIABILITY_FORMULA_VERSION = "v1";

export type ReliabilityEventKind =
  | "milestone_on_time" // numericValue: schedule variance in days (negative = early)
  | "budget_variance" // numericValue: (certified - baseline) / baseline
  | "snag_intensity" // numericValue: severity-weighted snags per milestone
  | "evidence_compliance" // numericValue: 1 if pack complete first time, else 0
  | "conduct_incident" // numericValue: severity 1..3 (substantiated only)
  | "client_rating"; // numericValue: 1..5

export interface ReliabilityEvent {
  kind: ReliabilityEventKind;
  numericValue: number;
  occurredAt: Date;
}

export interface ReliabilityResult {
  score: number; // 0..100
  confidenceLow: number;
  confidenceHigh: number;
  eventsCount: number;
  formulaVersion: string;
}

/** Half-life decay in days: recent performance dominates (24-month horizon). */
const HALF_LIFE_DAYS = 240;

const WEIGHTS: Record<ReliabilityEventKind, number> = {
  milestone_on_time: 0.3,
  budget_variance: 0.2,
  snag_intensity: 0.15,
  evidence_compliance: 0.1,
  conduct_incident: 0.05,
  client_rating: 0.2, // capped: ratings are gameable, verified events are not
};

/** Map each event to a 0..1 quality signal. */
function eventSignal(e: ReliabilityEvent): number {
  switch (e.kind) {
    case "milestone_on_time": {
      // 0 days late → 1.0; 30+ days late → 0; early caps at 1.0
      const late = Math.max(0, e.numericValue);
      return Math.max(0, 1 - late / 30);
    }
    case "budget_variance": {
      // 0% over → 1.0; 20%+ over → 0; under-budget caps at 1.0
      const over = Math.max(0, e.numericValue);
      return Math.max(0, 1 - over / 0.2);
    }
    case "snag_intensity": {
      // 0 weighted snags → 1.0; 10+ → 0
      return Math.max(0, 1 - e.numericValue / 10);
    }
    case "evidence_compliance":
      return e.numericValue >= 1 ? 1 : 0;
    case "conduct_incident":
      // any substantiated incident is heavily penalising
      return Math.max(0, 1 - e.numericValue / 2);
    case "client_rating":
      return Math.min(1, Math.max(0, (e.numericValue - 1) / 4));
  }
}

export function computeReliability(
  events: readonly ReliabilityEvent[],
  asOf: Date = new Date(),
): ReliabilityResult | null {
  if (events.length === 0) return null;

  let weightedSum = 0;
  let weightTotal = 0;

  for (const e of events) {
    const ageDays = Math.max(
      0,
      (asOf.getTime() - e.occurredAt.getTime()) / 86_400_000,
    );
    const decay = Math.pow(0.5, ageDays / HALF_LIFE_DAYS);
    const w = WEIGHTS[e.kind] * decay;
    weightedSum += eventSignal(e) * w;
    weightTotal += w;
  }

  if (weightTotal === 0) return null;

  const score = (weightedSum / weightTotal) * 100;
  // Confidence narrows with evidence volume: ±30 at 1 event → ±5 at 36+.
  const halfWidth = Math.max(5, 30 - events.length * 0.7);

  return {
    score: round2(score),
    confidenceLow: round2(Math.max(0, score - halfWidth)),
    confidenceHigh: round2(Math.min(100, score + halfWidth)),
    eventsCount: events.length,
    formulaVersion: RELIABILITY_FORMULA_VERSION,
  };
}

const round2 = (n: number): number => Math.round(n * 100) / 100;
