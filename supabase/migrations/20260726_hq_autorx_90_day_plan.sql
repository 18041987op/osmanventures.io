create table if not exists hq.transition_plans (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references hq.companies(id) on delete cascade,
  seat_id uuid not null references hq.operator_seats(id) on delete cascade,
  title text not null,
  status text not null default 'draft' check (status in ('draft','active','paused','completed')),
  operator_user_id uuid references hq.profiles(id),
  start_date date,
  approved_by uuid references hq.profiles(id),
  approved_at timestamptz,
  created_by uuid references hq.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, seat_id, title)
);

create table if not exists hq.transition_plan_milestones (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references hq.transition_plans(id) on delete cascade,
  phase smallint not null check (phase in (30,60,90)),
  category text not null check (category in ('leadership','financial','operations','people','customer','controls','owner_independence')),
  objective text not null,
  success_measure text not null,
  owner_role text not null default 'General Manager',
  due_date date,
  status text not null default 'not_started' check (status in ('not_started','in_progress','blocked','complete')),
  evidence text,
  notes text,
  position smallint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (plan_id, phase, position)
);

create trigger transition_plans_updated_at
before update on hq.transition_plans
for each row execute function hq.set_updated_at();

create trigger transition_plan_milestones_updated_at
before update on hq.transition_plan_milestones
for each row execute function hq.set_updated_at();

alter table hq.transition_plans enable row level security;
alter table hq.transition_plan_milestones enable row level security;

revoke all on hq.transition_plans from public, anon, authenticated;
revoke all on hq.transition_plan_milestones from public, anon, authenticated;
grant all on hq.transition_plans to service_role;
grant all on hq.transition_plan_milestones to service_role;

with owner_profile as (
  select id from hq.profiles where role = 'owner' and is_active = true order by created_at limit 1
), autorx as (
  select id from hq.companies where slug = 'autorx'
), gm as (
  select s.id, s.company_id
  from hq.operator_seats s
  join autorx a on a.id = s.company_id
  where s.title = 'General Manager'
  order by s.created_at
  limit 1
)
insert into hq.transition_plans (company_id, seat_id, title, status, created_by)
select gm.company_id, gm.id, 'AutoRx General Manager 30/60/90 Plan', 'draft', owner_profile.id
from gm cross join owner_profile
on conflict (company_id, seat_id, title) do nothing;

with plan as (
  select p.id
  from hq.transition_plans p
  join hq.companies c on c.id = p.company_id
  where c.slug = 'autorx' and p.title = 'AutoRx General Manager 30/60/90 Plan'
  limit 1
), milestones(phase,category,objective,success_measure,owner_role,position) as (
  values
  (30,'leadership','Take control of the daily operating rhythm','Run daily opening, production, customer-escalation, and closing rhythms for 20 consecutive business days with documented follow-up.','General Manager',1),
  (30,'financial','Learn and protect the AutoRx cash engine','Explain weekly sales, gross profit, payroll percentage, cash position, and major variances accurately during four owner reviews.','General Manager',2),
  (30,'people','Assess every management and critical operating seat','Complete written capability, accountability, and risk assessments for service, production, administration, parts, and training leadership.','General Manager',3),
  (30,'customer','Stabilize customer communication and escalation handling','All critical customer issues have an owner, response deadline, documented resolution, and no unresolved escalation older than two business days.','General Manager',4),
  (60,'operations','Own the Weekly Business Review','Submit four consecutive complete weekly reviews with accurate metrics, explanations, corrective actions, and commitments.','General Manager',1),
  (60,'leadership','Install department accountability','Each department seat has a named accountable leader, weekly commitments, and documented follow-up on misses.','General Manager',2),
  (60,'controls','Operate warranty, refund, payroll, and vendor controls within policy','No unauthorized refund, payroll change, capital transfer, or material vendor commitment; exceptions are escalated before commitment.','General Manager',3),
  (60,'owner_independence','Reduce routine Osman escalations','At least 80% of normal operating decisions are resolved within the written authority matrix without owner intervention.','General Manager',4),
  (90,'financial','Operate to an approved budget and cash-protection plan','Present a 13-week operating forecast and keep spending, payroll, and cash commitments within approved limits.','General Manager',1),
  (90,'owner_independence','Pass a seven-day owner absence test','AutoRx operates for seven consecutive days without routine Osman decisions and without material deterioration in cash, customer trust, production, or controls.','General Manager',2),
  (90,'people','Present the final organization and talent plan','Deliver recommendations for retain, develop, replace, recruit, and succession actions for every critical seat.','General Manager',3),
  (90,'leadership','Present the next-quarter operating plan','Owner approves the next-quarter priorities, scorecard targets, risks, capital needs, and stop conditions.','General Manager',4)
)
insert into hq.transition_plan_milestones (plan_id,phase,category,objective,success_measure,owner_role,position)
select plan.id,m.phase,m.category,m.objective,m.success_measure,m.owner_role,m.position
from plan cross join milestones m
on conflict (plan_id,phase,position) do update set
  category = excluded.category,
  objective = excluded.objective,
  success_measure = excluded.success_measure,
  owner_role = excluded.owner_role;

