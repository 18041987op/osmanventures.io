-- AutoRx GM transition operating layer for Osman Ventures HQ.
-- Applied to Supabase B. The hq schema remains server-only.

alter table hq.operator_seats
  add column if not exists current_owner_label text,
  add column if not exists transition_status text not null default 'not_started'
    check (transition_status in ('not_started','mapping','documented','delegated','tested'));

alter table hq.dependencies
  add column if not exists risk_level text not null default 'medium'
    check (risk_level in ('critical','high','medium')),
  add column if not exists target_owner_label text;

create unique index if not exists hq_operator_seats_company_title_uidx
  on hq.operator_seats(company_id, title);
create unique index if not exists hq_dependencies_company_title_uidx
  on hq.dependencies(company_id, title);

create table if not exists hq.transition_gates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references hq.companies(id) on delete cascade,
  code text not null,
  title text not null,
  outcome text not null,
  position smallint not null,
  status text not null default 'not_started'
    check (status in ('not_started','in_progress','complete')),
  evidence text,
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, code),
  unique (company_id, position)
);

create trigger transition_gates_updated_at
before update on hq.transition_gates
for each row execute function hq.set_updated_at();

alter table hq.transition_gates enable row level security;
revoke all on hq.transition_gates from public, anon, authenticated;
grant all on hq.transition_gates to service_role;

insert into hq.operator_seats (
  company_id, title, seat_type, primary_result, authority_summary,
  current_owner_label, transition_status, approval_limits
)
select c.id, v.title, v.seat_type, v.primary_result, v.authority_summary,
       v.current_owner_label, v.transition_status, v.approval_limits::jsonb
from hq.companies c
cross join (values
  ('General Manager','company_operator','The whole company meets its financial and operating commitments.','Own daily operations, people, production, service, customer experience, and budget execution within written limits.','Osman','mapping','{"banking":"owner_only","capital_transfers":"owner_only","debt":"owner_only","executive_hiring":"owner_approval","routine_operations":"manager"}'),
  ('Service Manager','department_manager','Demand becomes profitable authorized work with clear communication.','Own service-advisor execution, estimate follow-up, customer communication, and front-office standards.','Shared / Osman escalation','not_started','{}'),
  ('Shop Foreman / Production Manager','department_manager','Correct work is completed on time with controlled quality and productivity.','Own dispatch, production flow, quality control, technician accountability, and promised completion.','Shared operational leadership','not_started','{}'),
  ('Administrative and Finance Coordinator','finance','Money, payroll, vendor credits, records, and obligations remain accurate and controlled.','Prepare payroll and reconciliations, control records, monitor vendor credits, and escalate variances.','Osman / administrative team','not_started','{}'),
  ('People and Training Lead','department_manager','Every required seat has a capable person who meets standards and develops.','Coordinate recruiting, onboarding, training completion, policy records, and performance follow-up.','Osman','not_started','{}')
) as v(title, seat_type, primary_result, authority_summary, current_owner_label, transition_status, approval_limits)
where c.slug = 'autorx'
on conflict (company_id, title) do update set
  seat_type = excluded.seat_type,
  primary_result = excluded.primary_result,
  authority_summary = excluded.authority_summary,
  current_owner_label = excluded.current_owner_label,
  transition_status = excluded.transition_status,
  approval_limits = excluded.approval_limits,
  updated_at = now();

insert into hq.transition_gates (company_id, code, title, outcome, position, status)
select c.id, v.code, v.title, v.outcome, v.position, v.status
from hq.companies c
cross join (values
  ('define','Define','The GM seat, scorecard, authority, and compensation are approved.',1,'in_progress'),
  ('document','Document','Critical owner-dependent processes have verified instructions and controls.',2,'not_started'),
  ('install','Install','A selected operator controls the daily rhythm and department leaders.',3,'not_started'),
  ('transfer','Transfer','Osman stops normal operating decisions and reviews results weekly.',4,'not_started'),
  ('test','Test','AutoRx completes a 30-day absence test without material deterioration.',5,'not_started')
) as v(code, title, outcome, position, status)
where c.slug = 'autorx'
on conflict (company_id, code) do update set
  title = excluded.title,
  outcome = excluded.outcome,
  position = excluded.position,
  updated_at = now();

