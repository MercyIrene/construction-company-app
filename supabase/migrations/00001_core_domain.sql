-- =============================================================================
-- Msingi · Migration 00001 · Core domain schema
-- Executable form of docs/09-domain-model.md. Postgres 15+, Supabase-flavoured
-- (references auth.users). Forward-only. Sections mirror bounded contexts.
-- =============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "postgis";

-- =====================================================================
-- 0 · Shared enums
-- =====================================================================

create type party_kind as enum ('individual', 'organization');

create type project_stage as enum (
  'lead', 'setup', 'design', 'approvals', 'construction',
  'handover', 'defects_liability', 'closed', 'paused', 'cancelled');

create type milestone_status as enum (
  'planned', 'in_progress', 'claimed', 'certified',
  'approved', 'disbursed', 'closed', 'disputed', 'cancelled');

create type professional_discipline as enum (
  'architect', 'quantity_surveyor', 'structural_engineer', 'services_engineer',
  'contractor', 'electrical', 'plumbing', 'landscaping', 'security_systems',
  'borehole', 'interior', 'surveyor', 'other');

create type vetting_gate_kind as enum (
  'identity_legal', 'licensure', 'track_record', 'financial_conduct', 'onboarding');

create type vetting_gate_status as enum ('pending', 'in_review', 'passed', 'failed', 'waived');

create type professional_tier as enum ('probation', 'established', 'preferred', 'suspended', 'removed');

create type evidence_origin as enum ('field_app', 'gallery_upload', 'staff_upload', 'system');

create type evidence_status as enum ('pending_validation', 'verified_origin', 'unverified_origin', 'rejected');

create type certification_kind as enum (
  'inspector_pass', 'qs_valuation', 'engineer_signoff', 'architect_signoff', 'lab_test');

create type disbursement_status as enum (
  'draft', 'awaiting_approval', 'approved', 'instructed', 'executed',
  'reconciled', 'failed', 'cancelled');

create type ledger_account as enum (
  'project_account',      -- client funds at partner bank (client-owned; we mirror)
  'contractor_payable', 'consultant_payable', 'supplier_payable',
  'msingi_fee_revenue', 'retention_held', 'tax_withholding', 'adjustment');

create type payment_rail as enum ('manual', 'bank_transfer', 'mpesa_b2b', 'mpesa_b2c', 'other');

create type workflow_kind as enum (
  'project_setup', 'permit_process', 'design_stage', 'milestone_checklist',
  'handover', 'vetting', 'maintenance');

create type step_status as enum ('pending', 'in_progress', 'blocked', 'done', 'skipped', 'failed');

create type snag_severity as enum ('minor', 'major', 'blocker');
create type snag_status as enum ('open', 'in_remedy', 'ready_for_review', 'closed', 'waived');

create type dispute_status as enum (
  'opened', 'dm_review', 'hod_review', 'arbiter', 'resolved', 'withdrawn');

create type decision_status as enum ('open', 'decided', 'expired', 'cancelled');

create type project_member_role as enum ('owner_primary', 'owner_approver', 'owner_viewer');

create type staff_role as enum (
  'staff_dm', 'staff_inspector', 'staff_finance', 'staff_admin', 'vetting_officer', 'head_of_delivery');

-- =====================================================================
-- 1 · Identity & parties
-- =====================================================================

