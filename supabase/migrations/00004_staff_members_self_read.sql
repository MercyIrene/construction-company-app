-- =============================================================================
-- Msingi · Migration 00004 · staff_members self-read policy
-- Users can read their own staff role grants; admins can read all.
-- Without this, requireStaff() (which checks via the session client under RLS
-- by design) could never see the caller's own grant — default-deny locked
-- staff out of the console entirely.
-- =============================================================================

create policy staff_members_self_read on staff_members
  for select using (user_id = auth.uid() or is_staff_admin());
