/** Project stage machine (docs/09 §4). */

export const PROJECT_STAGES = [
  "lead",
  "setup",
  "design",
  "approvals",
  "construction",
  "handover",
  "defects_liability",
  "closed",
  "paused",
  "cancelled",
] as const;

export type ProjectStage = (typeof PROJECT_STAGES)[number];

const FORWARD: Record<ProjectStage, readonly ProjectStage[]> = {
  lead: ["setup", "cancelled"],
  setup: ["design", "cancelled"],
  design: ["approvals", "cancelled"],
  approvals: ["construction", "cancelled"],
  construction: ["handover"],
  handover: ["defects_liability"],
  defects_liability: ["closed"],
  closed: [],
  paused: [], // resume is handled specially (returns to stage_before_pause)
  cancelled: [],
};

const PAUSABLE: readonly ProjectStage[] = [
  "setup",
  "design",
  "approvals",
  "construction",
];

export function canTransitionProject(
  from: ProjectStage,
  to: ProjectStage,
): boolean {
  if (to === "paused") return PAUSABLE.includes(from);
  return FORWARD[from].includes(to);
}

export function canResumeTo(stageBeforePause: ProjectStage | null): boolean {
  return stageBeforePause !== null && PAUSABLE.includes(stageBeforePause);
}
