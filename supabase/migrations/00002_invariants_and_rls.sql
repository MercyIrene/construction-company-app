-- =============================================================================
-- Msingi · Migration 00002 · Database-enforced invariants + Row-Level Security
-- The DB is the backstop for money/evidence invariants (docs/09 §3) and for
-- tenant isolation (threat T4, docs/11). Application-layer policy is the
-- primary enforcement; nothing here relies on the app being correct.
-- =============================================================================

-- =====================================================================
-- 1 · Invariant triggers
-- =====================================================================

-- 1.1 Ledger journals must balance (deferred to transaction end so a journal's
--     entries can be inserted row by row inside one transaction).
create or replace function assert_journal_balanced() returns trigger
language plpgsql as $$
declare
  bal numeric;
begin
  select coalesce(sum(debit_kes) - sum(credit_kes), 0)
    into bal
    from ledger_entries
   where journal_id = coalesce(new.journal_id, old.journal_id);
  if bal <> 0 then
    raise exception 'ledger journal % does not balance (delta %)',
      coalesce(new.journal_id, old.journal_id), bal;
  end if;
  return null;
end $$;

create constraint trigger ledger_balanced
  after insert on ledger_entries
  deferrable initially deferred
  for each row execute function assert_journal_balanced();

-- 1.2 Ledger and event/audit tables are append-only.
create or replace function forbid_mutation() returns trigger
language plpgsql as $$
begin
  raise exception 'table % is append-only', tg_table_name;
end $$;

create trigger ledger_append_only  before update or delete on ledger_entries
  for each row execute function forbid_mutation();
create trigger events_no_delete    before delete on domain_events
  for each row execute function forbid_mutation();
create trigger audit_append_only   before update or delete on audit_log
  for each row execute function forbid_mutation();
create trigger rse_append_only     before update or delete on reliability_score_events
  for each row execute function forbid_mutation();

-- 1.3 Evidence items: content/metadata columns immutable after insert
--     (validation pipeline may only set status / within_geofence / perceptual_hash).
create or replace function evidence_guard() returns trigger
language plpgsql as $$
begin
  if new.storage_path is distinct from old.storage_path
     or new.sha256     is distinct from old.sha256
     or new.captured_at is distinct from old.captured_at
     or new.captured_by is distinct from old.captured_by
     or new.gps::text  is distinct from old.gps::text
     or new.exif       is distinct from old.exif
     or new.origin     is distinct from old.origin
     or new.project_id is distinct from old.project_id then
    raise exception 'evidence content and capture metadata are immutable';
  end if;
  return new;
end $$;

create trigger evidence_immutable before update on evidence_items
  for each row execute function evidence_guard();
create trigger evidence_no_delete before delete on evidence_items
  for each row execute function forbid_mutation();

-- 1.4 Milestone gate backstops: status transitions that money depends on.
create or replace function milestone_guard() returns trigger
language plpgsql as $$
begin
  -- claimed requires a submitted evidence pack
  if new.status = 'claimed' and old.status is distinct from new.status then
    if new.evidence_pack_id is null or not exists (
      select 1 from evidence_packs p
       where p.id = new.evidence_pack_id and p.status in ('submitted','accepted')
    ) then
      raise exception 'milestone % cannot be claimed without a submitted evidence pack', new.id;
    end if;
  end if;

  -- approved requires certification + an approver recorded
  if new.status = 'approved' and old.status is distinct from new.status then
    if old.status <> 'certified' then
      raise exception 'milestone % must be certified before approval', new.id;
    end if;
    if new.approved_by is null then
      raise exception 'milestone approval must record the approving owner';
    end if;
  end if;

  -- disbursed only from approved
  if new.status = 'disbursed' and old.status not in ('approved') then
    raise exception 'milestone % cannot be disbursed from status %', new.id, old.status;
  end if;

  -- value changes only while planned, or via approved variation (app posts
  -- variation-sourced updates with local flag set)
  if new.value_kes is distinct from old.value_kes
     and old.status <> 'planned'
     and coalesce(current_setting('msingi.variation_context', true), '') <> 'on' then
    raise exception 'milestone value may only change via an approved variation';
  end if;

  return new;
end $$;

create trigger milestone_gates before update on milestones
  for each row execute function milestone_guard();

-- 1.5 Disbursement approval must bind to the reviewed pack version.
create or replace function disbursement_guard() returns trigger
language plpgsql as $$
begin
  if new.status in ('approved','instructed','executed','reconciled')
     and new.approved_by is null then
    raise exception 'disbursement % has no recorded approver', new.id;
  end if;
  if new.status in ('approved') and new.milestone_id is not null
     and new.evidence_pack_version is null then
    raise exception 'milestone disbursement approval must reference the evidence pack version reviewed';
  end if;
  return new;
end $$;

create trigger disbursement_gates before insert or update on disbursements
  for each row execute function disbursement_guard();

