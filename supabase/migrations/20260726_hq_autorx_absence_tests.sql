-- AutoRx owner absence tests: templates, test attempts, evidence/events, and owner decisions.

create table hq.absence_test_templates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references hq.companies(id) on delete cascade,
  duration_days integer not null check (duration_days in (1,3,7,14,30)),
  title text not null,
  objective text not null,
  owner_rules jsonb not null default '[]'::jsonb,
  pass_criteria jsonb not null default '[]'::jsonb,
  fail_conditions jsonb not null default '[]'::jsonb,
  required_evidence jsonb not null default '[]'::jsonb,
  position integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, duration_days)
);

create table hq.absence_test_runs (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references hq.absence_test_templates(id) on delete restrict,
  operator_user_id uuid references hq.profiles(id),
  status text not null default 'scheduled' check (status in ('scheduled','active','passed','failed','cancelled')),
  planned_start date not null,
  planned_end date not null,
  actual_start date,
  actual_end date,
  baseline_metrics jsonb not null default '{}'::jsonb,
  outcome_metrics jsonb not null default '{}'::jsonb,
  owner_interventions integer not null default 0 check (owner_interventions >= 0),
  emergency_interventions integer not null default 0 check (emergency_interventions >= 0),
  summary text,
  decision text,
  created_by uuid not null references hq.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (planned_end >= planned_start),
  check (actual_end is null or actual_start is not null),
  check (actual_end is null or actual_end >= actual_start)
);

