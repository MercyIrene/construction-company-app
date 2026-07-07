import "server-only";
import {
  assertMilestoneTransition,
  type AddMilestoneInput,
  type CreateProjectInput,
  type MilestoneStatus,
} from "@msingi/domain";
import { adminClient } from "@/lib/supabase/admin";

/**
 * Delivery module — projects and the milestone loop (docs/04 §3, docs/09).
 * Every mutation: (1) app-layer permission already checked by the caller,
 * (2) domain state machine asserted here, (3) domain event + audit row
 * emitted in the same logical operation.
 */

async function emit(
  eventKey: string,
  aggregate: string,
  aggregateId: string,
  projectId: string | null,
  actorId: string,
  payload: Record<string, unknown> = {},
) {
  const db = adminClient();
  await db.from("domain_events").insert({
    event_key: eventKey,
    aggregate,
    aggregate_id: aggregateId,
    project_id: projectId,
    actor_id: actorId,
    payload,
  });
  await db.from("audit_log").insert({
    actor_id: actorId,
    action: eventKey,
    subject: aggregate,
    subject_id: aggregateId,
    project_id: projectId,
    after_ref: payload,
  });
}

async function nextProjectReference(): Promise<string> {
  const db = adminClient();
  const year = new Date().getFullYear();
  const { count } = await db
    .from("projects")
    .select("id", { count: "exact", head: true });
  return `MSG-${year}-${String((count ?? 0) + 1).padStart(4, "0")}`;
}

export async function createProject(input: CreateProjectInput, actorId: string) {
  const db = adminClient();

  const { data: party, error: pErr } = await db
    .from("parties")
    .insert({ kind: "individual", display_name: input.ownerName })
    .select("id")
    .single();
  if (pErr) throw new Error(`createProject/party: ${pErr.message}`);

  const { data: site, error: sErr } = await db
    .from("sites")
    .insert({
      label: input.siteLabel,
      county: input.county,
      parcel_no: input.parcelNo || null,
    })
    .select("id")
    .single();
  if (sErr) throw new Error(`createProject/site: ${sErr.message}`);

  const { data: project, error: prErr } = await db
    .from("projects")
    .insert({
      reference: await nextProjectReference(),
      name: input.name,
      owner_party_id: party.id,
      site_id: site.id,
      stage: "setup",
      construction_value_kes: input.constructionValueKes,
      fee_percent: input.feePercent,
    })
    .select("id, reference")
    .single();
  if (prErr) throw new Error(`createProject/project: ${prErr.message}`);

  // Invite the owner: if a user with this email already exists they are
  // linked immediately; otherwise Supabase sends an invite email and the
  // membership row is created against the new auth user.
  const { data: invited, error: invErr } =
    await db.auth.admin.inviteUserByEmail(input.ownerEmail);
  if (!invErr && invited?.user) {
    await db.from("user_profiles").upsert(
      { user_id: invited.user.id, full_name: input.ownerName },
      { onConflict: "user_id", ignoreDuplicates: true },
    );
    await db.from("project_members").insert({
      project_id: project.id,
      user_id: invited.user.id,
      role: "owner_primary",
    });
  }

  await emit("project.created", "project", project.id, project.id, actorId, {
    reference: project.reference,
  });
  return project;
}

