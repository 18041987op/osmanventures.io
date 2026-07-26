-- Osman Ventures HQ foundation for Supabase B.
-- The HQ lives in its own non-exposed schema and does not modify existing
-- RunTech/AutoRx tables.

create extension if not exists pgcrypto;
create schema if not exists hq;

revoke all on schema hq from public, anon, authenticated;
grant usage on schema hq to service_role;

create type hq.role as enum (
  'owner',
  'group_executive',
  'company_operator',
  'department_manager',
  'finance_reviewer',
  'auditor'
);

create type hq.company_stage as enum (
  'project',
  'operating_unit',
  'managed_company',
  'scalable_company',
  'paused',
  'closed'
);

create type hq.metric_status as enum ('on_track', 'watch', 'off_track', 'not_reported');
create type hq.review_status as enum ('draft', 'submitted', 'reviewed', 'closed');
create type hq.decision_status as enum ('proposed', 'approved', 'rejected', 'implemented', 'reviewed');
create type hq.risk_status as enum ('open', 'mitigating', 'accepted', 'closed');

create table hq.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  stage hq.company_stage not null default 'project',
  cash_role text not null check (cash_role in ('cash_engine', 'investment', 'asset')),
  legal_name text,
  description text,
  owner_priority text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table hq.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role hq.role not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table hq.company_access (
  user_id uuid not null references hq.profiles(id) on delete cascade,
  company_id uuid not null references hq.companies(id) on delete cascade,
  role hq.role not null,
  created_at timestamptz not null default now(),
  primary key (user_id, company_id)
);

create table hq.operator_seats (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references hq.companies(id) on delete cascade,
  title text not null,
  seat_type text not null check (seat_type in ('company_operator', 'department_manager', 'finance', 'other')),
  incumbent_user_id uuid references hq.profiles(id),
  reports_to_seat_id uuid references hq.operator_seats(id),
  primary_result text not null,
  authority_summary text,
  approval_limits jsonb not null default '{}'::jsonb,
  scorecard_weighting jsonb not null default '{}'::jsonb,
  succession_user_id uuid references hq.profiles(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table hq.metrics (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references hq.companies(id) on delete cascade,
  owner_seat_id uuid references hq.operator_seats(id),
  name text not null,
  definition text not null,
  unit text not null,
  source_system text,
  cadence text not null check (cadence in ('daily', 'weekly', 'monthly', 'quarterly')),
  direction text not null check (direction in ('higher_is_better', 'lower_is_better', 'range')),
  is_owner_control boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, name)
);

create table hq.metric_results (
  id uuid primary key default gen_random_uuid(),
  metric_id uuid not null references hq.metrics(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  target numeric,
  actual numeric,
  status hq.metric_status not null default 'not_reported',
  variance_explanation text,
  corrective_action text,
  action_owner_user_id uuid references hq.profiles(id),
  action_due_date date,
  source_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (metric_id, period_start, period_end)
);

create table hq.weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references hq.companies(id) on delete cascade,
  operator_user_id uuid not null references hq.profiles(id),
  week_start date not null,
  status hq.review_status not null default 'draft',
  wins jsonb not null default '[]'::jsonb,
  misses jsonb not null default '[]'::jsonb,
  critical_issues jsonb not null default '[]'::jsonb,
  decisions_taken jsonb not null default '[]'::jsonb,
  decisions_required jsonb not null default '[]'::jsonb,
  next_commitments jsonb not null default '[]'::jsonb,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, week_start)
);

