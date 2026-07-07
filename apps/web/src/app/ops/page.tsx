import Link from "next/link";
import { listProjects } from "@/modules/delivery/service";

export const dynamic = "force-dynamic";

const fmtKes = (n: number | null) =>
  n == null ? "—" : `KES ${Number(n).toLocaleString("en-KE")}`;

export default async function OpsHome() {
  const projects = await listProjects();

  return (
    <div>
      <h1>Delivery console</h1>
      <p className="sub">
        Every active engagement, its stage, and what needs attention.
      </p>
      <p>
        <Link className="btn" href="/ops/projects/new">
          + New project
        </Link>
      </p>

      <div className="card">
        {projects.length === 0 ? (
          <p className="muted">
            No projects yet. Create the first one to start the delivery loop.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Ref</th>
                <th>Project</th>
                <th>County</th>
                <th>Stage</th>
                <th className="right">Contract value</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id}>
                  <td>
                    <code className="ref">{p.reference}</code>
                  </td>
                  <td>
                    <Link href={`/ops/projects/${p.id}`}>{p.name}</Link>
                  </td>
                  <td>{(p as { sites?: { county?: string } }).sites?.county ?? "—"}</td>
                  <td>
                    <span className={`badge ${p.stage}`}>{p.stage}</span>
                  </td>
                  <td className="right">{fmtKes(p.construction_value_kes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
