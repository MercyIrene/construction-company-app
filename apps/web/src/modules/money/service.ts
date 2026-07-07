import "server-only";
import { randomUUID } from "node:crypto";
import {
  APPROVABLE_STATUS,
  assertMilestoneTransition,
  buildMilestoneJournal,
  centsToKes,
  type MilestoneStatus,
} from "@msingi/domain";
import { adminClient } from "@/lib/supabase/admin";

/**
 * Money module (ADR-0005, ADR-0007). The platform records instructions and
 * postings; funds move in the client's dual-mandate project account. The
 * pilot rail is `manual`: finance ops executes the instruction at the bank
 * and confirms here — the record system is identical either way.
 */

const CONTRACTOR_WHT_RATE = 0.03; // resident contractor WHT (doc 06 §4)

/** PostgREST types embedded relations as arrays; normalize to the single row. */
const one = <T,>(v: T | T[] | null | undefined): T | undefined =>
  Array.isArray(v) ? v[0] : (v ?? undefined);

/**
 * Owner release approval (docs/04 §3 step 4). Caller must have verified the
 * actor holds owner_primary/owner_approver on this project. Binds the
 * approval to the evidence-pack version reviewed (threat T3).
 */
export async function approveAndPrepareDisbursement(
  milestoneId: string,
  packVersion: number,
  approverId: string,
) {
  const db = adminClient();

  const { data: m, error: mErr } = await db
    .from("milestones")
    .select(
      "id, project_id, status, value_kes, evidence_pack_id, engagement_id, projects(fee_percent), project_engagements!milestones_engagement_id_fkey(retention_percent)",
    )
    .eq("id", milestoneId)
    .single();
  if (mErr) throw new Error(`approve: ${mErr.message}`);

  if (m.status !== APPROVABLE_STATUS) {
    throw new Error(`Milestone is ${m.status}; only certified milestones can be approved`);
  }
  assertMilestoneTransition(m.status as MilestoneStatus, "approved");

  const { data: pack } = await db
    .from("evidence_packs")
    .select("version")
    .eq("id", m.evidence_pack_id)
    .single();
  if (!pack || pack.version !== packVersion) {
    throw new Error(
      "The evidence pack changed since you reviewed it — please review the current version",
    );
  }

  const feeRate = Number(one(m.projects)?.fee_percent ?? 6.5) / 100;
  const retentionRate =
    Number(one(m.project_engagements)?.retention_percent ?? 5) / 100;

  const journal = buildMilestoneJournal({
    grossKes: Number(m.value_kes),
    retentionRate,
    feeRate,
    contractorWhtRate: CONTRACTOR_WHT_RATE,
  });

  const { data: disb, error: dErr } = await db
    .from("disbursements")
    .insert({
      project_id: m.project_id,
      milestone_id: milestoneId,
      status: "approved",
      rail: "manual",
      idempotency_key: `ms-${milestoneId}-v${packVersion}`,
      total_kes: Number(m.value_kes),
      approved_by: approverId,
      approved_at: new Date().toISOString(),
      evidence_pack_version: String(packVersion),
      created_by: approverId,
    })
    .select("id")
    .single();
  if (dErr) {
    if (dErr.code === "23505") {
      throw new Error("This milestone release was already approved (idempotency)");
    }
    throw new Error(`approve/disbursement: ${dErr.message}`);
  }

  const lines = journal
    .filter((l) => l.creditCents > 0)
    .map((l) => ({
      disbursement_id: disb.id,
      account: l.account,
      amount_kes: centsToKes(l.creditCents),
      memo: l.memo,
    }));
  const { error: lErr } = await db.from("disbursement_lines").insert(lines);
  if (lErr) throw new Error(`approve/lines: ${lErr.message}`);

  const { error: msErr } = await db
    .from("milestones")
    .update({
      status: "approved",
      approved_by: approverId,
      approved_at: new Date().toISOString(),
    })
    .eq("id", milestoneId);
  if (msErr) throw new Error(`approve/milestone: ${msErr.message}`);

  await db.from("domain_events").insert({
    event_key: "milestone.approved",
    aggregate: "milestone",
    aggregate_id: milestoneId,
    project_id: m.project_id,
    actor_id: approverId,
    payload: { disbursement_id: disb.id, pack_version: packVersion },
  });
  await db.from("audit_log").insert({
    actor_id: approverId,
    action: "milestone.approve_release",
    subject: "disbursement",
    subject_id: disb.id,
    project_id: m.project_id,
    after_ref: { total_kes: m.value_kes, pack_version: packVersion },
  });

  return disb;
}

