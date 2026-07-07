import Link from "next/link";
import type { MilestoneStatus } from "@msingi/domain";
import { getProjectDetail } from "@/modules/delivery/service";
import { pendingDisbursements } from "@/modules/money/service";
import {
  addMilestoneAction,
  certifyMilestoneAction,
  claimMilestoneAction,
  confirmDisbursementAction,
  startMilestoneAction,
} from "../../actions";

export const dynamic = "force-dynamic";

const fmtKes = (n: number | string | null) =>
  n == null ? "—" : `KES ${Number(n).toLocaleString("en-KE")}`;

/** Which ops action applies at each milestone status (owner approval is not ours). */
const OPS_ACTION: Partial<
  Record<MilestoneStatus, { label: string; action: (fd: FormData) => Promise<void> }>
> = {
  planned: { label: "Start work", action: startMilestoneAction },
  in_progress: { label: "Submit pack & claim", action: claimMilestoneAction },
  claimed: { label: "Certify (inspection passed)", action: certifyMilestoneAction },
};

export default async function OpsProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { project, milestones, ledger } = await getProjectDetail(id);
  const pending = await pendingDisbursements(id);

  const site = (project as { sites?: { label?: string; county?: string } }).sites;
  const owner = (project as { parties?: { display_name?: string } }).parties;

  const disbursedTotal = ledger
    .filter((l) => l.account === "project_account")
    .reduce((s, l) => s + Number(l.debit_kes), 0);

  return (
    <div>
      <p className="muted">
        <Link href="/ops">← All projects</Link>
      </p>
      <h1>
        {project.name} <code className="ref">{project.reference}</code>
      </h1>
      <p className="sub">
        {owner?.display_name} · {site?.label} ({site?.county}) ·{" "}
        <span className={`badge ${project.stage}`}>{project.stage}</span>
      </p>

      <div className="grid cols-3">
        <div className="card stat">
          <div className="label">Contract value</div>
          <div className="value">{fmtKes(project.construction_value_kes)}</div>
        </div>
        <div className="card stat">
          <div className="label">Delivery fee</div>
          <div className="value">{project.fee_percent ?? "6.5"}%</div>
        </div>
        <div className="card stat">
          <div className="label">Disbursed to date</div>
          <div className="value">{fmtKes(disbursedTotal)}</div>
        </div>
      </div>

      {pending.length > 0 && (
        <>
          <h2>Awaiting bank execution (owner has approved)</h2>
          <div className="card">
            <table>
              <thead>
                <tr>
                  <th>Milestone</th>
                  <th className="right">Amount</th>
                  <th>Confirm execution</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((d) => (
                  <tr key={d.id}>
                    <td>
                      {(d as { milestones?: { sequence_no?: number; title?: string } })
                        .milestones?.title ?? d.milestone_id}
                    </td>
                    <td className="right">{fmtKes(d.total_kes)}</td>
                    <td>
                      <form action={confirmDisbursementAction} className="actions">
                        <input type="hidden" name="disbursementId" value={d.id} />
                        <input type="hidden" name="projectId" value={id} />
                        <input
                          name="railReference"
                          placeholder="Bank / M-Pesa ref"
                          required
                          style={{ maxWidth: 200 }}
                        />
                        <button type="submit">Posted — confirm</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <h2>Milestones</h2>
      <div className="card">
        {milestones.length === 0 ? (
          <p className="muted">No milestones yet — add the payment plan below.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Milestone</th>
                <th className="right">Value</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {milestones.map((m) => {
                const op = OPS_ACTION[m.status as MilestoneStatus];
                return (
                  <tr key={m.id}>
                    <td>{m.sequence_no}</td>
                    <td>
                      {m.title}
                      {m.is_hold_point && (
                        <span className="badge disputed" style={{ marginLeft: 8 }}>
                          hold point
                        </span>
                      )}
                    </td>
                    <td className="right">{fmtKes(m.value_kes)}</td>
                    <td>
                      <span className={`badge ${m.status}`}>{m.status}</span>
                    </td>
                    <td>
                      {op ? (
                        <form action={op.action} className="inline-form">
                          <input type="hidden" name="milestoneId" value={m.id} />
                          <input type="hidden" name="projectId" value={id} />
                          <button type="submit" className="ghost">
                            {op.label}
                          </button>
                        </form>
                      ) : m.status === "certified" ? (
                        <span className="muted">awaiting owner approval</span>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <h2>Add milestone</h2>
      <div className="card">
        <form className="stack" action={addMilestoneAction}>
          <input type="hidden" name="projectId" value={id} />
          <label>
            Title
            <input name="title" required placeholder="Substructure to DPC level" />
          </label>
          <label>
            Description
            <textarea name="description" rows={2} />
          </label>
          <label>
            Value (KES)
            <input name="valueKes" type="number" min="1" step="1000" required />
          </label>
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              name="isHoldPoint"
              type="checkbox"
              style={{ width: "auto" }}
            />
            Hold point (work must not proceed past this without inspection)
          </label>
          <button type="submit">Add milestone</button>
        </form>
      </div>
    </div>
  );
}
