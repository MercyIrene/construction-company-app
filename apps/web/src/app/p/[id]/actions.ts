"use server";

import { revalidatePath } from "next/cache";
import { approveMilestoneSchema } from "@msingi/domain";
import { requireProjectMember } from "@/lib/auth";
import { approveAndPrepareDisbursement } from "@/modules/money/service";

/**
 * The owner's release approval — the single action that lets money move
 * (docs/04 §3 step 4). Only owner_primary / owner_approver may call it;
 * viewers are refused. TODO(E3): step-up re-authentication for releases
 * above the configured threshold (threat T1).
 */
export async function approveReleaseAction(formData: FormData) {
  const projectId = String(formData.get("projectId"));
  const { user } = await requireProjectMember(projectId, [
    "owner_primary",
    "owner_approver",
  ]);

  const input = approveMilestoneSchema.parse({
    milestoneId: formData.get("milestoneId"),
    packVersion: formData.get("packVersion"),
  });

  await approveAndPrepareDisbursement(
    input.milestoneId,
    input.packVersion,
    user.id,
  );
  revalidatePath(`/p/${projectId}`);
}
