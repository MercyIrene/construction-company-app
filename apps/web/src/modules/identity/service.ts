import "server-only";
import { adminClient } from "@/lib/supabase/admin";

/** Ensure a user_profiles row exists for an authenticated user. */
export async function ensureProfile(
  userId: string,
  fallbackName: string,
): Promise<void> {
  const db = adminClient();
  const { error } = await db
    .from("user_profiles")
    .upsert(
      { user_id: userId, full_name: fallbackName },
      { onConflict: "user_id", ignoreDuplicates: true },
    );
  if (error) throw new Error(`ensureProfile: ${error.message}`);
}

/**
 * Bootstrap: the very first authenticated user becomes staff_admin so the
 * company can operate. A no-op forever after (grants happen in the console,
 * audited). Safe because it only fires when staff_members is empty.
 */
export async function bootstrapFirstAdmin(userId: string): Promise<boolean> {
  const db = adminClient();
  const { count, error } = await db
    .from("staff_members")
    .select("user_id", { count: "exact", head: true });
  if (error) throw new Error(`bootstrapFirstAdmin: ${error.message}`);
  if ((count ?? 0) > 0) return false;

  const { error: insErr } = await db
    .from("staff_members")
    .insert({ user_id: userId, role: "staff_admin", granted_by: userId });
  if (insErr) {
    // lost a race with another first user — fine
    return false;
  }
  await db.from("audit_log").insert({
    actor_id: userId,
    action: "staff.bootstrap_first_admin",
    subject: "staff_members",
    subject_id: userId,
  });
  return true;
}

export async function isStaff(userId: string): Promise<boolean> {
  const db = adminClient();
  const { data } = await db
    .from("staff_members")
    .select("role")
    .eq("user_id", userId)
    .is("revoked_at", null)
    .limit(1);
  return !!data && data.length > 0;
}

/** Projects where the user sits on the owner side. */
export async function ownerProjects(userId: string) {
  const db = adminClient();
  const { data, error } = await db
    .from("project_members")
    .select("project_id, role, projects(id, reference, name, stage)")
    .eq("user_id", userId);
  if (error) throw new Error(`ownerProjects: ${error.message}`);
  return data ?? [];
}
