create or replace function public.hq_sync_action_items(p_actor_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=hq,public,pg_catalog
as $$
declare
  autorx_id uuid;
  runtech_id uuid;
  arc_id uuid;
  ulua_id uuid;
  missing_dependency_dates integer;
  missing_milestone_owners integer;
  missing_milestone_dates integer;
  control_gaps integer;
  plans_without_review integer;
  gm_vacant boolean;
  no_absence_progress boolean;
  reserve_incomplete boolean;
  source_status text;
  absence_system_blocker constant text := 'A designated acting operator or General Manager is required before the test can be meaningful.';
begin
  if not hq.is_active_owner(p_actor_user_id) then
    raise exception 'Active HQ owner access required';
  end if;

  select id into autorx_id from hq.companies where slug='autorx' and is_active;
  select id into runtech_id from hq.companies where slug='runtech' and is_active;
  select id into arc_id from hq.companies where slug='arc-homes' and is_active;
  select id into ulua_id from hq.companies where slug='ulua-loans' and is_active;

  select exists(
    select 1 from hq.operator_seats
    where company_id=autorx_id and title='General Manager' and is_active and appointment_status<>'installed'
  ) into gm_vacant;

  select count(*) into missing_dependency_dates
  from hq.dependencies
  where company_id=autorx_id and due_date is null and delegation_status<>'tested';

  select not exists(
    select 1
    from hq.absence_test_runs r
    join hq.absence_test_templates t on t.id=r.template_id
    where t.company_id=autorx_id and r.status in ('scheduled','active','passed')
  ) into no_absence_progress;

  select coalesce((
    select p.status<>'approved' or p.current_cash is null or hq.required_reserve(p)<=0
    from hq.reserve_policies p where p.company_id=autorx_id
  ),true) into reserve_incomplete;

  select count(*) into missing_milestone_owners
  from hq.company_milestones
  where status not in ('complete','cancelled') and nullif(btrim(owner_label),'') is null;

  select count(*) into missing_milestone_dates
  from hq.company_milestones
  where status not in ('complete','cancelled') and target_date is null;

  select count(*) into control_gaps from hq.controls where status='gap';
  select count(*) into plans_without_review
  from hq.company_operating_plans where status<>'paused' and next_review_date is null;

  perform hq.set_system_action(
    reserve_incomplete,'autorx.reserve_policy',autorx_id,
    'Define and approve the AutoRx cash reserve',
    'Enter current cash and the payroll, vendor, tax, debt, rent, emergency, and other buffers. Approve the policy before outside ventures request funding.',
    'capital','critical','reserve_policy',autorx_id::text,'/governance',
    'Approved reserve policy with current cash, required reserve, available capital, approval date, and owner notes.'
  );

  perform hq.set_system_action(
    gm_vacant,'autorx.gm_seat',autorx_id,
    'Install the AutoRx General Manager seat',
    'Complete the executive hiring process in RunTech Hiring, select the operator, approve authority, and activate the 30/60/90 plan.',
    'operator','critical','operator_seat',
    (select id::text from hq.operator_seats where company_id=autorx_id and title='General Manager' and is_active limit 1),
    '/operators','Named GM, accepted mandate, approved authority matrix, start date, and active 30/60/90 plan.'
  );

  perform hq.set_system_action(
    missing_dependency_dates>0,'autorx.dependency_due_dates',autorx_id,
    format('Assign due dates to %s AutoRx dependencies',missing_dependency_dates),
    'Every open dependency already has a next action, but it also needs a committed completion or review date.',
    'transition','high','dependencies',autorx_id::text,'/companies/autorx/transition',
    'Each open dependency has a responsible owner, due date, next action, and required evidence.'
  );

  perform hq.set_system_action(
    no_absence_progress,'autorx.first_absence_test',autorx_id,
    'Schedule the first owner-absence test',
    'Begin with the one-day test after an acting operator is designated. Record every owner contact, intervention, incident, and result.',
    'transition','high','absence_tests',autorx_id::text,'/companies/autorx/transition/absence-tests',
    'Scheduled test with baseline, operator, owner boundaries, test dates, and written pass/fail criteria.',
    'Osman',case when gm_vacant then 'blocked' else 'open' end,
    case when gm_vacant then absence_system_blocker else null end
  );

  if no_absence_progress then
    update hq.action_items set
      status=case when gm_vacant then 'blocked' when status='blocked' and blocker=absence_system_blocker then 'open' else status end,
      blocker=case when gm_vacant then absence_system_blocker when blocker=absence_system_blocker then null else blocker end,
      updated_at=now()
    where system_key='autorx.first_absence_test' and status not in ('done','cancelled');
  end if;

  perform hq.set_system_action(
    missing_milestone_owners>0,'portfolio.milestone_owners',null,
    format('Assign owners to %s company milestones',missing_milestone_owners),
    'RunTech, AR-C Homes, Ulua Loans, and AutoRx milestones need one named accountable owner rather than a general company label.',
    'company_plan','high','company_milestones',null,'/companies',
    'Every active milestone has one accountable owner with authority to produce the stated outcome.'
  );

  perform hq.set_system_action(
    missing_milestone_dates>0,'portfolio.milestone_dates',null,
    format('Set target dates for %s company milestones',missing_milestone_dates),
    'Targets without dates cannot be governed. Add realistic target dates or explicitly pause milestones that are not yet funded.',
    'company_plan','high','company_milestones',null,'/companies',
    'Every active milestone has a target date or is intentionally paused with a reason.'
  );

  perform hq.set_system_action(
    control_gaps>0,'governance.control_gaps',null,
    format('Assign and schedule %s governance control gaps',control_gaps),
    'Convert each control gap into an active control with a frequency, next due date, evidence requirement, and accountable owner.',
    'governance','high','controls',null,'/governance',
    'Each control is active or intentionally paused, with next due date and evidence expectations.'
  );

  perform hq.set_system_action(
    plans_without_review>0,'portfolio.plan_review_dates',null,
    format('Set review dates for %s operating plans',plans_without_review),
    'Every company plan needs a recurring owner review date even while the company remains in draft stage.',
    'company_plan','medium','company_operating_plans',null,'/companies',
    'Each active or draft operating plan has a next review date and review cadence.'
  );

  perform hq.set_system_action(
    exists(select 1 from hq.company_operating_plans where company_id=runtech_id and status='draft'),
    'runtech.review_draft_plan',runtech_id,'Review the RunTech operating blueprint',
    'Confirm the twelve-month outcome, current constraint, milestones, departmental seats, capital rules, and conditions for stopping investment.',
    'company_plan','medium','company_operating_plan',runtech_id::text,'/companies',
    'Owner decision records whether the plan becomes active, remains draft, or is paused.'
  );

  perform hq.set_system_action(
    exists(select 1 from hq.company_operating_plans where company_id=arc_id and status='draft'),
    'arc_homes.review_draft_plan',arc_id,'Review the AR-C Homes operating blueprint',
    'Confirm FlatRock View milestones, entitlements, cost control, construction leadership, financing limits, and review cadence.',
    'company_plan','medium','company_operating_plan',arc_id::text,'/companies',
    'Owner decision records whether the plan becomes active, remains draft, or is paused.'
  );

  perform hq.set_system_action(
    exists(select 1 from hq.company_operating_plans where company_id=ulua_id and status='draft'),
    'ulua_loans.review_draft_plan',ulua_id,'Review the Ulua Loans operating blueprint',
    'Keep the plan in draft until legal, underwriting, collections, liquidity, and consumer-protection requirements are verified for Honduras.',
    'company_plan','medium','company_operating_plan',ulua_id::text,'/companies',
    'Documented owner decision plus verified legal and operating prerequisites before activation.'
  );

  select status into source_status from hq.data_sources where source_key='tekmetric_operations';
  perform hq.set_system_action(
    coalesce(source_status,'not_ready')<>'ready','data.tekmetric_operations',autorx_id,
    'Connect a verified Tekmetric operating feed',
    'Automate sales, sold hours, ARO, estimate conversion, stopped vehicles, comeback cost, and other shop-operating metrics from a verified source.',
    'data','high','data_source','tekmetric_operations','/scorecard-automation',
    'Verified data coverage, freshness rules, row counts, reconciliation checks, and automated metric results.'
  );

  select status into source_status from hq.data_sources where source_key='service_advisor';
  perform hq.set_system_action(
    coalesce(source_status,'not_ready')<>'ready','data.service_advisor',autorx_id,
    'Connect service-advisor performance data',
    'Create verified coverage for advisor sales, conversion, declined-work follow-up, communication, and customer outcomes.',
    'data','medium','data_source','service_advisor','/scorecard-automation',
    'Verified advisor-level source with defined period coverage and reconciliation checks.'
  );

  select status into source_status from hq.data_sources where source_key='parts_leakage';
  perform hq.set_system_action(
    coalesce(source_status,'not_ready')<>'ready','data.parts_leakage',autorx_id,
    'Connect parts leakage and reconciliation data',
    'Reconcile purchases, usage, returns, credits, pickup dates, and refunds so parts leakage becomes measurable.',
    'data','medium','data_source','parts_leakage','/scorecard-automation',
    'Verified purchase-to-usage-to-return reconciliation with unresolved exception reporting.'
  );

  select status into source_status from hq.data_sources where source_key='phone_calls';
  perform hq.set_system_action(
    coalesce(source_status,'not_ready')='partial','data.phone_history',autorx_id,
    'Mature phone-call data coverage',
    'Keep collecting connected phone data until the coverage window is long enough for reliable missed-call and answer-rate trends.',
    'data','low','data_source','phone_calls','/scorecard-automation',
    'At least four complete weeks of verified call history with stable status mapping and reconciliation.'
  );

  return jsonb_build_object(
    'open',(select count(*) from hq.action_items where status in ('open','in_progress','blocked')),
    'systemOpen',(select count(*) from hq.action_items where system_key is not null and status in ('open','in_progress','blocked')),
    'systemResolved',(select count(*) from hq.action_items where system_key is not null and status='done')
  );
end;
$$;

revoke all on function public.hq_sync_action_items(uuid) from public,anon,authenticated;
grant execute on function public.hq_sync_action_items(uuid) to service_role;

select public.hq_sync_action_items(id)
from hq.profiles
where role='owner' and is_active
order by created_at
limit 1;