create table hq.absence_test_events (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references hq.absence_test_runs(id) on delete cascade,
  event_kind text not null check (event_kind in ('owner_contact','owner_intervention','emergency_intervention','critical_incident','operating_exception','evidence')),
  severity text not null default 'low' check (severity in ('low','medium','high','critical')),
  title text not null,
  details text,
  business_impact text,
  resolution text,
  caused_failure boolean not null default false,
  reported_by uuid not null references hq.profiles(id),
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index absence_test_runs_template_created_idx on hq.absence_test_runs(template_id, created_at desc);
create index absence_test_runs_status_dates_idx on hq.absence_test_runs(status, planned_start, planned_end);
create index absence_test_events_run_occurred_idx on hq.absence_test_events(run_id, occurred_at desc);

create trigger absence_test_templates_updated_at before update on hq.absence_test_templates for each row execute function hq.set_updated_at();
create trigger absence_test_runs_updated_at before update on hq.absence_test_runs for each row execute function hq.set_updated_at();

alter table hq.absence_test_templates enable row level security;
alter table hq.absence_test_runs enable row level security;
alter table hq.absence_test_events enable row level security;

revoke all on hq.absence_test_templates, hq.absence_test_runs, hq.absence_test_events from public, anon, authenticated;
grant all on hq.absence_test_templates, hq.absence_test_runs, hq.absence_test_events to service_role;

insert into hq.absence_test_templates (
  company_id, duration_days, title, objective, owner_rules, pass_criteria, fail_conditions, required_evidence, position
)
select c.id, v.duration_days, v.title, v.objective, v.owner_rules::jsonb, v.pass_criteria::jsonb,
       v.fail_conditions::jsonb, v.required_evidence::jsonb, v.position
from hq.companies c
cross join (values
  (1, 'One operating day',
   'Prove that AutoRx can open, operate, resolve routine issues, and close for one full business day without Osman making normal operating decisions.',
   '["Osman does not approve routine work, scheduling, discounts, staffing moves, vendor orders, or customer resolutions.","The GM may contact Osman only for a defined emergency, legal exposure, bank-security event, or owner-retained decision.","Every attempted contact and intervention must be logged."]',
   '["The daily production plan is established and managed without owner direction.","Customer escalations and staffing issues are resolved within written authority.","Cash handling, closing controls, and unresolved work are documented.","No avoidable owner intervention is required."]',
   '["Operations stop because no one can make a routine decision.","An owner-retained control is bypassed.","A material customer, safety, payroll, cash, or compliance issue is hidden or left unmanaged."]',
   '["Opening and closing checklist","Daily production summary","Escalation log","End-of-day financial and unresolved-work report"]', 1),
  (3, 'Three consecutive operating days',
   'Prove that management can maintain priorities, communication, production flow, vendors, and customer recovery across multiple consecutive days.',
   '["Osman receives only the agreed end-of-day summary and emergency notifications.","The team cannot delay decisions merely to wait for Osman.","All exceptions are recorded with the manager decision and outcome."]',
   '["Promises, parts constraints, staffing, and production priorities are actively managed for three days.","Daily scorecard and cash-protection controls are completed each day.","Customer escalations do not accumulate without owners and deadlines.","The operating rhythm continues without avoidable owner intervention."]',
   '["Repeated escalation of routine decisions to Osman.","Uncontrolled backlog, missed promises, or cash exposure caused by management inaction.","Required reports or controls are skipped for any test day."]',
   '["Three daily operating reports","Customer and vendor exception log","Production and stopped-vehicle trend","Owner-contact log"]', 2),
  (7, 'Seven-day management cycle',
   'Prove that the GM can run a complete weekly operating cycle, including the Weekly Business Review, without normal owner intervention.',
   '["Osman reviews submitted results but does not direct daily execution.","Owner-only approvals remain available through the documented request process.","The GM owns all routine communication and follow-up during the test."]',
   '["A complete Weekly Business Review is submitted with targets, actuals, variances, and actions.","Payroll preparation, staffing, production, customer, vendor, and quality controls continue on schedule.","Critical issues have owners, deadlines, and documented decisions.","No material deterioration occurs in cash, margin, quality, customer trust, or employee control."]',
   '["The weekly review cannot be completed without Osman reconstructing the business.","Payroll, cash, customer, legal, safety, or quality controls fail.","The GM repeatedly waits for owner direction on routine matters."]',
   '["Submitted Weekly Business Review","Seven-day intervention log","Metric comparison to baseline","List of decisions made under delegated authority"]', 3),
  (14, 'Fourteen-day continuity test',
   'Prove that AutoRx can sustain two full management cycles, recover from problems, and maintain financial and people controls without owner dependence.',
   '["Osman participates only in scheduled owner reviews and true owner-retained decisions.","The GM must correct first-week misses without owner-designed solutions.","Every material risk and corrective action is documented."]',
   '["Two weekly reviews are completed and the second shows corrective follow-through.","Vendor credits, payroll, staffing, comebacks, customer escalations, and production constraints remain controlled.","The GM demonstrates delegation through department leaders rather than personally absorbing every task.","No hidden liability or unresolved critical issue accumulates."]',
   '["The same material issue repeats without corrective action.","Controls weaken after the first week.","Osman must resume routine management to protect the business."]',
   '["Two Weekly Business Reviews","Corrective-action closure report","Department-leader accountability record","Financial and risk comparison to baseline"]', 4),
  (30, 'Thirty-day owner-independence test',
   'Demonstrate that AutoRx can complete a full monthly management cycle with Osman acting as owner and reviewer rather than daily operator.',
   '["Osman attends only scheduled owner reviews and handles explicitly retained authority.","The GM owns operating results, people, corrective actions, and reporting for the full period.","Any owner intervention is classified as avoidable, emergency, or owner-retained."]',
   '["Four complete weekly reviews and a month-end operating summary are delivered.","Cash flow, margin, payroll, quality, customer trust, staffing, and compliance remain within approved limits or have effective corrective plans.","Department leaders operate through defined seats and scorecards.","The business does not materially deteriorate and normal decisions do not depend on Osman."]',
   '["Osman must return to daily management to prevent material loss or control failure.","Required reporting is inaccurate, late, or incomplete.","A significant issue is concealed, owner controls are bypassed, or cash-engine protection is compromised."]',
   '["Four Weekly Business Reviews","Month-end financial and operating summary","Complete intervention and incident log","Department scorecards","Owner decision confirming pass, retry, or leadership change"]', 5)
) as v(duration_days,title,objective,owner_rules,pass_criteria,fail_conditions,required_evidence,position)
where c.slug = 'autorx'
on conflict (company_id, duration_days) do update set
  title = excluded.title,
  objective = excluded.objective,
  owner_rules = excluded.owner_rules,
  pass_criteria = excluded.pass_criteria,
  fail_conditions = excluded.fail_conditions,
  required_evidence = excluded.required_evidence,
  position = excluded.position,
  updated_at = now();

create or replace function public.hq_get_autorx_absence_tests(p_user_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = hq, public, pg_catalog
as $$
with authorized as (
  select exists (
    select 1 from hq.profiles
    where id = p_user_id and role = 'owner' and is_active = true
  ) as ok
), template_rows as (
  select t.*,
    (
      select jsonb_build_object(
        'id', r.id,
        'status', r.status,
        'plannedStart', r.planned_start,
        'plannedEnd', r.planned_end,
        'actualStart', r.actual_start,
        'actualEnd', r.actual_end,
        'operatorUserId', r.operator_user_id,
        'ownerInterventions', r.owner_interventions,
        'emergencyInterventions', r.emergency_interventions,
        'baselineMetrics', r.baseline_metrics,
        'outcomeMetrics', r.outcome_metrics,
        'summary', r.summary,
        'decision', r.decision,
        'createdAt', r.created_at,
        'updatedAt', r.updated_at,
        'events', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', e.id,
            'eventKind', e.event_kind,
            'severity', e.severity,
            'title', e.title,
            'details', e.details,
            'businessImpact', e.business_impact,
            'resolution', e.resolution,
            'causedFailure', e.caused_failure,
            'occurredAt', e.occurred_at
          ) order by e.occurred_at desc)
          from hq.absence_test_events e where e.run_id = r.id
        ), '[]'::jsonb)
      )
      from hq.absence_test_runs r
      where r.template_id = t.id
      order by r.created_at desc
      limit 1
    ) as latest_run
  from hq.absence_test_templates t
  join hq.companies c on c.id = t.company_id
  where c.slug = 'autorx' and t.is_active = true
), payload as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', id,
    'durationDays', duration_days,
    'title', title,
    'objective', objective,
    'ownerRules', owner_rules,
    'passCriteria', pass_criteria,
    'failConditions', fail_conditions,
    'requiredEvidence', required_evidence,
    'position', position,
    'latestRun', latest_run
  ) order by position), '[]'::jsonb) as tests
  from template_rows
), stats as (
  select
    count(*)::int as total,
    count(*) filter (where latest_run->>'status' = 'passed')::int as passed,
    count(*) filter (where latest_run->>'status' = 'active')::int as active,
    count(*) filter (where latest_run->>'status' = 'scheduled')::int as scheduled,
    count(*) filter (where latest_run->>'status' = 'failed')::int as failed
  from template_rows
)
select case when (select ok from authorized) then jsonb_build_object(
  'summary', jsonb_build_object(
    'total', stats.total,
    'passed', stats.passed,
    'active', stats.active,
    'scheduled', stats.scheduled,
    'failed', stats.failed,
    'readiness', case when stats.total = 0 then 0 else round((stats.passed::numeric / stats.total::numeric) * 100)::int end
  ),
  'tests', payload.tests
) else null end
from payload cross join stats;
$$;