insert into hq.dependencies (
  company_id, dependency_type, title, documentation_status,
  delegation_status, risk_level, target_owner_label, risk_if_absent, next_action
)
select c.id, v.dependency_type, v.title, v.documentation_status,
       v.delegation_status, v.risk_level, v.target_owner_label,
       v.risk_if_absent, v.next_action
from hq.companies c
cross join (values
  ('approval','Final payroll review and release','missing','not_started','critical','GM + finance control','Payroll errors, unauthorized changes, or cash loss.','Document preparation, verification, approval, and release controls.'),
  ('decision','Warranty, refund, and goodwill exceptions','draft','not_started','high','GM within written limits','Uncontrolled commitments, margin loss, and inconsistent customer treatment.','Define dollar limits, evidence requirements, and owner escalation rules.'),
  ('system_access','Banking, payment, and owner-level system access','missing','not_started','critical','Owner retained; controlled operational access','Fraud exposure or inability to complete critical payments safely.','Create an access matrix and dual-control process without sharing owner credentials.'),
  ('relationship','Critical vendor and warranty-company escalations','missing','not_started','high','General Manager','Delays, unrecovered credits, denied claims, or damaged relationships.','List contacts, escalation paths, open issues, and expected response standards.'),
  ('knowledge','Weekly financial diagnosis and cash-protection decisions','draft','not_started','critical','GM + owner review','The company may appear busy while margin and cash deteriorate.','Build a weekly financial review using verified Tekmetric, payroll, and QuickBooks data.'),
  ('execution','Employee discipline, hiring, and termination process','missing','not_started','high','GM within policy','Legal, morale, staffing, and consistency risk.','Create written steps, approval limits, documentation standards, and escalation triggers.'),
  ('decision','Daily prioritization when production, parts, and promises conflict','missing','not_started','high','GM + production leader','Missed promises, idle technicians, customer escalation, and margin loss.','Define the daily production meeting and escalation hierarchy.'),
  ('approval','Transfers from AutoRx into other ventures','verified','not_started','critical','Owner retained','AutoRx liquidity can be weakened by uncontrolled portfolio funding.','Create the reserve policy and capital-request workflow before any transfer.')
) as v(dependency_type, title, documentation_status, delegation_status, risk_level, target_owner_label, risk_if_absent, next_action)
where c.slug = 'autorx'
on conflict (company_id, title) do update set
  dependency_type = excluded.dependency_type,
  documentation_status = excluded.documentation_status,
  delegation_status = excluded.delegation_status,
  risk_level = excluded.risk_level,
  target_owner_label = excluded.target_owner_label,
  risk_if_absent = excluded.risk_if_absent,
  next_action = excluded.next_action,
  updated_at = now();

create or replace function hq.is_active_owner(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = hq, pg_catalog
as $$
  select exists (
    select 1 from hq.profiles
    where id = p_user_id and role = 'owner' and is_active = true
  );
$$;

create or replace function public.hq_get_executive_dashboard(p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = hq, public, pg_catalog
as $$
declare result jsonb;
begin
  if not hq.is_active_owner(p_user_id) then
    raise exception 'Active HQ owner access required';
  end if;

  select jsonb_build_object(
    'companies', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', c.id, 'name', c.name, 'slug', c.slug,
        'stage', c.stage::text, 'cashRole', c.cash_role,
        'description', c.description, 'ownerPriority', c.owner_priority,
        'isActive', c.is_active
      ) order by c.created_at)
      from hq.companies c where c.is_active = true
    ), '[]'::jsonb),
    'summary', jsonb_build_object(
      'cashEngines', (select count(*) from hq.companies where is_active and cash_role = 'cash_engine'),
      'operatorsInstalled', (select count(*) from hq.operator_seats where is_active and seat_type = 'company_operator' and incumbent_user_id is not null),
      'companiesGoverned', (select count(*) from hq.companies where is_active),
      'openCriticalDependencies', (
        select count(*) from hq.dependencies d join hq.companies c on c.id = d.company_id
        where c.slug = 'autorx' and d.risk_level = 'critical' and d.delegation_status <> 'tested'
      )
    ),
    'autorx', jsonb_build_object(
      'readiness', coalesce((
        select round(sum(case status when 'complete' then 20 when 'in_progress' then 10 else 0 end))::int
        from hq.transition_gates g join hq.companies c on c.id = g.company_id
        where c.slug = 'autorx'
      ), 0),
      'gatesComplete', (select count(*) from hq.transition_gates g join hq.companies c on c.id = g.company_id where c.slug = 'autorx' and g.status = 'complete'),
      'gatesTotal', (select count(*) from hq.transition_gates g join hq.companies c on c.id = g.company_id where c.slug = 'autorx'),
      'dependenciesTotal', (select count(*) from hq.dependencies d join hq.companies c on c.id = d.company_id where c.slug = 'autorx'),
      'dependenciesStarted', (select count(*) from hq.dependencies d join hq.companies c on c.id = d.company_id where c.slug = 'autorx' and (d.documentation_status <> 'missing' or d.delegation_status <> 'not_started')),
      'metricsDefined', (select count(*) from hq.metrics m join hq.companies c on c.id = m.company_id where c.slug = 'autorx' and m.is_active)
    )
  ) into result;
  return result;