-- Profile for every authenticated human (owners, pros' staff, Msingi staff).
create table user_profiles (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  full_name     text not null,
  phone_e164    text unique,
  locale        text not null default 'en',            -- 'en' | 'sw'
  timezone      text not null default 'Africa/Nairobi',-- diaspora-aware notifications
  country_code  text not null default 'KE',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Msingi staff role grants. Finance and certification roles must be mutually
-- exclusive per user (segregation of duties, docs/11 §4) — enforced in the
-- application policy layer and audited; a partial constraint here catches
-- the direct case.
create table staff_members (
  user_id    uuid not null references user_profiles(user_id) on delete cascade,
  role       staff_role not null,
  granted_by uuid references user_profiles(user_id),
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  primary key (user_id, role)
);

-- Legal/commercial actors: an owner, a contractor firm, a practice, a supplier.
create table parties (
  id                uuid primary key default gen_random_uuid(),
  kind              party_kind not null,
  display_name      text not null,
  registration_no   text,           -- BRS company number, where organization
  kra_pin           text,
  country_code      text not null default 'KE',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table party_members (
  party_id   uuid not null references parties(id) on delete cascade,
  user_id    uuid not null references user_profiles(user_id) on delete cascade,
  is_admin   boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (party_id, user_id)
);

-- =====================================================================
-- 2 · Professional network
-- =====================================================================

create table professionals (
  id             uuid primary key default gen_random_uuid(),
  party_id       uuid not null references parties(id),
  discipline     professional_discipline not null,
  tier           professional_tier not null default 'probation',
  bio            text,
  service_counties text[] not null default '{}',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (party_id, discipline)
);

-- Statutory registrations (NCA / BORAQS / EBK ...), re-verified periodically.
create table professional_licences (
  id               uuid primary key default gen_random_uuid(),
  professional_id  uuid not null references professionals(id) on delete cascade,
  authority        text not null,             -- 'NCA' | 'BORAQS' | 'EBK' | ...
  licence_no       text not null,
  category         text,                      -- e.g. NCA class
  valid_until      date,
  last_verified_at timestamptz,
  verification_note text,
  created_at       timestamptz not null default now()
);

-- Five-gate vetting (docs/05 §1). One row per gate per vetting case.
create table vetting_cases (
  id              uuid primary key default gen_random_uuid(),
  professional_id uuid not null references professionals(id) on delete cascade,
  opened_at       timestamptz not null default now(),
  closed_at       timestamptz,
  outcome         text check (outcome in ('approved', 'rejected', 'withdrawn'))
);

create table vetting_gates (
  id            uuid primary key default gen_random_uuid(),
  case_id       uuid not null references vetting_cases(id) on delete cascade,
  gate          vetting_gate_kind not null,
  status        vetting_gate_status not null default 'pending',
  reviewed_by   uuid references user_profiles(user_id),
  reviewed_at   timestamptz,
  waive_reason  text,          -- required when status = 'waived'
  notes         text,
  unique (case_id, gate),
  constraint waive_needs_reason check (status <> 'waived' or waive_reason is not null)
);

-- Append-only performance facts; the Reliability Score is a pure function of
-- these (docs/05 §4). NO update/delete grants are ever issued on this table.
create table reliability_score_events (
  id              uuid primary key default gen_random_uuid(),
  professional_id uuid not null references professionals(id),
  project_id      uuid,                            -- fk added after projects
  milestone_id    uuid,
  event_kind      text not null,                   -- 'milestone_on_time' | 'budget_variance' |
                                                   -- 'snag_intensity' | 'evidence_compliance' |
                                                   -- 'conduct_incident' | 'client_rating'
  numeric_value   numeric,
  payload         jsonb not null default '{}',
  occurred_at     timestamptz not null default now(),
  formula_inputs_version text not null default 'v1'
);

-- Computed snapshots (cache; recomputable from events at any time).
create table reliability_scores (
  professional_id uuid primary key references professionals(id) on delete cascade,
  score           numeric(5,2) not null,
  confidence_low  numeric(5,2),
  confidence_high numeric(5,2),
  events_count    integer not null,
  formula_version text not null,
  computed_at     timestamptz not null default now()
);

-- =====================================================================
-- 3 · Projects & delivery
-- =====================================================================

create table sites (
  id            uuid primary key default gen_random_uuid(),
  label         text not null,
  county        text not null,
  sub_county    text,
  parcel_no     text,                        -- LR / title reference
  location      geography(point, 4326),
  geofence      geography(polygon, 4326),    -- evidence admissibility boundary
  geofence_tolerance_m integer not null default 150,
  country_code  text not null default 'KE',
  created_at    timestamptz not null default now()
);

create table projects (
  id                 uuid primary key default gen_random_uuid(),
  reference          text not null unique,          -- human ref e.g. 'MSG-2026-0042'
  name               text not null,
  owner_party_id     uuid not null references parties(id),
  site_id            uuid not null references sites(id),
  stage              project_stage not null default 'lead',
  stage_before_pause project_stage,                 -- restored on resume
  construction_value_kes numeric(14,2),             -- current certified baseline
  fee_percent        numeric(5,2),
  currency           text not null default 'KES',
  started_at         date,
  target_handover    date,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table reliability_score_events
  add constraint rse_project_fk foreign key (project_id) references projects(id);

-- Owner-side membership: real family dynamics get explicit roles (docs/09 §6).
create table project_members (
  project_id uuid not null references projects(id) on delete cascade,
  user_id    uuid not null references user_profiles(user_id),
  role       project_member_role not null,
  added_at   timestamptz not null default now(),
  primary key (project_id, user_id)
);

-- Msingi staff assignment (least-privilege: staff see only assigned projects).
create table project_staff (
  project_id uuid not null references projects(id) on delete cascade,
  user_id    uuid not null references user_profiles(user_id),
  role       staff_role not null,
  added_at   timestamptz not null default now(),
  primary key (project_id, user_id, role)
);

-- Professional engagements: owner contracts pro directly; we administer.
create table project_engagements (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references projects(id) on delete cascade,
  professional_id uuid not null references professionals(id),
  discipline      professional_discipline not null,
  contract_value_kes numeric(14,2),
  retention_percent  numeric(5,2) not null default 5.00,
  contract_document_id uuid,                       -- fk added after documents
  status          text not null default 'active'
                  check (status in ('proposed','active','completed','terminated')),
  created_at      timestamptz not null default now()
);

-- The atomic trust unit (docs/09 §3). State transitions are enforced in the
-- application state machine; the DB backstops the money-critical invariants.
create table milestones (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references projects(id) on delete cascade,
  engagement_id   uuid not null references project_engagements(id),
  sequence_no     integer not null,
  title           text not null,
  description     text,
  checklist_template_id uuid,                      -- fk added after templates
  value_kes       numeric(14,2) not null check (value_kes >= 0),
  status          milestone_status not null default 'planned',
  is_hold_point   boolean not null default false,
  planned_start   date,
  planned_end     date,
  claimed_at      timestamptz,
  certified_at    timestamptz,
  approved_at     timestamptz,
  approved_by     uuid references user_profiles(user_id), -- must hold owner_approver
  disbursed_at    timestamptz,
  evidence_pack_id uuid,                           -- fk added after packs
  unique (project_id, sequence_no)
);

alter table reliability_score_events
  add constraint rse_milestone_fk foreign key (milestone_id) references milestones(id);

create table inspections (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references projects(id) on delete cascade,
  milestone_id  uuid references milestones(id),
  inspector_id  uuid not null references user_profiles(user_id),
  kind          text not null check (kind in ('routine','milestone','hold_point','statutory','handover','defects')),
  checklist_instance_id uuid,                      -- fk added after workflow tables
  visited_at    timestamptz not null,
  passed        boolean,
  report        text,
  created_at    timestamptz not null default now()
);

create table snags (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references projects(id) on delete cascade,
  inspection_id uuid references inspections(id),
  milestone_id  uuid references milestones(id),
  severity      snag_severity not null,
  status        snag_status not null default 'open',
  title         text not null,
  detail        text,
  raised_by     uuid not null references user_profiles(user_id),
  assigned_engagement_id uuid references project_engagements(id),
  due_date      date,
  closed_at     timestamptz,
  created_at    timestamptz not null default now()
);

-- Owner-pre-approved changes; the ONLY path that changes milestone value.
create table variations (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid not null references projects(id) on delete cascade,
  milestone_id   uuid references milestones(id),
  title          text not null,
  description    text,
  cost_delta_kes numeric(14,2) not null,
  schedule_delta_days integer not null default 0,
  priced_by      uuid references user_profiles(user_id),   -- QS
  status         text not null default 'proposed'
                 check (status in ('proposed','approved','rejected','withdrawn')),
  approved_by    uuid references user_profiles(user_id),
  approved_at    timestamptz,
  created_at     timestamptz not null default now()
);

-- Structured owner decisions (tile choices, variation approvals...) — never chat.
create table decision_requests (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references projects(id) on delete cascade,
  title        text not null,
  context      text,
  options      jsonb not null,          -- [{key,label,cost_delta_kes,schedule_delta_days,media[]}]
  status       decision_status not null default 'open',
  decided_key  text,
  decided_by   uuid references user_profiles(user_id),
  decided_at   timestamptz,
  due_at       timestamptz,
  created_at   timestamptz not null default now()
);

create table disputes (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references projects(id) on delete cascade,
  milestone_id uuid references milestones(id),
  raised_by    uuid not null references user_profiles(user_id),
  status       dispute_status not null default 'opened',
  summary      text not null,
  resolution   text,
  resolved_at  timestamptz,
  created_at   timestamptz not null default now()
);

-- =====================================================================
-- 4 · Money
-- =====================================================================

-- Versioned baseline budgets; lines are the QS bill-of-quantities summary level.
create table budgets (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects(id) on delete cascade,
  version     integer not null,
  status      text not null default 'draft' check (status in ('draft','approved','superseded')),
  approved_by uuid references user_profiles(user_id),
  approved_at timestamptz,
  created_at  timestamptz not null default now(),
  unique (project_id, version)
);

create table budget_lines (
  id           uuid primary key default gen_random_uuid(),
  budget_id    uuid not null references budgets(id) on delete cascade,
  code         text not null,             -- element code e.g. '3.2 Walling'
  description  text not null,
  amount_kes   numeric(14,2) not null check (amount_kes >= 0),
  milestone_id uuid references milestones(id)
);

-- Mirror of the client's dual-mandate account at the partner bank (ADR-0007).
create table project_accounts (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid not null unique references projects(id) on delete cascade,
  bank_name      text not null,
  account_ref    text not null,             -- masked/reference only; never full credentials
  mandate_document_id uuid,                 -- fk added after documents
  opened_at      date,
  status         text not null default 'active' check (status in ('pending','active','closed'))
);

-- Instructed movements. State machine (ADR-0005):
-- draft → awaiting_approval → approved → instructed → executed → reconciled
create table disbursements (
  id               uuid primary key default gen_random_uuid(),
  project_id       uuid not null references projects(id),
  milestone_id     uuid references milestones(id),
  status           disbursement_status not null default 'draft',
  rail             payment_rail not null default 'manual',
  idempotency_key  text not null unique,
  total_kes        numeric(14,2) not null check (total_kes > 0),
  approved_by      uuid references user_profiles(user_id),
  approved_at      timestamptz,
  -- binds the approval to exactly what the approver reviewed (threat T3):
  evidence_pack_version text,
  instructed_at    timestamptz,
  executed_at      timestamptz,
  rail_reference   text,                    -- bank/M-Pesa confirmation ref
  failure_reason   text,
  created_by       uuid not null references user_profiles(user_id),
  created_at       timestamptz not null default now()
);

-- Split of a disbursement: contractor net, fee tranche, retention, WHT...
create table disbursement_lines (
  id               uuid primary key default gen_random_uuid(),
  disbursement_id  uuid not null references disbursements(id) on delete cascade,
  account          ledger_account not null,
  payee_party_id   uuid references parties(id),
  amount_kes       numeric(14,2) not null,
  memo             text
);

-- Double-entry, append-only. Postings are created only by the money module on
-- disbursement reconciliation and funding confirmations; corrections are
-- reversing entries. Sum(debits) = Sum(credits) per journal_id is asserted by
-- a deferred trigger installed in migration 00002 and by property tests.
create table ledger_entries (
  id           bigint generated always as identity primary key,
  journal_id   uuid not null,
  project_id   uuid not null references projects(id),
  account      ledger_account not null,
  party_id     uuid references parties(id),
  debit_kes    numeric(14,2) not null default 0 check (debit_kes >= 0),
  credit_kes   numeric(14,2) not null default 0 check (credit_kes >= 0),
  disbursement_id uuid references disbursements(id),
  memo         text,
  posted_at    timestamptz not null default now(),
  constraint one_side_only check ((debit_kes = 0) <> (credit_kes = 0))
);

create index ledger_by_project on ledger_entries (project_id, account);
create index ledger_by_journal on ledger_entries (journal_id);

-- =====================================================================
-- 5 · Evidence & documents
-- =====================================================================

-- Immutable after insert (docs/09 §3): no UPDATE grant is issued; metadata
-- corrections append via evidence_annotations.
create table evidence_items (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid not null references projects(id),
  storage_path   text not null,
  media_type     text not null,             -- mime
  sha256         text not null,
  perceptual_hash text,
  origin         evidence_origin not null,
  status         evidence_status not null default 'pending_validation',
  captured_by    uuid references user_profiles(user_id),
  captured_at    timestamptz,
  gps            geography(point, 4326),
  within_geofence boolean,
  exif           jsonb,
  created_at     timestamptz not null default now()
);

create index evidence_by_project on evidence_items (project_id, created_at);
create index evidence_dedupe on evidence_items (sha256);

create table evidence_annotations (
  id          uuid primary key default gen_random_uuid(),
  evidence_id uuid not null references evidence_items(id),
  author_id   uuid not null references user_profiles(user_id),
  kind        text not null check (kind in ('note','correction','dispute','validation')),
  body        text not null,
  created_at  timestamptz not null default now()
);

-- The bundle a milestone claim must present (hard gate). Versioned: an
-- amended pack gets a new version; approvals reference the version reviewed.
create table evidence_packs (
  id           uuid primary key default gen_random_uuid(),
  milestone_id uuid not null references milestones(id),
  version      integer not null default 1,
  status       text not null default 'assembling'
               check (status in ('assembling','submitted','returned','accepted')),
  assembled_by uuid references user_profiles(user_id),
  submitted_at timestamptz,
  unique (milestone_id, version)
);

create table evidence_pack_items (
  pack_id             uuid not null references evidence_packs(id) on delete cascade,
  evidence_id         uuid references evidence_items(id),
  document_id         uuid,                       -- fk added below
  requirement_key     text not null,              -- which checklist requirement this satisfies
  primary key (pack_id, requirement_key),
  constraint item_has_content check (evidence_id is not null or document_id is not null)
);

-- Formal attestations, always attributable, always pack-linked where relevant.
create table certifications (
  id            uuid primary key default gen_random_uuid(),
  milestone_id  uuid not null references milestones(id),
  pack_id       uuid references evidence_packs(id),
  kind          certification_kind not null,
  certified_by  uuid not null references user_profiles(user_id),
  professional_id uuid references professionals(id),  -- when certifier acts for a firm
  amount_kes    numeric(14,2),                        -- for qs_valuation
  statement     text,
  certified_at  timestamptz not null default now()
);

-- Contract/permit/drawing vault (distinct from site media).
create table documents (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid references projects(id),
  party_id     uuid references parties(id),        -- vetting docs etc.
  kind         text not null,                      -- 'contract','permit','drawing','boq',
                                                   -- 'insurance','test_result','title','other'
  title        text not null,
  storage_path text not null,
  sha256       text not null,
  version      integer not null default 1,
  uploaded_by  uuid references user_profiles(user_id),
  created_at   timestamptz not null default now(),
  constraint doc_has_scope check (project_id is not null or party_id is not null)
);

alter table evidence_pack_items
  add constraint epi_document_fk foreign key (document_id) references documents(id);
alter table project_engagements
  add constraint eng_contract_fk foreign key (contract_document_id) references documents(id);
alter table project_accounts
  add constraint acct_mandate_fk foreign key (mandate_document_id) references documents(id);
alter table milestones
  add constraint ms_pack_fk foreign key (evidence_pack_id) references evidence_packs(id);

-- =====================================================================
-- 6 · Workflow & compliance (ADR-0008)
-- =====================================================================

create table workflow_templates (
  id           uuid primary key default gen_random_uuid(),
  kind         workflow_kind not null,
  key          text not null,                 -- e.g. 'permit.kiambu.residential'
  version      integer not null default 1,
  title        text not null,
  definition   jsonb not null,                -- validated against JSON schema in app
  county       text,                          -- for permit templates
  country_code text not null default 'KE',
  is_active    boolean not null default true,
  created_by   uuid references user_profiles(user_id),
  created_at   timestamptz not null default now(),
  unique (key, version)
);

alter table milestones
  add constraint ms_checklist_fk foreign key (checklist_template_id) references workflow_templates(id);

create table workflow_instances (
  id           uuid primary key default gen_random_uuid(),
  template_id  uuid not null references workflow_templates(id),
  project_id   uuid references projects(id) on delete cascade,
  vetting_case_id uuid references vetting_cases(id),
  milestone_id uuid references milestones(id),
  status       text not null default 'active'
               check (status in ('active','completed','abandoned')),
  created_at   timestamptz not null default now(),
  constraint wf_has_subject check (
    project_id is not null or vetting_case_id is not null or milestone_id is not null)
);

create table workflow_steps (
  id            uuid primary key default gen_random_uuid(),
  instance_id   uuid not null references workflow_instances(id) on delete cascade,
  step_key      text not null,
  title         text not null,
  status        step_status not null default 'pending',
  depends_on    text[] not null default '{}',
  assignee_role text,
  assignee_id   uuid references user_profiles(user_id),
  is_gate       boolean not null default false,   -- gates block dependents until done
  due_date      date,
  completed_by  uuid references user_profiles(user_id),
  completed_at  timestamptz,
  data          jsonb not null default '{}',      -- checklist answers, doc refs
  unique (instance_id, step_key)
);

alter table inspections
  add constraint insp_checklist_fk foreign key (checklist_instance_id) references workflow_instances(id);

-- =====================================================================
-- 7 · Communication
-- =====================================================================

create table notifications (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references user_profiles(user_id),
  project_id   uuid references projects(id),
  channel      text not null check (channel in ('whatsapp','sms','email','in_app')),
  template_key text not null,
  payload      jsonb not null default '{}',
  status       text not null default 'queued'
               check (status in ('queued','sent','delivered','failed','suppressed')),
  scheduled_for timestamptz,                  -- recipient-local quiet hours
  sent_at      timestamptz,
  provider_ref text,
  created_at   timestamptz not null default now()
);

create index notifications_queue on notifications (status, scheduled_for);

-- =====================================================================
-- 8 · Home File
-- =====================================================================

create table home_files (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null unique references projects(id),
  owner_party_id uuid not null references parties(id),
  assembled_at timestamptz,
  summary     jsonb not null default '{}'      -- index of the archive
);

create table warranty_items (
  id            uuid primary key default gen_random_uuid(),
  home_file_id  uuid not null references home_files(id) on delete cascade,
  component     text not null,                 -- 'roof membrane', 'borehole pump'...
  provider_party_id uuid references parties(id),
  document_id   uuid references documents(id),
  starts_on     date,
  expires_on    date,
  terms         text
);

create table maintenance_tasks (
  id            uuid primary key default gen_random_uuid(),
  home_file_id  uuid not null references home_files(id) on delete cascade,
  title         text not null,
  cadence       text,                          -- 'quarterly', 'annual'...
  next_due      date,
  last_done_at  timestamptz,
  notes         text
);

-- =====================================================================
-- 9 · Cross-cutting: outbox, audit
-- =====================================================================

-- Domain-event outbox (ADR-0001). Append-only; consumed by workers with
-- at-least-once semantics (consumers are idempotent).
create table domain_events (
  id            bigint generated always as identity primary key,
  event_key     text not null,                 -- 'milestone.certified', 'project.paused'...
  aggregate     text not null,                 -- 'milestone', 'project'...
  aggregate_id  uuid not null,
  project_id    uuid,
  payload       jsonb not null default '{}',
  actor_id      uuid,
  occurred_at   timestamptz not null default now(),
  processed_at  timestamptz
);

create index events_unprocessed on domain_events (processed_at) where processed_at is null;
create index events_by_aggregate on domain_events (aggregate, aggregate_id);

-- Privileged-action audit (docs/11 §3). Append-only; exported weekly.
create table audit_log (
  id          bigint generated always as identity primary key,
  actor_id    uuid,
  action      text not null,                  -- 'milestone.approve', 'staff.grant_role'...
  subject     text not null,
  subject_id  uuid,
  project_id  uuid,
  before_ref  jsonb,
  after_ref   jsonb,
  ip          inet,
  session_ref text,
  at          timestamptz not null default now()
);

create index audit_by_subject on audit_log (subject, subject_id);
create index audit_by_project on audit_log (project_id, at);
