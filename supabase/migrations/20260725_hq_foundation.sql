create extension if not exists pgcrypto;

create type public.hq_role as enum (
  'owner',
  'group_executive',
  'company_operator',
  'department_manager',
  'finance_reviewer',
  'auditor'
);

create type public.hq_company_stage as enum (
  'project',
  'operating_unit',
  'managed_company',
  'scalable_company',
  'paused',
  'closed'
);

create type public.hq_metric_status as enum ('on_track', 'watch', 'off_track', 'not_reported');
create type public.hq_review_status as enum ('draft', 'submitted', 'reviewed', 'closed');
create type public.hq_decision_status as enum ('proposed', 'approved', 'rejected', 'implemented', 'reviewed');
create type public.hq_risk_status as enum ('open', 'mitigating', 'accepted', 'closed');

create table public.hq_companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  stage public.hq_company_stage not null default 'project',
  cash_role text not null check (cash_role in ('cash_engine', 'investment', 'asset')),
  legal_name text,
  description text,
  owner_priority text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.hq_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text,
  role public.hq_role not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.hq_company_access (
  user_id uuid not null references public.hq_profiles(id) on delete cascade,
  company_id uuid not null references public.hq_companies(id) on delete cascade,
  role public.hq_role not null,
  created_at timestamptz not null default now(),
  primary key (user_id, company_id)
);

create table public.hq_operator_seats (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.hq_companies(id) on delete cascade,
  title text not null,
  seat_type text not null check (seat_type in ('company_operator', 'department_manager', 'finance', 'other')),
  incumbent_user_id uuid references public.hq_profiles(id),
  reports_to_seat_id uuid references public.hq_operator_seats(id),
  primary_result text not null,
  authority_summary text,
  approval_limits jsonb not null default '{}'::jsonb,
  scorecard_weighting jsonb not null default '{}'::jsonb,
  succession_user_id uuid references public.hq_profiles(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.hq_metrics (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.hq_companies(id) on delete cascade,
  owner_seat_id uuid references public.hq_operator_seats(id),
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

create table public.hq_metric_results (
  id uuid primary key default gen_random_uuid(),
  metric_id uuid not null references public.hq_metrics(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  target numeric,
  actual numeric,
  status public.hq_metric_status not null default 'not_reported',
  variance_explanation text,
  corrective_action text,
  action_owner_user_id uuid references public.hq_profiles(id),
  action_due_date date,
  source_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (metric_id, period_start, period_end)
);

create table public.hq_weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.hq_companies(id) on delete cascade,
  operator_user_id uuid not null references public.hq_profiles(id),
  week_start date not null,
  status public.hq_review_status not null default 'draft',
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

create table public.hq_capital_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.hq_companies(id) on delete cascade,
  requested_by uuid not null references public.hq_profiles(id),
  amount numeric(14,2) not null check (amount > 0),
  purpose text not null,
  expected_result text not null,
  milestone text not null,
  review_date date not null,
  stop_condition text not null,
  status text not null default 'requested' check (status in ('requested', 'approved', 'rejected', 'funded', 'under_review', 'continued', 'paused', 'cancelled')),
  approved_by uuid references public.hq_profiles(id),
  approved_amount numeric(14,2),
  funded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.hq_decisions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.hq_companies(id) on delete cascade,
  title text not null,
  context text not null,
  options jsonb not null default '[]'::jsonb,
  assumptions jsonb not null default '[]'::jsonb,
  decision text,
  owner_user_id uuid not null references public.hq_profiles(id),
  status public.hq_decision_status not null default 'proposed',
  expected_result text,
  review_date date,
  actual_result text,
  lessons text,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.hq_risks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.hq_companies(id) on delete cascade,
  title text not null,
  category text not null,
  probability smallint not null check (probability between 1 and 5),
  impact smallint not null check (impact between 1 and 5),
  owner_user_id uuid references public.hq_profiles(id),
  mitigation_plan text,
  next_review_date date,
  status public.hq_risk_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.hq_dependencies (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.hq_companies(id) on delete cascade,
  dependency_type text not null check (dependency_type in ('decision', 'approval', 'relationship', 'knowledge', 'system_access', 'execution')),
  title text not null,
  current_owner_user_id uuid references public.hq_profiles(id),
  target_owner_seat_id uuid references public.hq_operator_seats(id),
  documentation_status text not null default 'missing' check (documentation_status in ('missing', 'draft', 'verified')),
  delegation_status text not null default 'not_started' check (delegation_status in ('not_started', 'training', 'delegated', 'tested')),
  risk_if_absent text,
  next_action text,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.hq_audit_log (
  id bigint generated always as identity primary key,
  actor_user_id uuid references public.hq_profiles(id),
  company_id uuid references public.hq_companies(id),
  action text not null,
  entity_type text not null,
  entity_id text,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz not null default now()
);

alter table public.hq_companies enable row level security;
alter table public.hq_profiles enable row level security;
alter table public.hq_company_access enable row level security;
alter table public.hq_operator_seats enable row level security;
alter table public.hq_metrics enable row level security;
alter table public.hq_metric_results enable row level security;
alter table public.hq_weekly_reviews enable row level security;
alter table public.hq_capital_requests enable row level security;
alter table public.hq_decisions enable row level security;
alter table public.hq_risks enable row level security;
alter table public.hq_dependencies enable row level security;
alter table public.hq_audit_log enable row level security;

-- Policies are intentionally omitted from this first migration.
-- Do not apply this schema to production until invite-only authentication,
-- role resolution, and company-scoped RLS policies are implemented and reviewed.