end;
$$;

create or replace function public.hq_get_autorx_transition(p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = hq, public, pg_catalog
as $$
declare autorx_id uuid; result jsonb;
begin
  if not hq.is_active_owner(p_user_id) then
    raise exception 'Active HQ owner access required';
  end if;
  select id into autorx_id from hq.companies where slug = 'autorx' and is_active = true;
  if autorx_id is null then raise exception 'AutoRx company record not found'; end if;

  select jsonb_build_object(
    'company', (select to_jsonb(c) from hq.companies c where c.id = autorx_id),
    'gmSeat', (
      select jsonb_build_object(
        'id', s.id, 'title', s.title, 'primaryResult', s.primary_result,
        'authoritySummary', s.authority_summary, 'approvalLimits', s.approval_limits,
        'currentOwner', s.current_owner_label, 'transitionStatus', s.transition_status,
        'incumbentUserId', s.incumbent_user_id
      ) from hq.operator_seats s
      where s.company_id = autorx_id and s.seat_type = 'company_operator' and s.is_active
      order by s.created_at limit 1
    ),
    'departmentSeats', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id, 'title', s.title, 'seatType', s.seat_type,
        'primaryResult', s.primary_result, 'authoritySummary', s.authority_summary,
        'currentOwner', s.current_owner_label, 'transitionStatus', s.transition_status,
        'incumbentUserId', s.incumbent_user_id
      ) order by case s.seat_type when 'company_operator' then 0 when 'department_manager' then 1 else 2 end, s.created_at)
      from hq.operator_seats s where s.company_id = autorx_id and s.is_active
    ), '[]'::jsonb),
    'gates', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', g.id, 'code', g.code, 'title', g.title, 'outcome', g.outcome,
        'position', g.position, 'status', g.status, 'evidence', g.evidence,
        'dueDate', g.due_date, 'completedAt', g.completed_at
      ) order by g.position)
      from hq.transition_gates g where g.company_id = autorx_id
    ), '[]'::jsonb),
    'dependencies', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', d.id, 'type', d.dependency_type, 'title', d.title,
        'documentationStatus', d.documentation_status,
        'delegationStatus', d.delegation_status, 'riskLevel', d.risk_level,
        'targetOwner', d.target_owner_label, 'riskIfAbsent', d.risk_if_absent,
        'nextAction', d.next_action, 'dueDate', d.due_date,
        'updatedAt', d.updated_at
      ) order by case d.risk_level when 'critical' then 0 when 'high' then 1 else 2 end, d.created_at)
      from hq.dependencies d where d.company_id = autorx_id
    ), '[]'::jsonb),
    'metrics', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', m.id, 'name', m.name, 'definition', m.definition,
        'unit', m.unit, 'sourceSystem', m.source_system,
        'cadence', m.cadence, 'direction', m.direction,
        'isOwnerControl', m.is_owner_control
      ) order by m.created_at)
      from hq.metrics m where m.company_id = autorx_id and m.is_active
    ), '[]'::jsonb)
  ) into result;
  return result;
