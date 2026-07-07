-- =============================================================================
-- Msingi · Migration 00003 · Security-advisor hardening
-- Fixes WARN-level findings from the Supabase security linter:
--   1. Trigger functions get a pinned search_path (prevents search-path
--      hijacking of the invariant guards).
--   2. SECURITY DEFINER helper functions are not callable by `anon`/PUBLIC via
--      the RPC surface. `authenticated` keeps EXECUTE because RLS policies
--      evaluate these functions as the querying role; the functions expose
--      nothing beyond the caller's own membership facts.
-- The INFO findings (RLS enabled with no policy) are intentional: those
-- tables are service-layer-only and default-deny for client keys (docs/11).
-- =============================================================================

alter function assert_journal_balanced() set search_path = public;
alter function forbid_mutation()         set search_path = public;
alter function evidence_guard()          set search_path = public;
alter function milestone_guard()         set search_path = public;
alter function disbursement_guard()      set search_path = public;

revoke execute on function is_staff()                 from public, anon;
revoke execute on function is_staff_admin()           from public, anon;
revoke execute on function can_access_project(uuid)   from public, anon;