create table hq.capital_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references hq.companies(id) on delete cascade,
  requested_by uuid not null references hq.profiles(id),
  amount numeric(14,2) not null check (amount > 0),
  purpose text not null,
  expected_result text not null,
  milestone text not null,
  review_date date not null,
  stop_condition text not null,
  status text not null default 'requested' check (status in ('requested', 'approved', 'rejected', 'funded', 'under_review', 'continued', 'paused', 'cancelled')),
  approved_by uuid references hq.profiles(id),
  approved_amount numeric(14,2),
  funded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table hq.decisions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references hq.companies(id) on delete cascade,
  title text not null,
  context text not null,
  options jsonb not null default '[]'::jsonb,
  assumptions jsonb not null default '[]'::jsonb,
  decision text,
  owner_user_id uuid not null references hq.profiles(id),
  status hq.decision_status not null default 'proposed',
  expected_result text,
  review_date date,
  actual_result text,
  lessons text,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table hq.risks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references hq.companies(id) on delete cascade,
  title text not null,
  category text not null,
  probability smallint not null check (probability between 1 and 5),
  impact smallint not null check (impact between 1 and 5),
  owner_user_id uuid references hq.profiles(id),
  mitigation_plan text,
  next_review_date date,
  status hq.risk_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table hq.dependencies (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references hq.companies(id) on delete cascade,
  dependency_type text not null check (dependency_type in ('decision', 'approval', 'relationship', 'knowledge', 'system_access', 'execution')),
  title text not null,
  current_owner_user_id uuid references hq.profiles(id),
  target_owner_seat_id uuid references hq.operator_seats(id),
  documentation_status text not null default 'missing' check (documentation_status in ('missing', 'draft', 'verified')),
  delegation_status text not null default 'not_started' check (delegation_status in ('not_started', 'training', 'delegated', 'tested')),
  risk_if_absent text,
  next_action text,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table hq.audit_log (
  id bigint generated always as identity primary key,
  actor_user_id uuid references hq.profiles(id),
  company_id uuid references hq.companies(id),
  action text not null,
  entity_type text not null,
  entity_id text,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz not null default now()
);

create or replace function hq.set_updated_at()
returns trigger
language plpgsql
set search_path = hq, pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger companies_updated_at before update on hq.companies
for each row execute function hq.set_updated_at();
create trigger profiles_updated_at before update on hq.profiles
for each row execute function hq.set_updated_at();
create trigger operator_seats_updated_at before update on hq.operator_seats
for each row execute function hq.set_updated_at();
create trigger metrics_updated_at before update on hq.metrics
for each row execute function hq.set_updated_at();
create trigger metric_results_updated_at before update on hq.metric_results
for each row execute function hq.set_updated_at();
create trigger weekly_reviews_updated_at before update on hq.weekly_reviews
for each row execute function hq.set_updated_at();
create trigger capital_requests_updated_at before update on hq.capital_requests
for each row execute function hq.set_updated_at();
create trigger decisions_updated_at before update on hq.decisions
for each row execute function hq.set_updated_at();
create trigger risks_updated_at before update on hq.risks
for each row execute function hq.set_updated_at();
create trigger dependencies_updated_at before update on hq.dependencies
for each row execute function hq.set_updated_at();

alter table hq.companies enable row level security;
alter table hq.profiles enable row level security;
alter table hq.company_access enable row level security;
alter table hq.operator_seats enable row level security;
alter table hq.metrics enable row level security;
alter table hq.metric_results enable row level security;
alter table hq.weekly_reviews enable row level security;
alter table hq.capital_requests enable row level security;
alter table hq.decisions enable row level security;
alter table hq.risks enable row level security;
alter table hq.dependencies enable row level security;
alter table hq.audit_log enable row level security;

revoke all on all tables in schema hq from public, anon, authenticated;
revoke all on all sequences in schema hq from public, anon, authenticated;
revoke all on all functions in schema hq from public, anon, authenticated;
grant all on all tables in schema hq to service_role;
grant all on all sequences in schema hq to service_role;
grant execute on all functions in schema hq to service_role;

alter default privileges in schema hq revoke all on tables from public, anon, authenticated;
alter default privileges in schema hq revoke all on sequences from public, anon, authenticated;
alter default privileges in schema hq revoke execute on functions from public, anon, authenticated;
alter default privileges in schema hq grant all on tables to service_role;
alter default privileges in schema hq grant all on sequences to service_role;
alter default privileges in schema hq grant execute on functions to service_role;

insert into hq.companies (name, slug, stage, cash_role, description, owner_priority)
values
  ('AutoRx Center', 'autorx', 'operating_unit', 'cash_engine', 'Automotive service business and current portfolio cash engine.', 'Install a capable general manager without weakening cash flow.'),
  ('RunTech', 'runtech', 'project', 'investment', 'Vertical SaaS operating system for automotive repair shops.', 'Prove the product inside AutoRx before external scale.'),
  ('AR-C Homes', 'arc-homes', 'project', 'asset', 'Real estate development and property operations.', 'Control capital deployment, milestones, and project accountability.'),
  ('Ulua Loans', 'ulua-loans', 'project', 'investment', 'Loan operating and financial software initiative.', 'Remain in validation until legal and operating assumptions are proven.')
on conflict (slug) do update set
  name = excluded.name,
  stage = excluded.stage,
  cash_role = excluded.cash_role,
  description = excluded.description,
  owner_priority = excluded.owner_priority,
  updated_at = now();

insert into hq.operator_seats (
  company_id, title, seat_type, primary_result, authority_summary, approval_limits
)
select
  id,
  'General Manager',
  'company_operator',
  'Operate AutoRx profitably without daily dependence on Osman.',
  'Own daily operations, people, production, service, customer experience, and budget execution within written limits.',
  '{"banking":"owner_only","capital_transfers":"owner_only","debt":"owner_only","executive_hiring":"owner_approval","routine_operations":"manager"}'::jsonb
from hq.companies
where slug = 'autorx'
on conflict do nothing;

insert into hq.metrics (company_id, name, definition, unit, source_system, cadence, direction, is_owner_control)
select c.id, m.name, m.definition, m.unit, m.source_system, m.cadence, m.direction, m.is_owner_control
from hq.companies c
cross join (values
  ('Sales', 'Total finalized sales for the reporting period.', 'USD', 'Tekmetric', 'weekly', 'higher_is_better', false),
  ('Gross profit dollars', 'Sales less direct parts and labor cost.', 'USD', 'QuickBooks + Tekmetric', 'weekly', 'higher_is_better', true),
  ('Gross margin', 'Gross profit divided by sales.', 'percent', 'QuickBooks + Tekmetric', 'weekly', 'higher_is_better', true),
  ('Operating cash flow', 'Cash generated by normal AutoRx operations before portfolio transfers.', 'USD', 'QuickBooks + Banking', 'monthly', 'higher_is_better', true),
  ('Payroll percentage', 'Total payroll cost divided by sales.', 'percent', 'RunPayroll + Tekmetric', 'weekly', 'lower_is_better', true),
  ('Sold hours', 'Total labor hours sold during the period.', 'hours', 'Tekmetric', 'weekly', 'higher_is_better', false),
  ('Estimate conversion', 'Approved estimate value divided by presented estimate value.', 'percent', 'Tekmetric', 'weekly', 'higher_is_better', false),
  ('Average repair order', 'Finalized sales divided by finalized repair orders.', 'USD', 'Tekmetric', 'weekly', 'higher_is_better', false),
  ('Comeback cost', 'Direct cost of warranty and avoidable comeback work.', 'USD', 'RunTech', 'monthly', 'lower_is_better', true),
  ('Stopped vehicles', 'Vehicles beyond promise date or blocked without an active recovery plan.', 'count', 'RunTech', 'daily', 'lower_is_better', false)
) as m(name, definition, unit, source_system, cadence, direction, is_owner_control)
where c.slug = 'autorx'
on conflict (company_id, name) do nothing;