end;
$$;

create or replace function public.hq_create_autorx_dependency(
  p_actor_user_id uuid, p_dependency_type text, p_title text,
  p_risk_level text, p_target_owner_label text, p_risk_if_absent text,
  p_next_action text, p_due_date date default null
)
returns jsonb
language plpgsql
security definer
set search_path = hq, public, pg_catalog
as $$
declare autorx_id uuid; new_row hq.dependencies%rowtype;
begin
  if not hq.is_active_owner(p_actor_user_id) then raise exception 'Active HQ owner access required'; end if;
  if p_dependency_type not in ('decision','approval','relationship','knowledge','system_access','execution') then raise exception 'Invalid dependency type'; end if;
  if p_risk_level not in ('critical','high','medium') then raise exception 'Invalid risk level'; end if;
  if length(trim(p_title)) < 4 then raise exception 'Dependency title is required'; end if;
  select id into autorx_id from hq.companies where slug = 'autorx' and is_active = true;

  insert into hq.dependencies (
    company_id, dependency_type, title, risk_level, target_owner_label,
    risk_if_absent, next_action, due_date
  ) values (
    autorx_id, p_dependency_type, trim(p_title), p_risk_level,
    nullif(trim(p_target_owner_label),''), nullif(trim(p_risk_if_absent),''),
    nullif(trim(p_next_action),''), p_due_date
  ) returning * into new_row;

  insert into hq.audit_log (actor_user_id, company_id, action, entity_type, entity_id, new_values)
  values (p_actor_user_id, autorx_id, 'create', 'dependency', new_row.id::text, to_jsonb(new_row));
  return jsonb_build_object('id', new_row.id, 'title', new_row.title);
end;
$$;

create or replace function public.hq_update_autorx_dependency(
  p_actor_user_id uuid, p_dependency_id uuid,
  p_documentation_status text, p_delegation_status text,
  p_next_action text, p_due_date date default null
)
returns jsonb
language plpgsql
security definer
set search_path = hq, public, pg_catalog
as $$
declare old_row hq.dependencies%rowtype; new_row hq.dependencies%rowtype;
begin
  if not hq.is_active_owner(p_actor_user_id) then raise exception 'Active HQ owner access required'; end if;
  if p_documentation_status not in ('missing','draft','verified') then raise exception 'Invalid documentation status'; end if;
  if p_delegation_status not in ('not_started','training','delegated','tested') then raise exception 'Invalid delegation status'; end if;

  select d.* into old_row from hq.dependencies d
  join hq.companies c on c.id = d.company_id
  where d.id = p_dependency_id and c.slug = 'autorx';
  if old_row.id is null then raise exception 'Dependency not found'; end if;

  update hq.dependencies set
    documentation_status = p_documentation_status,
    delegation_status = p_delegation_status,
    next_action = nullif(trim(p_next_action),''),
    due_date = p_due_date,
    updated_at = now()
  where id = p_dependency_id returning * into new_row;

  insert into hq.audit_log (actor_user_id, company_id, action, entity_type, entity_id, old_values, new_values)
  values (p_actor_user_id, new_row.company_id, 'update', 'dependency', new_row.id::text, to_jsonb(old_row), to_jsonb(new_row));
  return jsonb_build_object('id', new_row.id, 'updatedAt', new_row.updated_at);
end;
$$;

revoke all on function public.hq_get_executive_dashboard(uuid) from public, anon, authenticated;
revoke all on function public.hq_get_autorx_transition(uuid) from public, anon, authenticated;
revoke all on function public.hq_create_autorx_dependency(uuid,text,text,text,text,text,text,date) from public, anon, authenticated;
revoke all on function public.hq_update_autorx_dependency(uuid,uuid,text,text,text,date) from public, anon, authenticated;
grant execute on function public.hq_get_executive_dashboard(uuid) to service_role;
grant execute on function public.hq_get_autorx_transition(uuid) to service_role;
grant execute on function public.hq_create_autorx_dependency(uuid,text,text,text,text,text,text,date) to service_role;
grant execute on function public.hq_update_autorx_dependency(uuid,uuid,text,text,text,date) to service_role;