create or replace function public.hq_get_autorx_90_day_plan(p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = hq, public, pg_catalog
as $$
declare
  result jsonb;
begin
  if not exists (
    select 1 from hq.profiles
    where id = p_user_id and is_active = true and role in ('owner','group_executive')
  ) then
    raise exception 'HQ access denied';
  end if;

  select jsonb_build_object(
    'plan', jsonb_build_object(
      'id', p.id,
      'title', p.title,
      'status', p.status,
      'startDate', p.start_date,
      'operatorUserId', p.operator_user_id,
      'approvedAt', p.approved_at,
      'updatedAt', p.updated_at
    ),
    'summary', jsonb_build_object(
      'total', count(m.id),
      'complete', count(m.id) filter (where m.status = 'complete'),
      'inProgress', count(m.id) filter (where m.status = 'in_progress'),
      'blocked', count(m.id) filter (where m.status = 'blocked'),
      'readiness', case when count(m.id) = 0 then 0 else round((count(m.id) filter (where m.status = 'complete'))::numeric * 100 / count(m.id)) end
    ),
    'milestones', coalesce(jsonb_agg(
      jsonb_build_object(
        'id', m.id,
        'phase', m.phase,
        'category', m.category,
        'objective', m.objective,
        'successMeasure', m.success_measure,
        'ownerRole', m.owner_role,
        'dueDate', m.due_date,
        'status', m.status,
        'evidence', m.evidence,
        'notes', m.notes,
        'position', m.position,
        'updatedAt', m.updated_at
      ) order by m.phase,m.position
    ) filter (where m.id is not null), '[]'::jsonb)
  ) into result
  from hq.transition_plans p
  join hq.companies c on c.id = p.company_id and c.slug = 'autorx'
  left join hq.transition_plan_milestones m on m.plan_id = p.id
  where p.title = 'AutoRx General Manager 30/60/90 Plan'
  group by p.id;

  return result;
end;
$$;

create or replace function public.hq_activate_autorx_90_day_plan(
  p_user_id uuid,
  p_start_date date,
  p_status text default 'active'
)
returns jsonb
language plpgsql
security definer
set search_path = hq, public, pg_catalog
as $$
declare
  plan_id uuid;
  old_values jsonb;
begin
  if not exists (
    select 1 from hq.profiles where id = p_user_id and is_active = true and role = 'owner'
  ) then
    raise exception 'Owner access required';
  end if;

  if p_start_date is null or p_status not in ('draft','active','paused','completed') then
    raise exception 'Invalid plan activation data';
  end if;

  select p.id, to_jsonb(p) into plan_id, old_values
  from hq.transition_plans p
  join hq.companies c on c.id = p.company_id and c.slug = 'autorx'
  where p.title = 'AutoRx General Manager 30/60/90 Plan'
  limit 1;

  update hq.transition_plans
  set start_date = p_start_date,
      status = p_status,
      approved_by = case when p_status = 'active' then p_user_id else approved_by end,
      approved_at = case when p_status = 'active' then now() else approved_at end
  where id = plan_id;

  update hq.transition_plan_milestones
  set due_date = p_start_date + phase
  where transition_plan_milestones.plan_id = plan_id;

  insert into hq.audit_log(actor_user_id,company_id,action,entity_type,entity_id,old_values,new_values)
  select p_user_id,p.company_id,'update_90_day_plan','transition_plan',p.id,old_values,to_jsonb(p)
  from hq.transition_plans p where p.id = plan_id;

  return public.hq_get_autorx_90_day_plan(p_user_id);
end;
$$;

create or replace function public.hq_update_autorx_90_day_milestone(
  p_user_id uuid,
  p_milestone_id uuid,
  p_status text,
  p_evidence text default null,
  p_notes text default null,
  p_due_date date default null
)
returns jsonb
language plpgsql
security definer
set search_path = hq, public, pg_catalog
as $$
declare
  old_values jsonb;
  company_id_value uuid;
begin
  if not exists (
    select 1 from hq.profiles where id = p_user_id and is_active = true and role = 'owner'
  ) then
    raise exception 'Owner access required';
  end if;

  if p_status not in ('not_started','in_progress','blocked','complete') then
    raise exception 'Invalid milestone status';
  end if;

  select to_jsonb(m), p.company_id into old_values, company_id_value
  from hq.transition_plan_milestones m
  join hq.transition_plans p on p.id = m.plan_id
  join hq.companies c on c.id = p.company_id and c.slug = 'autorx'
  where m.id = p_milestone_id;

  if old_values is null then
    raise exception 'Milestone not found';
  end if;

  update hq.transition_plan_milestones
  set status = p_status,
      evidence = nullif(trim(coalesce(p_evidence,'')),''),
      notes = nullif(trim(coalesce(p_notes,'')),''),
      due_date = p_due_date
  where id = p_milestone_id;

  insert into hq.audit_log(actor_user_id,company_id,action,entity_type,entity_id,old_values,new_values)
  select p_user_id,company_id_value,'update_90_day_milestone','transition_plan_milestone',m.id,old_values,to_jsonb(m)
  from hq.transition_plan_milestones m where m.id = p_milestone_id;

  return public.hq_get_autorx_90_day_plan(p_user_id);
end;
$$;

revoke all on function public.hq_get_autorx_90_day_plan(uuid) from public, anon, authenticated;
revoke all on function public.hq_activate_autorx_90_day_plan(uuid,date,text) from public, anon, authenticated;
revoke all on function public.hq_update_autorx_90_day_milestone(uuid,uuid,text,text,text,date) from public, anon, authenticated;
grant execute on function public.hq_get_autorx_90_day_plan(uuid) to service_role;
grant execute on function public.hq_activate_autorx_90_day_plan(uuid,date,text) to service_role;
grant execute on function public.hq_update_autorx_90_day_milestone(uuid,uuid,text,text,text,date) to service_role;
