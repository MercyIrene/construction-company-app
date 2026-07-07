/**
 * Milestone state machine — the atomic trust unit (docs/09 §4).
 * This is the single definition; UI, services, and tests all consume it.
 * The database triggers in migration 00002 backstop the money-critical edges.
 */

export const MILESTONE_STATUSES = [
  "planned",
  "in_progress",
  "claimed",
  "certified",
  "approved",
  "disbursed",
  "closed",
  "disputed",
  "cancelled",
] as const;

export type MilestoneStatus = (typeof MILESTONE_STATUSES)[number];

const TRANSITIONS: Record<MilestoneStatus, readonly MilestoneStatus[]> = {
  planned: ["in_progress", "cancelled"],
  in_progress: ["claimed", "cancelled"],
  // a rejected claim returns to in_progress; disputes may open post-claim
  claimed: ["certified", "in_progress", "disputed"],
  certified: ["approved", "disputed", "in_progress"],
  approved: ["disbursed", "disputed"],
  disbursed: ["closed", "disputed"],
  closed: [],
  disputed: ["in_progress", "claimed", "certified", "approved", "disbursed", "cancelled"],
  cancelled: [],
};

export function canTransitionMilestone(
  from: MilestoneStatus,
  to: MilestoneStatus,
): boolean {
  return TRANSITIONS[from].includes(to);
}

export function assertMilestoneTransition(
  from: MilestoneStatus,
  to: MilestoneStatus,
): void {
  if (!canTransitionMilestone(from, to)) {
    throw new Error(`Illegal milestone transition: ${from} → ${to}`);
  }
}

/** Statuses in which the milestone's value may still be edited directly. */
export const VALUE_EDITABLE_STATUSES: readonly MilestoneStatus[] = ["planned"];

/** Owner approval is only meaningful from exactly this status. */
export const APPROVABLE_STATUS: MilestoneStatus = "certified";