-- =====================================================================
-- 2 · Row-Level Security
-- =====================================================================
-- Helper predicates. SECURITY DEFINER + fixed search_path; used inside
-- policies so they must stay cheap (indexed lookups only).

create or replace function is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from staff_members
     where user_id = auth.uid() and revoked_at is null);
$$;

create or replace function is_staff_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from staff_members
     where user_id = auth.uid() and revoked_at is null
       and role in ('staff_admin','head_of_delivery'));
$$;

create or replace function can_access_project(pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select
    -- owner-side membership
    exists (select 1 from project_members
             where project_id = pid and user_id = auth.uid())
    -- assigned staff (admins see all)
    or exists (select 1 from project_staff
                where project_id = pid and user_id = auth.uid())
    or is_staff_admin()
    -- engaged professional's members
    or exists (
        select 1
          from project_engagements e
          join professionals pr on pr.id = e.professional_id
          join party_members pm on pm.party_id = pr.party_id
         where e.project_id = pid
           and e.status = 'active'
           and pm.user_id = auth.uid());
$$;

create index if not exists pm_by_user on project_members (user_id);
create index if not exists ps_by_user on project_staff (user_id);
create index if not exists partym_by_user on party_members (user_id);

-- ---- enable RLS everywhere (default deny) -------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'user_profiles','staff_members','parties','party_members',
    'professionals','professional_licences','vetting_cases','vetting_gates',
    'reliability_score_events','reliability_scores',
    'sites','projects','project_members','project_staff','project_engagements',
    'milestones','inspections','snags','variations','decision_requests','disputes',
    'budgets','budget_lines','project_accounts','disbursements','disbursement_lines',
    'ledger_entries','evidence_items','evidence_annotations','evidence_packs',
    'evidence_pack_items','certifications','documents',
    'workflow_templates','workflow_instances','workflow_steps',
    'notifications','home_files','warranty_items','maintenance_tasks',
    'domain_events','audit_log']
  loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;

-- ---- representative policies --------------------------------------------
-- Pattern: project-scoped tables get SELECT via can_access_project; writes go
-- through the service role (application layer) except narrow member actions.
-- The full per-table write-policy suite is built out with the application
-- (merge-blocking RLS tests per docs/12 §4); these policies establish the
-- read-isolation baseline so no client key can cross tenants.

create policy own_profile on user_profiles
  for select using (user_id = auth.uid() or is_staff());
create policy own_profile_update on user_profiles
  for update using (user_id = auth.uid());

create policy projects_read on projects
  for select using (can_access_project(id));

create policy milestones_read on milestones
  for select using (can_access_project(project_id));
create policy evidence_read on evidence_items
  for select using (can_access_project(project_id));
create policy packs_read on evidence_packs
  for select using (can_access_project((select m.project_id from milestones m where m.id = milestone_id)));
create policy documents_read on documents
  for select using (
    (project_id is not null and can_access_project(project_id))
    or (party_id is not null and (
          is_staff()
          or exists (select 1 from party_members pm
                      where pm.party_id = documents.party_id and pm.user_id = auth.uid()))));
create policy budgets_read on budgets
  for select using (can_access_project(project_id));
create policy budget_lines_read on budget_lines
  for select using (can_access_project((select b.project_id from budgets b where b.id = budget_id)));
create policy disbursements_read on disbursements
  for select using (can_access_project(project_id));
create policy ledger_read on ledger_entries
  for select using (can_access_project(project_id));
create policy snags_read on snags
  for select using (can_access_project(project_id));
create policy inspections_read on inspections
  for select using (can_access_project(project_id));
create policy decisions_read on decision_requests
  for select using (can_access_project(project_id));
create policy disputes_read on disputes
  for select using (can_access_project(project_id));
create policy members_read on project_members
  for select using (can_access_project(project_id));
create policy engagements_read on project_engagements
  for select using (can_access_project(project_id));
create policy notifications_own on notifications
  for select using (user_id = auth.uid() or is_staff_admin());
create policy homefiles_read on home_files
  for select using (can_access_project(project_id));

-- Owner approval actions happen via server (service role) after re-auth, so no
-- direct client UPDATE policies on milestones/disbursements are granted.

-- Staff-only surfaces:
create policy vetting_staff_only on vetting_cases
  for select using (is_staff());
create policy vetting_gates_staff_only on vetting_gates
  for select using (is_staff());
create policy rse_staff_only on reliability_score_events
  for select using (is_staff());
create policy audit_admin_only on audit_log
  for select using (is_staff_admin());
create policy events_staff_only on domain_events
  for select using (is_staff_admin());

-- Public-ish surfaces (Phase 2 will refine):
create policy pro_profiles_read on professionals
  for select using (true);              -- directory data is non-sensitive
create policy scores_read on reliability_scores
  for select using (true);              -- published with methodology (Phase 2)
create policy templates_staff on workflow_templates
  for select using (is_staff());
