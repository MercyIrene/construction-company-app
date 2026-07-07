import { describe, expect, it } from "vitest";
import { computeReliability, type ReliabilityEvent } from "./reliability";

const now = new Date("2026-07-07T00:00:00Z");
const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000);

describe("reliability score v1", () => {
  it("returns null with no events (show 'no track record', never a fake score)", () => {
    expect(computeReliability([], now)).toBeNull();
  });

  it("perfect recent record scores near 100 with tight-ish band as events grow", () => {
    const events: ReliabilityEvent[] = Array.from({ length: 24 }, (_, i) => ({
      kind: "milestone_on_time",
      numericValue: -1, // a day early
      occurredAt: daysAgo(i * 10),
    }));
    const r = computeReliability(events, now)!;
    expect(r.score).toBeGreaterThan(95);
    expect(r.confidenceHigh - r.confidenceLow).toBeLessThanOrEqual(30);
  });

  it("recent failures outweigh old successes (decay)", () => {
    const oldGood: ReliabilityEvent[] = Array.from({ length: 10 }, () => ({
      kind: "milestone_on_time",
      numericValue: 0,
      occurredAt: daysAgo(700),
    }));
    const recentBad: ReliabilityEvent[] = Array.from({ length: 3 }, () => ({
      kind: "milestone_on_time",
      numericValue: 45, // 45 days late
      occurredAt: daysAgo(5),
    }));
    const r = computeReliability([...oldGood, ...recentBad], now)!;
    expect(r.score).toBeLessThan(50);
  });

  it("is deterministic for a fixed asOf (recomputable years later)", () => {
    const events: ReliabilityEvent[] = [
      { kind: "budget_variance", numericValue: 0.02, occurredAt: daysAgo(30) },
      { kind: "client_rating", numericValue: 4, occurredAt: daysAgo(15) },
    ];
    const a = computeReliability(events, now)!;
    const b = computeReliability(events, now)!;
    expect(a).toEqual(b);
  });

  it("score stays within [0, 100]", () => {
    const worst: ReliabilityEvent[] = [
      { kind: "conduct_incident", numericValue: 3, occurredAt: daysAgo(1) },
      { kind: "milestone_on_time", numericValue: 400, occurredAt: daysAgo(2) },
    ];
    const r = computeReliability(worst, now)!;
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.confidenceLow).toBeGreaterThanOrEqual(0);
    expect(r.confidenceHigh).toBeLessThanOrEqual(100);
  });
});
