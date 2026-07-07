"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addMilestoneSchema, createProjectSchema } from "@msingi/domain";
import { requireStaff } from "@/lib/auth";
import {
  addMilestone,
  certifyMilestone,
  claimMilestone,
  createProject,
  startMilestone,
} from "@/modules/delivery/service";
import { confirmDisbursementExecuted } from "@/modules/money/service";

export async function createProjectAction(formData: FormData) {
  const user = await requireStaff();
  const input = createProjectSchema.parse(Object.fromEntries(formData));
  const project = await createProject(input, user.id);
  redirect(`/ops/projects/${project.id}`);
}

export async function addMilestoneAction(formData: FormData) {
  const user = await requireStaff();
  const raw = Object.fromEntries(formData);
  const input = addMilestoneSchema.parse({
    ...raw,
    isHoldPoint: raw.isHoldPoint === "on",
  });
  await addMilestone(input, user.id);
  revalidatePath(`/ops/projects/${input.projectId}`);
}

export async function startMilestoneAction(formData: FormData) {
  const user = await requireStaff();
  const milestoneId = String(formData.get("milestoneId"));
  const projectId = String(formData.get("projectId"));
  await startMilestone(milestoneId, user.id);
  revalidatePath(`/ops/projects/${projectId}`);
}

export async function claimMilestoneAction(formData: FormData) {
  const user = await requireStaff();
  const milestoneId = String(formData.get("milestoneId"));
  const projectId = String(formData.get("projectId"));
  await claimMilestone(milestoneId, user.id);
  revalidatePath(`/ops/projects/${projectId}`);
}

export async function certifyMilestoneAction(formData: FormData) {
  const user = await requireStaff();
  const milestoneId = String(formData.get("milestoneId"));
  const projectId = String(formData.get("projectId"));
  await certifyMilestone(milestoneId, user.id);
  revalidatePath(`/ops/projects/${projectId}`);
}

export async function confirmDisbursementAction(formData: FormData) {
  const user = await requireStaff();
  const disbursementId = String(formData.get("disbursementId"));
  const projectId = String(formData.get("projectId"));
  const railReference = String(formData.get("railReference") ?? "").trim();
  if (!railReference) throw new Error("Bank/M-Pesa reference is required");
  await confirmDisbursementExecuted(disbursementId, railReference, user.id);
  revalidatePath(`/ops/projects/${projectId}`);
}
