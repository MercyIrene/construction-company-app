import type { MilestoneStatus } from "@msingi/domain";
import { requireProjectMember } from "@/lib/auth";
import { getProjectDetail } from "@/modules/delivery/service";
import { approveReleaseAction } from "./actions";

export const dynamic = "force-dynamic";

const fmtKes = (n: number | string | null) =>
  n == null ? "—" : `KES ${Number(n).toLocaleString("en-KE")}`;

const STATUS_EXPLAINER: Record<string, string> = {
  planned: "Scheduled — work has not begun.",
  in_progress: "Work underway on site.",
  claimed: "Contractor reports this complete; our inspection is next.",
  certified: "Inspected and certified — your approval releases payment.",
  approved: "You approved release; payment is being executed.",
  disbursed: "Paid against verified work.",
  closed: "Complete.",
  disputed: "Under query — no money moves until resolved.",
};

export default async function OwnerPortal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // View access: any owner-side role. Approvals re-check the approver roles.
  const { role } = await requireProjectMember(id, [
    "owner_primary",
    "owner_approver",
    "owner_viewer",
  ]);
  const canApprove = role === "owner_primary" || role === "owner_approver";

  const { project, milestones, ledger } = await getProjectDetail(id);
  const site = (project as { sites?: { label?: string; county?: string } }).sites;

  const totalValue = milestones.reduce((s, m) => s + Number(m.value_kes), 0);
  const disbursed = milestones
    .filter((m) => ["disbursed", "closed"].includes(m.status))
    .reduce((s, m) => s + Number(m.value_kes), 0);
  const retained = ledger
    .filter((l) => l.account === "retention_held")
    .reduce((s, l) => s + Number(l.credit_kes) - Number(l.debit_kes), 0);
  const awaitingYou = milestones.filter((m) => m.status === "certified");

  return (
    <div>
      <h1>{project.name}</h1>
      <p className="sub">
        {site?.label} ({site?.county}) · project{" "}
        <code className="ref">{project.reference}</code>
      </p>

      <div className="grid cols-3">
        <div className="card stat">
          <div className="label">Milestone plan</div>
          <div className="value">{fmtKes(totalValue)}</div>
        </div>
        <div className="card stat">
          <div className="label">Paid for verified work</div>
          <div className="value">{fmtKes(disbursed)}</div>
        </div>
        <div className="card stat">
          <div className="label">Retention held for you</div>
          <div className="value">{fmtKes(retained)}</div>
        </div>
      </div>

      {awaitingYou.length > 0 && (
        <p className="notice">
          <strong>{awaitingYou.length} milestone(s) await your decision.</strong>{" "}
          Payment moves only when you approve — review the certification below.
        </p>
      )}

      <h2>Your build, milestone by milestone</h2>
      {milestones.map((m) => (
        <div className="card" key={m.id}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <strong>
                {m.sequence_no}. {m.title}
              </strong>
              <div className="muted">
                {STATUS_EXPLAINER[m.status as MilestoneStatus] ?? m.status}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div>{fmtKes(m.value_kes)}</div>
              <span className={`badge ${m.status}`}>{m.status}</span>
            </div>
          </div>

          {m.status === "certified" && canApprove && (
            <form
              action={approveReleaseAction}
              style={{ marginTop: 14, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}
            >
              <input type="hidden" name="projectId" value={id} />
              <input type="hidden" name="milestoneId" value={m.id} />
              <input type="hidden" name="packVersion" value="1" />
              <button type="submit">
                Approve release of {fmtKes(m.value_kes)}
              </button>
              <span className="muted">
                Inspected and certified by your delivery team. Funds move from
                your project account only on this approval.
              </span>
            </form>
          )}
          {m.status === "certified" && !canApprove && (
            <p className="muted" style={{ marginTop: 10 }}>
              An account holder with approval rights must release this payment.
            </p>
          )}
        </div>
      ))}
      {milestones.length === 0 && (
        <div className="card">
          <p className="muted">
            Your milestone plan is being prepared by your delivery manager.
          </p>
        </div>
      )}
    </div>
  );
}