export async function listProjects() {
  const db = adminClient();
  const { data, error } = await db
    .from("projects")
    .select("id, reference, name, stage, construction_value_kes, created_at, sites(county)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`listProjects: ${error.message}`);
  return data ?? [];
}

export async function getProjectDetail(projectId: string) {
  const db = adminClient();
  const [{ data: project, error }, { data: milestones }, { data: ledger }] =
    await Promise.all([
      db
        .from("projects")
        .select(
          "id, reference, name, stage, construction_value_kes, fee_percent, created_at, sites(label, county, parcel_no), parties(display_name)",
        )
        .eq("id", projectId)
        .single(),
      db
        .from("milestones")
        .select(
          "id, sequence_no, title, description, value_kes, status, is_hold_point, planned_start, planned_end, evidence_pack_id, claimed_at, certified_at, approved_at, disbursed_at",
        )
        .eq("project_id", projectId)
        .order("sequence_no"),
      db
        .from("ledger_entries")
        .select("account, debit_kes, credit_kes")
        .eq("project_id", projectId),
    ]);
  if (error) throw new Error(`getProjectDetail: ${error.message}`);
  return { project, milestones: milestones ?? [], ledger: ledger ?? [] };
}

/**
 * Milestones need an engagement (the contract they're payable under). The
 * pilot slice auto-creates a single placeholder contractor engagement per
 * project; real engagements arrive with the vetting/network epics.
 */
async function ensurePilotEngagement(projectId: string): Promise<string> {
  const db = adminClient();
  const { data: existing } = await db
    .from("project_engagements")
    .select("id")
    .eq("project_id", projectId)
    .eq("status", "active")
    .limit(1);
  if (existing && existing[0]) return existing[0].id;

  const { data: party, error: pErr } = await db
    .from("parties")
    .insert({ kind: "organization", display_name: "Pilot contractor (to be engaged)" })
    .select("id")
    .single();
  if (pErr) throw new Error(`ensurePilotEngagement/party: ${pErr.message}`);
  const { data: pro, error: proErr } = await db
    .from("professionals")
    .insert({ party_id: party.id, discipline: "contractor" })
    .select("id")
    .single();
  if (proErr) throw new Error(`ensurePilotEngagement/pro: ${proErr.message}`);
  const { data: eng, error: eErr } = await db
    .from("project_engagements")
    .insert({
      project_id: projectId,
      professional_id: pro.id,
      discipline: "contractor",
    })
    .select("id")
    .single();
  if (eErr) throw new Error(`ensurePilotEngagement: ${eErr.message}`);
  return eng.id;
}

export async function addMilestone(input: AddMilestoneInput, actorId: string) {
  const db = adminClient();
  const engagementId = await ensurePilotEngagement(input.projectId);

  const { data: maxSeq } = await db
    .from("milestones")
    .select("sequence_no")
    .eq("project_id", input.projectId)
    .order("sequence_no", { ascending: false })
    .limit(1);
  const sequenceNo = (maxSeq?.[0]?.sequence_no ?? 0) + 1;

  const { data, error } = await db
    .from("milestones")
    .insert({
      project_id: input.projectId,
      engagement_id: engagementId,
      sequence_no: sequenceNo,
      title: input.title,
      description: input.description || null,
      value_kes: input.valueKes,
      is_hold_point: input.isHoldPoint,
      planned_start: input.plannedStart || null,
      planned_end: input.plannedEnd || null,
    })
    .select("id")
    .single();
  if (error) throw new Error(`addMilestone: ${error.message}`);

  await emit("milestone.added", "milestone", data.id, input.projectId, actorId, {
    title: input.title,
    value_kes: input.valueKes,
  });
  return data;
}

async function getMilestone(milestoneId: string) {
  const db = adminClient();
  const { data, error } = await db
    .from("milestones")
    .select("id, project_id, status, value_kes, evidence_pack_id")
    .eq("id", milestoneId)
    .single();
  if (error) throw new Error(`getMilestone: ${error.message}`);
  return data;
}

export async function startMilestone(milestoneId: string, actorId: string) {
  const m = await getMilestone(milestoneId);
  assertMilestoneTransition(m.status as MilestoneStatus, "in_progress");
  const db = adminClient();
  const { error } = await db
    .from("milestones")
    .update({ status: "in_progress" })
    .eq("id", milestoneId);
  if (error) throw new Error(`startMilestone: ${error.message}`);
  await emit("milestone.started", "milestone", milestoneId, m.project_id, actorId);
}

/**
 * Claim: assembles/submits the evidence pack and moves to `claimed`.
 * Pilot slice: the pack is created and submitted in one step; the hard
 * per-requirement gate arrives with milestone checklist templates (E3/P1.1).
 * The DB trigger still refuses a claim without a submitted pack.
 */
export async function claimMilestone(milestoneId: string, actorId: string) {
  const m = await getMilestone(milestoneId);
  assertMilestoneTransition(m.status as MilestoneStatus, "claimed");
  const db = adminClient();

  const { data: prevPacks } = await db
    .from("evidence_packs")
    .select("version")
    .eq("milestone_id", milestoneId)
    .order("version", { ascending: false })
    .limit(1);
  const version = (prevPacks?.[0]?.version ?? 0) + 1;

  const { data: pack, error: packErr } = await db
    .from("evidence_packs")
    .insert({
      milestone_id: milestoneId,
      version,
      status: "submitted",
      assembled_by: actorId,
      submitted_at: new Date().toISOString(),
    })
    .select("id, version")
    .single();
  if (packErr) throw new Error(`claimMilestone/pack: ${packErr.message}`);

  const { error } = await db
    .from("milestones")
    .update({
      status: "claimed",
      evidence_pack_id: pack.id,
      claimed_at: new Date().toISOString(),
    })
    .eq("id", milestoneId);
  if (error) throw new Error(`claimMilestone: ${error.message}`);

  await emit("milestone.claimed", "milestone", milestoneId, m.project_id, actorId, {
    pack_version: pack.version,
  });
  return pack;
}

/** Inspector/QS certification: records the attestation then transitions. */
export async function certifyMilestone(milestoneId: string, actorId: string) {
  const m = await getMilestone(milestoneId);
  assertMilestoneTransition(m.status as MilestoneStatus, "certified");
  const db = adminClient();

  const { error: certErr } = await db.from("certifications").insert({
    milestone_id: milestoneId,
    pack_id: m.evidence_pack_id,
    kind: "inspector_pass",
    certified_by: actorId,
    amount_kes: m.value_kes,
    statement: "Physical progress verified against milestone scope.",
  });
  if (certErr) throw new Error(`certifyMilestone/cert: ${certErr.message}`);

  const { error } = await db
    .from("milestones")
    .update({ status: "certified", certified_at: new Date().toISOString() })
    .eq("id", milestoneId);
  if (error) throw new Error(`certifyMilestone: ${error.message}`);

  await emit("milestone.certified", "milestone", milestoneId, m.project_id, actorId, {
    amount_kes: m.value_kes,
  });
}
