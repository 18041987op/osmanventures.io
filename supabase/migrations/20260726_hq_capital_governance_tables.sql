create table if not exists hq.reserve_policies (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique references hq.companies(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft','approved','paused')),
  currency text not null default 'USD',
  current_cash numeric(14,2),
  payroll_buffer numeric(14,2) not null default 0 check (payroll_buffer >= 0),
  vendor_buffer numeric(14,2) not null default 0 check (vendor_buffer >= 0),
  tax_buffer numeric(14,2) not null default 0 check (tax_buffer >= 0),
  debt_and_rent_buffer numeric(14,2) not null default 0 check (debt_and_rent_buffer >= 0),
  emergency_buffer numeric(14,2) not null default 0 check (emergency_buffer >= 0),
  other_buffer numeric(14,2) not null default 0 check (other_buffer >= 0),
  notes text,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists hq.reserve_snapshots (
  id uuid primary key default gen_random_uuid(),
  policy_id uuid not null references hq.reserve_policies(id) on delete cascade,
  company_id uuid not null references hq.companies(id) on delete cascade,
  snapshot_date date not null default current_date,
  current_cash numeric(14,2),
  required_reserve numeric(14,2) not null,
  available_capital numeric(14,2),
  source_note text,
  recorded_by uuid,
  created_at timestamptz not null default now()
);

alter table hq.capital_requests
  add column if not exists funding_company_id uuid references hq.companies(id),
  add column if not exists title text,
  add column if not exists request_type text not null default 'investment',
  add column if not exists priority text not null default 'normal',
  add column if not exists eligibility_status text not null default 'not_evaluated',
  add column if not exists reserve_required_at_decision numeric(14,2),
  add column if not exists cash_after numeric(14,2),
  add column if not exists owner_notes text,
  add column if not exists approved_at timestamptz,
  add column if not exists rejected_at timestamptz,
  add column if not exists closed_at timestamptz,
  add column if not exists decision_id uuid references hq.decisions(id);

alter table hq.decisions
  add column if not exists decision_type text not null default 'operating',
  add column if not exists priority text not null default 'normal',
  add column if not exists due_date date,
  add column if not exists linked_entity_type text,
  add column if not exists linked_entity_id text;

alter table hq.risks
  add column if not exists description text,
  add column if not exists trigger_condition text,
  add column if not exists owner_label text,
  add column if not exists residual_probability smallint,
  add column if not exists residual_impact smallint,
  add column if not exists last_reviewed_at timestamptz;

create table if not exists hq.controls (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references hq.companies(id) on delete cascade,
  title text not null,
  category text not null,
  objective text not null,
  frequency text not null default 'monthly',
  owner_label text,
  evidence_required text,
  status text not null default 'gap' check (status in ('active','gap','paused','retired')),
  is_owner_retained boolean not null default false,
  last_completed_at timestamptz,
  next_due_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reserve_snapshots_company_date_idx on hq.reserve_snapshots(company_id, snapshot_date desc);
create index if not exists capital_requests_status_idx on hq.capital_requests(status, review_date);
create index if not exists decisions_status_review_idx on hq.decisions(status, review_date);
create index if not exists risks_status_review_idx on hq.risks(status, next_review_date);
create index if not exists controls_status_due_idx on hq.controls(status, next_due_date);

alter table hq.reserve_policies enable row level security;
alter table hq.reserve_snapshots enable row level security;
alter table hq.controls enable row level security;

revoke all on hq.reserve_policies, hq.reserve_snapshots, hq.controls from public, anon, authenticated;
grant all on hq.reserve_policies, hq.reserve_snapshots, hq.controls to service_role;

insert into hq.reserve_policies (company_id, status, notes)
select id, 'draft', 'Enter verified cash and reserve components before approving this policy.'
from hq.companies where slug='autorx'
on conflict (company_id) do nothing;

insert into hq.controls (company_id, title, category, objective, frequency, owner_label, evidence_required, status, is_owner_retained)
select c.id, v.title, v.category, v.objective, v.frequency, v.owner_label, v.evidence_required, 'gap', v.is_owner_retained
from hq.companies c
cross join (values
  ('Bank access and payment authority','financial','Only approved people can initiate, approve, release, and reconcile payments.','monthly','Owner','Bank user list, approval limits, and reconciliation evidence',true),
  ('Payroll approval and release','financial','Payroll changes and final release require documented review and separation of duties.','weekly','Owner / Finance reviewer','Payroll register, adjustments, approval, and release confirmation',true),
  ('Refund, warranty, and comeback approval','customer_risk','Material refunds and warranty commitments follow written approval limits.','weekly','General Manager','Exception log and manager approval evidence',false),
  ('Capital transfer approval','capital','No AutoRx cash leaves the company without reserve validation and owner approval.','per_event','Owner','Approved capital request and post-transfer reserve calculation',true),
  ('Executive hiring and termination','people','Company operators and executives are hired or terminated only with owner approval.','per_event','Owner','Decision record and approved employment terms',true),
  ('Month-end financial review','financial','Close each month with verified P&L, balance sheet, cash, liabilities, and unusual transactions.','monthly','Owner / Finance reviewer','Month-end review package and signed exceptions',true),
  ('User and system access review','security','Remove unnecessary access and verify privileged accounts across critical systems.','quarterly','Owner / System administrator','Access list and remediation record',true),
  ('Vendor credit and refund reconciliation','financial','Expected vendor credits and refunds are tracked until received and reconciled.','weekly','Office / Parts manager','Open return report and matched credit evidence',false)
) as v(title,category,objective,frequency,owner_label,evidence_required,is_owner_retained)
where c.slug='autorx'
  and not exists (select 1 from hq.controls x where x.company_id=c.id and x.title=v.title);

insert into hq.risks (company_id,title,category,probability,impact,description,mitigation_plan,next_review_date,status,owner_label)
select c.id, v.title, v.category, v.probability, v.impact, v.description, v.mitigation, current_date + 30, 'open'::hq.risk_status, v.owner_label
from hq.companies c
cross join (values
  ('AutoRx funds outside projects before a reserve is approved','capital',4::smallint,5::smallint,'Cash extraction could weaken the only current portfolio cash engine.','Approve the reserve policy and require every transfer to pass the post-transfer reserve test.','Owner'),
  ('AutoRx depends on Osman for routine management','leadership',5::smallint,5::smallint,'Routine decisions, relationships, and controls remain concentrated in the owner.','Complete dependency transfer, install the GM, and pass the owner-absence test ladder.','Owner / General Manager'),
  ('Banking or payment authority is too broad','financial_control',3::smallint,5::smallint,'A single person could prepare, approve, release, and conceal a transaction.','Implement dual control, monthly access review, and independent reconciliation.','Owner'),
  ('RunTech receives capital without milestone discipline','portfolio',4::smallint,4::smallint,'Ongoing development spending may continue without measurable delivery or stop conditions.','Require capital requests with milestones, review dates, expected results, and stop conditions.','Owner / RunTech operator'),
  ('AR-C Homes project costs exceed approved capital','project',3::smallint,4::smallint,'Construction or pre-development commitments may exceed the approved budget.','Use milestone funding, committed-cost reporting, contingency limits, and owner approval for changes.','Owner / Project operator')
) as v(title,category,probability,impact,description,mitigation,owner_label)
where c.slug='autorx'
  and not exists (select 1 from hq.risks r where r.company_id=c.id and r.title=v.title);

create or replace function hq.required_reserve(p hq.reserve_policies)
returns numeric
language sql
immutable
set search_path=hq,pg_catalog
as $$
  select coalesce(p.payroll_buffer,0)+coalesce(p.vendor_buffer,0)+coalesce(p.tax_buffer,0)+coalesce(p.debt_and_rent_buffer,0)+coalesce(p.emergency_buffer,0)+coalesce(p.other_buffer,0)
$$;
