import "server-only";
import { redirect } from "next/navigation";
import { createSessionClient } from "./supabase/server";

export interface SessionUser {
  id: string;
  email: string | null;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { id: user.id, email: user.email ?? null };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Application-layer policy checks (docs/10 §3 layer 2). These run before any
 * admin-client write. RLS remains the backstop underneath.
 */
export async function requireStaff(): Promise<SessionUser> {
  const user = await requireUser();
  const supabase = await createSessionClient();
  const { data } = await supabase
    .from("staff_members")
    .select("role")
    .eq("user_id", user.id)
    .is("revoked_at", null);
  if (!data || data.length === 0) redirect("/home?denied=staff");
  return user;
}

export type OwnerRole = "owner_primary" | "owner_approver" | "owner_viewer";

export async function requireProjectMember(
  projectId: string,
  allowed: OwnerRole[],
): Promise<{ user: SessionUser; role: OwnerRole }> {
  const user = await requireUser();
  const supabase = await createSessionClient();
  const { data } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();
  const role = data?.role as OwnerRole | undefined;
  if (!role || !allowed.includes(role)) redirect("/home?denied=project");
  return { user, role };
}