/**
 * Finance ops confirms the bank executed the instruction: posts the balanced
 * journal (single insert → deferred DB trigger verifies balance at commit)
 * and closes the loop on the milestone.
 */
export async function confirmDisbursementExecuted(
  disbursementId: string,
  railReference: string,
  actorId: string,
) {
  const db = adminClient();

  const { data: d, error: dErr } = await db
    .from("disbursements")
    .select("id, status, project_id, milestone_id, total_kes")
    .eq("id", disbursementId)
    .single();
  if (dErr) throw new Error(`confirm: ${dErr.message}`);
  if (d.status !== "approved" && d.status !== "instructed") {
    throw new Error(`Disbursement is ${d.status}; cannot confirm execution`);
  }

  const { data: m } = await db
    .from("milestones")
    .select("status, value_kes, project_id, engagement_id, projects(fee_percent), project_engagements!milestones_engagement_id_fkey(retention_percent)")
    .eq("id", d.milestone_id)
    .single();
  if (!m) throw new Error("confirm: milestone not found");
  assertMilestoneTransition(m.status as MilestoneStatus, "disbursed");

  const journal = buildMilestoneJournal({
    grossKes: Number(m.value_kes),
    retentionRate:
      Number(one(m.project_engagements)?.retention_percent ?? 5) / 100,
    feeRate: Number(one(m.projects)?.fee_percent ?? 6.5) / 100,
    contractorWhtRate: CONTRACTOR_WHT_RATE,
  });

  const journalId = randomUUID();
  const { error: postErr } = await db.from("ledger_entries").insert(
    journal.map((l) => ({
      journal_id: journalId,
      project_id: d.project_id,
      account: l.account,
      debit_kes: centsToKes(l.debitCents),
      credit_kes: centsToKes(l.creditCents),
      disbursement_id: d.id,
      memo: l.memo,
    })),
  );
  if (postErr) throw new Error(`confirm/ledger: ${postErr.message}`);

  const now = new Date().toISOString();
  const { error: updErr } = await db
    .from("disbursements")
    .update({
      status: "reconciled",
      instructed_at: now,
      executed_at: now,
      rail_reference: railReference,
    })
    .eq("id", disbursementId);
  if (updErr) throw new Error(`confirm/disbursement: ${updErr.message}`);

  const { error: msErr } = await db
    .from("milestones")
    .update({ status: "disbursed", disbursed_at: now })
    .eq("id", d.milestone_id);
  if (msErr) throw new Error(`confirm/milestone: ${msErr.message}`);

  await db.from("domain_events").insert({
    event_key: "milestone.disbursed",
    aggregate: "milestone",
    aggregate_id: d.milestone_id,
    project_id: d.project_id,
    actor_id: actorId,
    payload: { disbursement_id: d.id, rail_reference: railReference },
  });
  await db.from("audit_log").insert({
    actor_id: actorId,
    action: "disbursement.confirm_executed",
    subject: "disbursement",
    subject_id: d.id,
    project_id: d.project_id,
    after_ref: { rail_reference: railReference, journal_id: journalId },
  });
}

export async function pendingDisbursements(projectId?: string) {
  const db = adminClient();
  let q = db
    .from("disbursements")
    .select(
      "id, status, total_kes, approved_at, milestone_id, project_id, projects(reference, name), milestones(title, sequence_no)",
    )
    .in("status", ["approved", "instructed"])
    .order("approved_at", { ascending: true });
  if (projectId) q = q.eq("project_id", projectId);
  const { data, error } = await q;
  if (error) throw new Error(`pendingDisbursements: ${error.message}`);
  return data ?? [];
}
