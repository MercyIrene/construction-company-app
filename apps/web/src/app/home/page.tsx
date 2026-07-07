import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import {
  bootstrapFirstAdmin,
  ensureProfile,
  isStaff,
  ownerProjects,
} from "@/modules/identity/service";

/** Post-login router: staff → ops console; owners → their project. */
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;

  await ensureProfile(user.id, user.email ?? "New user");
  await bootstrapFirstAdmin(user.id);

  const staff = await isStaff(user.id);
  if (staff && !params.denied) redirect("/ops");

  const memberships = await ownerProjects(user.id);
  if (memberships.length === 1 && !params.denied) {
    redirect(`/p/${memberships[0]!.project_id}`);
  }

  return (
    <div>
      <h1>Welcome{user.email ? `, ${user.email}` : ""}</h1>
      {params.denied && (
        <p className="notice warn">
          You don&apos;t have access to that area with this account.
        </p>
      )}
      {memberships.length > 0 ? (
        <>
          <p className="sub">Your projects:</p>
          {memberships.map((m) => (
            <div className="card" key={m.project_id}>
              <Link href={`/p/${m.project_id}`}>
                {(m as { projects?: { name?: string } }).projects?.name ??
                  "Project"}
              </Link>{" "}
              <span className="muted">({m.role})</span>
            </div>
          ))}
        </>
      ) : (
        <p className="sub">
          No projects are linked to this account yet. If you&apos;re expecting
          one, ask your delivery manager to add this email address —
          memberships are explicit, never assumed.
        </p>
      )}
    </div>
  );
}