create or replace function public.hq_schedule_autorx_absence_test(
  p_actor_user_id uuid,
  p_template_id uuid,
  p_start_date date,
  p_operator_user_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = hq, public, pg_catalog
as $$
declare
  v_template hq.absence_test_templates%rowtype;
  v_run hq.absence_test_runs%rowtype;
  v_end_date date;
begin
  if not exists (select 1 from hq.profiles where id=p_actor_user_id and role='owner' and is_active=true) then
    raise exception 'Owner access required';
  end if;
  if p_start_date < current_date then raise exception 'Start date cannot be in the past'; end if;

  select t.* into v_template
  from hq.absence_test_templates t join hq.companies c on c.id=t.company_id
  where t.id=p_template_id and c.slug='autorx' and t.is_active=true;
  if not found then raise exception 'Absence test template not found'; end if;

  v_end_date := p_start_date + (v_template.duration_days - 1);

  if exists (
    select 1 from hq.absence_test_runs r
    join hq.absence_test_templates t on t.id=r.template_id
    where t.company_id=v_template.company_id
      and r.status in ('scheduled','active')
      and daterange(r.planned_start, r.planned_end, '[]') && daterange(p_start_date, v_end_date, '[]')
  ) then raise exception 'Another absence test overlaps this date range'; end if;

  insert into hq.absence_test_runs(template_id,operator_user_id,status,planned_start,planned_end,created_by)
  values(p_template_id,p_operator_user_id,'scheduled',p_start_date,v_end_date,p_actor_user_id)
  returning * into v_run;

  insert into hq.audit_log(actor_user_id,company_id,action,entity_type,entity_id,new_values)
  values(p_actor_user_id,v_template.company_id,'schedule_absence_test','absence_test_run',v_run.id::text,
    jsonb_build_object('duration_days',v_template.duration_days,'planned_start',p_start_date,'planned_end',v_end_date));

  return jsonb_build_object('id',v_run.id,'status',v_run.status,'plannedStart',v_run.planned_start,'plannedEnd',v_run.planned_end);
end;
$$;

create or replace function public.hq_update_autorx_absence_test_run(
  p_actor_user_id uuid,
  p_run_id uuid,
  p_status text,
  p_summary text default null,
  p_decision text default null,
  p_baseline_metrics jsonb default null,
  p_outcome_metrics jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = hq, public, pg_catalog
as $$
declare
  v_run hq.absence_test_runs%rowtype;
  v_template hq.absence_test_templates%rowtype;
  v_old jsonb;
begin
  if not exists (select 1 from hq.profiles where id=p_actor_user_id and role='owner' and is_active=true) then
    raise exception 'Owner access required';
  end if;
  if p_status not in ('active','passed','failed','cancelled') then raise exception 'Invalid test status'; end if;

  select * into v_run from hq.absence_test_runs where id=p_run_id for update;
  if not found then raise exception 'Absence test run not found'; end if;
  select * into v_template from hq.absence_test_templates where id=v_run.template_id;
  v_old := to_jsonb(v_run);

  if p_status='active' and v_run.status <> 'scheduled' then raise exception 'Only a scheduled test can be started'; end if;
  if p_status in ('passed','failed') and v_run.status <> 'active' then raise exception 'Only an active test can be completed'; end if;
  if p_status='cancelled' and v_run.status not in ('scheduled','active') then raise exception 'Only scheduled or active tests can be cancelled'; end if;
  if p_status in ('passed','failed') and length(trim(coalesce(p_decision,''))) < 3 then raise exception 'A completion decision is required'; end if;

  update hq.absence_test_runs set
    status=p_status,
    actual_start=case when p_status='active' then coalesce(actual_start,current_date) else actual_start end,
    actual_end=case when p_status in ('passed','failed','cancelled') then current_date else actual_end end,
    summary=coalesce(nullif(trim(p_summary),''),summary),
    decision=coalesce(nullif(trim(p_decision),''),decision),
    baseline_metrics=coalesce(p_baseline_metrics,baseline_metrics),
    outcome_metrics=coalesce(p_outcome_metrics,outcome_metrics)
  where id=p_run_id returning * into v_run;

  if p_status='passed' and v_template.duration_days=30 then
    update hq.transition_gates
    set status='complete', completed_at=now(), evidence='Passed the 30-day owner-independence test: ' || v_run.id::text
    where company_id=v_template.company_id and code='test';
  end if;

  insert into hq.audit_log(actor_user_id,company_id,action,entity_type,entity_id,old_values,new_values)
  values(p_actor_user_id,v_template.company_id,'update_absence_test','absence_test_run',p_run_id::text,v_old,to_jsonb(v_run));

  return jsonb_build_object('id',v_run.id,'status',v_run.status,'actualStart',v_run.actual_start,'actualEnd',v_run.actual_end,'summary',v_run.summary,'decision',v_run.decision);
end;
$$;

create or replace function public.hq_add_autorx_absence_test_event(
  p_actor_user_id uuid,
  p_run_id uuid,
  p_event_kind text,
  p_severity text,
  p_title text,
  p_details text default null,
  p_business_impact text default null,
  p_resolution text default null,
  p_caused_failure boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = hq, public, pg_catalog
as $$
declare
  v_run hq.absence_test_runs%rowtype;
  v_template hq.absence_test_templates%rowtype;
  v_event hq.absence_test_events%rowtype;
begin
  if not exists (select 1 from hq.profiles where id=p_actor_user_id and role='owner' and is_active=true) then
    raise exception 'Owner access required';
  end if;
  if p_event_kind not in ('owner_contact','owner_intervention','emergency_intervention','critical_incident','operating_exception','evidence') then raise exception 'Invalid event type'; end if;
  if p_severity not in ('low','medium','high','critical') then raise exception 'Invalid severity'; end if;
  if length(trim(coalesce(p_title,''))) < 3 then raise exception 'Event title is required'; end if;

  select * into v_run from hq.absence_test_runs where id=p_run_id for update;
  if not found then raise exception 'Absence test run not found'; end if;
  if v_run.status <> 'active' then raise exception 'Events can only be recorded during an active test'; end if;
  select * into v_template from hq.absence_test_templates where id=v_run.template_id;

  insert into hq.absence_test_events(run_id,event_kind,severity,title,details,business_impact,resolution,caused_failure,reported_by)
  values(p_run_id,p_event_kind,p_severity,trim(p_title),nullif(trim(p_details),''),nullif(trim(p_business_impact),''),nullif(trim(p_resolution),''),p_caused_failure,p_actor_user_id)
  returning * into v_event;

  update hq.absence_test_runs set
    owner_interventions=owner_interventions + case when p_event_kind='owner_intervention' then 1 else 0 end,
    emergency_interventions=emergency_interventions + case when p_event_kind='emergency_intervention' then 1 else 0 end
  where id=p_run_id;

  insert into hq.audit_log(actor_user_id,company_id,action,entity_type,entity_id,new_values)
  values(p_actor_user_id,v_template.company_id,'add_absence_test_event','absence_test_event',v_event.id::text,to_jsonb(v_event));

  return jsonb_build_object('id',v_event.id,'eventKind',v_event.event_kind,'severity',v_event.severity,'title',v_event.title,'occurredAt',v_event.occurred_at);
end;
$$;

revoke all on function public.hq_get_autorx_absence_tests(uuid) from public,anon,authenticated;
revoke all on function public.hq_schedule_autorx_absence_test(uuid,uuid,date,uuid) from public,anon,authenticated;
revoke all on function public.hq_update_autorx_absence_test_run(uuid,uuid,text,text,text,jsonb,jsonb) from public,anon,authenticated;
revoke all on function public.hq_add_autorx_absence_test_event(uuid,uuid,text,text,text,text,text,text,boolean) from public,anon,authenticated;
grant execute on function public.hq_get_autorx_absence_tests(uuid) to service_role;
grant execute on function public.hq_schedule_autorx_absence_test(uuid,uuid,date,uuid) to service_role;
grant execute on function public.hq_update_autorx_absence_test_run(uuid,uuid,text,text,text,jsonb,jsonb) to service_role;
grant execute on function public.hq_add_autorx_absence_test_event(uuid,uuid,text,text,text,text,text,text,boolean) to service_role;
