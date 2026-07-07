import { describe, expect, it } from "vitest";
import {
  MILESTONE_STATUSES,
  assertMilestoneTransition,
  canTransitionMilestone,
} from "./milestone";
import { canTransitionProject } from "./project";

describe("milestone state machine", () => {
  it("follows the happy path", () => {
    const path = [
      "planned",
      "in_progress",
      "claimed",
      "certified",
      "approved",
      "disbursed",
      "closed",
    ] as const;
    for (let i = 0; i < path.length - 1; i++) {
      expect(canTransitionMilestone(path[i]!, path[i + 1]!)).toBe(true);
    }
  });

  it("money can never move without the gates", () => {
    // no skipping straight to approved/disbursed
    expect(canTransitionMilestone("planned", "approved")).toBe(false);
    expect(canTransitionMilestone("in_progress", "approved")).toBe(false);
    expect(canTransitionMilestone("claimed", "approved")).toBe(false);
    expect(canTransitionMilestone("claimed", "disbursed")).toBe(false);
    expect(canTransitionMilestone("certified", "disbursed")).toBe(false);
  });

  it("terminal states are terminal", () => {
    for (const to of MILESTONE_STATUSES) {
      expect(canTransitionMilestone("closed", to)).toBe(false);
      expect(canTransitionMilestone("cancelled", to)).toBe(false);
    }
  });

  it("throws on illegal transition", () => {
    expect(() => assertMilestoneTransition("planned", "disbursed")).toThrow(
      /Illegal/,
    );
  });
});

describe("project stage machine", () => {
  it("cannot enter construction from design directly", () => {
    expect(canTransitionProject("design", "construction")).toBe(false);
    expect(canTransitionProject("approvals", "construction")).toBe(true);
  });

  it("active stages can pause; closed cannot", () => {
    expect(canTransitionProject("construction", "paused")).toBe(true);
    expect(canTransitionProject("closed", "paused")).toBe(false);
  });
});
