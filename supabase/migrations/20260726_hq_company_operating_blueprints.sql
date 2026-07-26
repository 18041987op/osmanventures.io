create table if not exists hq.company_operating_plans (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique references hq.companies(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft','active','paused','completed')),
  strategic_thesis text not null,
  twelve_month_outcome text not null,
  current_constraint text,
  operating_model text,
  review_cadence text not null default 'monthly',
  next_review_date date,
  capital_rule text,
  stop_condition text,
  owner_notes text,
  approved_by uuid references hq.profiles(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists hq.company_milestones (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references hq.companies(id) on delete cascade,
  plan_id uuid not null references hq.company_operating_plans(id) on delete cascade,
  code text not null,
  title text not null,
  outcome text not null,
  position integer not null,
  status text not null default 'not_started' check (status in ('not_started','in_progress','blocked','complete')),
  owner_label text,
  target_date date,
  evidence text,
  blocker text,
  next_action text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id,code)
);

create index if not exists company_milestones_company_position_idx on hq.company_milestones(company_id,position);
create index if not exists company_milestones_status_target_idx on hq.company_milestones(status,target_date);
alter table hq.company_operating_plans enable row level security;
alter table hq.company_milestones enable row level security;
revoke all on hq.company_operating_plans,hq.company_milestones from public,anon,authenticated;
grant all on hq.company_operating_plans,hq.company_milestones to service_role;

insert into hq.company_operating_plans(company_id,status,strategic_thesis,twelve_month_outcome,current_constraint,operating_model,capital_rule,stop_condition)
select c.id,v.status,v.strategic_thesis,v.twelve_month_outcome,v.current_constraint,v.operating_model,v.capital_rule,v.stop_condition
from hq.companies c
join (values
  ('autorx','active','Protect and strengthen the portfolio cash engine while replacing owner-dependent daily management.','AutoRx operates through an accountable General Manager, weekly scorecard, documented controls, and verified owner-absence performance.','Routine operating knowledge, decisions, and relationships remain concentrated in Osman.','General Manager leads department managers; HQ retains banking, capital, debt, executive, and exceptional-risk authority.','AutoRx funds outside ventures only after the approved reserve remains fully protected.','Pause external capital and owner withdrawal if cash, margin, payroll, quality, customer trust, or controls fall outside approved limits.'),
  ('runtech','draft','Turn the software already being built around AutoRx workflows into a dependable operating platform that creates measurable customer value.','RunTech has reliable core modules, disciplined product delivery, verified AutoRx adoption, external pilots, pricing, security controls, and an accountable operator.','Many modules and ideas compete for attention while product ownership, release discipline, adoption evidence, and commercial focus are still forming.','A company operator owns product outcomes through Product & Engineering, Customer Success, Growth, Finance & Operations, and Security & Compliance seats.','Funding is released only by approved milestone and reviewed against adoption, reliability, delivery, and runway.','Pause expansion if milestones repeatedly slip, AutoRx adoption is weak, security controls are inadequate, or continued spending lacks a measurable commercial path.'),
  ('arc-homes','draft','Create durable real-estate value through disciplined entitlement, financing, construction, cost control, and sales execution.','AR-C Homes has a controlled FlatRock operating plan, verified budget and schedule, financing strategy, construction readiness, and accountable project leadership.','The project requires coordinated legal, engineering, permitting, capital, contractor, schedule, and market decisions before full execution.','A company operator coordinates Development, Construction, Finance & Cost Control, Sales & Marketing, and Legal & Permits seats through milestone reporting.','Capital is released against approved project milestones, committed-cost reporting, contingency, and owner review.','Pause new commitments if legal control is unclear, financing is insufficient, costs exceed approved limits, permits stall, or market assumptions no longer support the project.'),
  ('ulua-loans','draft','Build a legally protected, data-driven small-loan operation with disciplined underwriting, collections, liquidity, and borrower treatment.','Ulua Loans completes the legal operating framework, underwriting policy, secured documentation, controlled pilot, portfolio limits, and accountable operator structure.','Legal requirements, enforceable documentation, underwriting standards, collections, liquidity limits, and system controls must be verified before scaling.','A company operator coordinates Underwriting, Collections, Portfolio Risk, Finance & Liquidity, Legal & Compliance, and Customer Operations seats.','Lending capital is limited by approved liquidity reserve, borrower concentration, delinquency, expected loss, and collection capacity.','Stop new originations if legal compliance is uncertain, documentation is unenforceable, delinquency or losses exceed limits, liquidity falls below reserve, or collections cannot be controlled.')
) as v(slug,status,strategic_thesis,twelve_month_outcome,current_constraint,operating_model,capital_rule,stop_condition) on v.slug=c.slug
on conflict(company_id) do nothing;

insert into hq.operator_seats(company_id,title,seat_type,primary_result,authority_summary,current_owner_label,transition_status,appointment_status,mandate,review_cadence,operator_risk_level)
select c.id,v.title,'department_manager',v.primary_result,v.authority_summary,'Osman','not_started','vacant',v.mandate,'monthly',v.risk_level
from hq.companies c
join (values
  ('runtech','Product & Engineering Lead','Reliable, secure product releases deliver the approved roadmap with controlled defects and technical debt.','Own architecture, engineering execution, quality, release process, and technical delivery within approved product and security standards.','Convert business priorities into tested releases and transparent delivery commitments.','high'),
  ('runtech','Customer Success Lead','Users adopt the product, complete critical workflows, receive support, and produce documented value evidence.','Own onboarding, adoption, support, feedback, retention, and customer-outcome reporting.','Turn software delivery into repeated customer usage and measurable outcomes.','high'),
  ('runtech','Growth & Revenue Lead','Qualified demand, pilots, pricing, conversion, and revenue develop within approved positioning and unit economics.','Own go-to-market execution, pipeline, proposals, pricing discipline, and commercial feedback.','Build a repeatable commercial path without promising unsupported capabilities.','high'),
  ('runtech','Finance & Operations Lead','Runway, vendors, contracts, payroll, budgets, and operating reporting remain controlled and current.','Own routine financial operations and company administration within HQ capital and control rules.','Provide financial visibility and operating discipline for every product and commercial commitment.','high'),
  ('runtech','Security & Compliance Lead','Access, data, privacy, incident response, vendors, and release controls meet approved security requirements.','Own security operations and evidence; material risk and exceptions escalate to HQ.','Prevent product growth from outrunning access, privacy, security, and compliance controls.','critical'),
  ('arc-homes','Development & Entitlements Lead','Engineering, zoning, permits, utilities, and pre-development decisions advance to an approved construction-ready state.','Own development coordination and approved submissions while escalating material scope, cost, or legal changes.','Convert land and concept into permitted, buildable milestones.','high'),
  ('arc-homes','Construction Lead','Construction is delivered safely, on schedule, to specification, and within approved commitments.','Own contractor execution, schedule, quality, safety, change control, and field reporting.','Deliver approved construction scope without hidden delay, quality, or cost exposure.','critical'),
  ('arc-homes','Finance & Cost Control Lead','Budget, committed cost, actual cost, forecast, draw, contingency, and cash needs remain accurate.','Own project accounting and cost controls; financing and capital decisions remain owner-controlled.','Make every project commitment visible before it becomes a cash surprise.','critical'),
  ('arc-homes','Sales & Marketing Lead','Market positioning, pricing, lead generation, reservations, contracts, and closing readiness support the approved plan.','Own market execution within approved pricing, legal, and disclosure rules.','Convert completed inventory and future supply into qualified demand and closed sales.','high'),
  ('arc-homes','Legal & Permits Lead','Ownership, agreements, permits, contracts, insurance, and legal conditions remain current and enforceable.','Coordinate counsel and official requirements; no unauthorized legal conclusion may be represented as final.','Ensure the project advances only on verified legal and regulatory footing.','critical'),
  ('ulua-loans','Underwriting Lead','Loans are approved consistently under documented affordability, identity, security, concentration, and risk rules.','Own routine credit decisions within approved limits; exceptions require documented higher approval.','Prevent growth from weakening credit quality or borrower protection.','critical'),
  ('ulua-loans','Collections Lead','Delinquencies receive timely, lawful, documented follow-up and recovery action.','Own collection workflow within approved borrower-treatment, legal, and settlement limits.','Protect portfolio cash while maintaining lawful and consistent borrower treatment.','critical'),
  ('ulua-loans','Portfolio Risk Lead','Delinquency, losses, concentration, vintage performance, fraud, exceptions, and expected cash are monitored.','Own risk reporting and limit enforcement; changing portfolio limits remains owner-controlled.','Detect portfolio deterioration early enough to stop or correct originations.','critical'),
  ('ulua-loans','Finance & Liquidity Lead','Cash, lending capacity, reserve, collections, obligations, and reconciliations remain accurate and controlled.','Own routine treasury preparation and accounting; banking, capital, and reserve policy remain owner-retained.','Prevent lending growth from creating a liquidity or reconciliation failure.','critical'),
  ('ulua-loans','Legal & Compliance Lead','Licensing, contracts, disclosures, guarantees, privacy, collection practices, and records follow verified requirements.','Coordinate Honduran legal counsel and compliance evidence; the system does not replace legal advice.','Keep every product and collection action within the verified legal framework.','critical'),
  ('ulua-loans','Customer Operations Lead','Applications, documents, communications, disbursements, payments, complaints, and records are complete and timely.','Own borrower operations within approved policies, access controls, and escalation rules.','Deliver a controlled borrower experience with complete evidence and accountability.','high')
) as v(slug,title,primary_result,authority_summary,mandate,risk_level) on v.slug=c.slug
where not exists(select 1 from hq.operator_seats s where s.company_id=c.id and s.title=v.title and s.is_active);

insert into hq.company_milestones(company_id,plan_id,code,title,outcome,position,status,next_action)
select c.id,p.id,v.code,v.title,v.outcome,v.position,'not_started',v.next_action
from hq.companies c join hq.company_operating_plans p on p.company_id=c.id
join (values
  ('runtech','RT-01','Product reliability baseline','Define critical workflows, release ownership, test coverage, incident severity, defect limits, and a repeatable release process.',1,'Inventory critical modules and establish release and incident baselines.'),
  ('runtech','RT-02','Verified AutoRx adoption','Identify required AutoRx users and workflows, measure usage, close blocking gaps, and document operational value.',2,'Define the AutoRx adoption scorecard and workflow owners.'),
  ('runtech','RT-03','External pilot readiness','Package a controlled pilot with onboarding, support, data boundaries, success measures, and rollback plan.',3,'Select the smallest supportable pilot scope and entry criteria.'),
  ('runtech','RT-04','Pricing and unit economics','Define pricing, service obligations, implementation effort, payment flow, direct costs, and contribution assumptions.',4,'Build the initial customer-level cost and pricing model.'),
  ('runtech','RT-05','Security and access evidence','Establish privileged access, RLS, backups, incident handling, vendor, privacy, and customer-data controls.',5,'Complete a system and privileged-access inventory.'),
  ('runtech','RT-06','Operator and go-to-market handoff','Install an accountable operator with department ownership, targets, budget, review cadence, and commercial plan.',6,'Use Operator Governance to define the appointment and first review.'),
  ('arc-homes','AR-01','Legal and ownership baseline','Verify entity authority, property control, agreements, decision rights, insurance, and counsel responsibilities.',1,'Assemble the authoritative legal and ownership document index.'),
  ('arc-homes','AR-02','Entitlement and engineering baseline','Create the approved permit, engineering, utilities, site, schedule, dependency, and cost path.',2,'Build the permit and engineering milestone register.'),
  ('arc-homes','AR-03','Capital and financing plan','Define total uses, sources, timing, contingencies, draws, investor reporting, and stop conditions.',3,'Build the sources-and-uses and monthly cash forecast.'),
  ('arc-homes','AR-04','Procurement and contractor controls','Define bidding, scope, insurance, contract, change-order, quality, schedule, payment, and lien controls.',4,'Create the contractor prequalification and change-control standard.'),
  ('arc-homes','AR-05','Construction-start readiness','Confirm permits, financing, drawings, contracts, insurance, schedule, site readiness, and owner authorization.',5,'Create a no-go/go construction readiness checklist.'),
  ('arc-homes','AR-06','Market and sales readiness','Validate product, pricing, demand, marketing, disclosures, contracts, reservations, and closing operations.',6,'Update market assumptions and define the sales launch gate.'),
  ('ulua-loans','UL-01','Verified legal operating framework','Obtain documented Honduran legal conclusions on entity, lending, interest, contracts, guarantees, privacy, collections, notarization, and records.',1,'Create the legal question register for Honduran counsel and track written conclusions.'),
  ('ulua-loans','UL-02','Underwriting and approval policy','Define borrower identity, affordability, documents, security, pricing, exceptions, concentration, and approval levels.',2,'Draft the underwriting matrix and exception authority.'),
  ('ulua-loans','UL-03','Contract and collection framework','Create counsel-approved loan, guarantee, notice, payment, delinquency, settlement, enforcement, and record templates.',3,'Map every borrower and collection document requiring legal approval.'),
  ('ulua-loans','UL-04','Controlled lending system','Implement application, evidence, approvals, disbursement, schedule, payments, delinquency, audit, access, and reporting.',4,'Define the minimum controlled pilot workflow and audit evidence.'),
  ('ulua-loans','UL-05','Liquidity and portfolio limits','Approve cash reserve, maximum exposure, borrower concentration, delinquency, expected loss, and stop-originating thresholds.',5,'Build the pilot liquidity and portfolio risk policy.'),
  ('ulua-loans','UL-06','Controlled pilot decision','Run a limited legally approved pilot, review performance, document failures, and decide whether to continue, correct, or stop.',6,'Define pilot size, entry criteria, monitoring, and exit conditions.')
) as v(slug,code,title,outcome,position,next_action) on v.slug=c.slug
on conflict(company_id,code) do nothing;

create or replace function public.hq_get_company_blueprints(p_user_id uuid)
returns jsonb language plpgsql stable security definer set search_path=hq,public,pg_catalog as $$
declare result jsonb;
begin
  if not hq.is_active_owner(p_user_id) then raise exception 'Active HQ owner access required'; end if;
  select jsonb_build_object(
    'summary',jsonb_build_object(
      'companies',(select count(*) from hq.company_operating_plans),
      'activePlans',(select count(*) from hq.company_operating_plans where status='active'),
      'milestonesComplete',(select count(*) from hq.company_milestones where status='complete'),
      'milestonesBlocked',(select count(*) from hq.company_milestones where status='blocked'),
      'departmentSeats',(select count(*) from hq.operator_seats where seat_type='department_manager' and is_active),
      'departmentSeatsInstalled',(select count(*) from hq.operator_seats where seat_type='department_manager' and is_active and appointment_status in ('probation','active'))
    ),
    'companies',coalesce((select jsonb_agg(jsonb_build_object(
      'id',c.id,'name',c.name,'slug',c.slug,'stage',c.stage,'cashRole',c.cash_role,'description',c.description,'ownerPriority',c.owner_priority,
      'plan',jsonb_build_object('id',p.id,'status',p.status,'strategicThesis',p.strategic_thesis,'twelveMonthOutcome',p.twelve_month_outcome,
        'currentConstraint',p.current_constraint,'operatingModel',p.operating_model,'reviewCadence',p.review_cadence,'nextReviewDate',p.next_review_date,
        'capitalRule',p.capital_rule,'stopCondition',p.stop_condition,'ownerNotes',p.owner_notes,'approvedAt',p.approved_at,'updatedAt',p.updated_at),
      'milestones',coalesce((select jsonb_agg(jsonb_build_object('id',m.id,'code',m.code,'title',m.title,'outcome',m.outcome,'position',m.position,
        'status',m.status,'ownerLabel',m.owner_label,'targetDate',m.target_date,'evidence',m.evidence,'blocker',m.blocker,'nextAction',m.next_action,
        'completedAt',m.completed_at,'updatedAt',m.updated_at) order by m.position) from hq.company_milestones m where m.company_id=c.id),'[]'::jsonb),
      'departmentSeats',coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'title',s.title,'primaryResult',s.primary_result,'mandate',s.mandate,
        'currentOwner',s.current_owner_label,'appointmentStatus',s.appointment_status,'ownerConfidence',s.owner_confidence,
        'nextReviewDate',s.next_review_date,'riskLevel',s.operator_risk_level) order by s.created_at)
        from hq.operator_seats s where s.company_id=c.id and s.seat_type='department_manager' and s.is_active),'[]'::jsonb)
    ) order by case c.cash_role when 'cash_engine' then 0 when 'asset' then 1 else 2 end,c.name)
    from hq.companies c join hq.company_operating_plans p on p.company_id=c.id where c.is_active),'[]'::jsonb)
  ) into result;
  return result;
end $$;

create or replace function public.hq_update_company_plan(p_actor_user_id uuid,p_plan_id uuid,p_status text,p_strategic_thesis text,
  p_twelve_month_outcome text,p_current_constraint text,p_operating_model text,p_review_cadence text,p_next_review_date date,
  p_capital_rule text,p_stop_condition text,p_owner_notes text)
returns jsonb language plpgsql security definer set search_path=hq,public,pg_catalog as $$
declare old_row hq.company_operating_plans%rowtype; new_row hq.company_operating_plans%rowtype;
begin
  if not hq.is_active_owner(p_actor_user_id) then raise exception 'Active HQ owner access required'; end if;
  if p_status not in ('draft','active','paused','completed') then raise exception 'Invalid plan status'; end if;
  if length(trim(p_strategic_thesis))<10 or length(trim(p_twelve_month_outcome))<10 then raise exception 'Strategic thesis and outcome are required'; end if;
  select * into old_row from hq.company_operating_plans where id=p_plan_id for update;
  if old_row.id is null then raise exception 'Company plan not found'; end if;
  update hq.company_operating_plans set status=p_status,strategic_thesis=trim(p_strategic_thesis),twelve_month_outcome=trim(p_twelve_month_outcome),
    current_constraint=nullif(trim(p_current_constraint),''),operating_model=nullif(trim(p_operating_model),''),
    review_cadence=coalesce(nullif(trim(p_review_cadence),''),'monthly'),next_review_date=p_next_review_date,
    capital_rule=nullif(trim(p_capital_rule),''),stop_condition=nullif(trim(p_stop_condition),''),owner_notes=nullif(trim(p_owner_notes),''),
    approved_by=case when p_status='active' then p_actor_user_id else approved_by end,
    approved_at=case when p_status='active' and old_row.status<>'active' then now() else approved_at end,updated_at=now()
  where id=p_plan_id returning * into new_row;
  insert into hq.audit_log(actor_user_id,company_id,action,entity_type,entity_id,old_values,new_values)
  values(p_actor_user_id,new_row.company_id,'update','company_operating_plan',new_row.id::text,to_jsonb(old_row),to_jsonb(new_row));
  return jsonb_build_object('id',new_row.id,'status',new_row.status,'updatedAt',new_row.updated_at);
end $$;

create or replace function public.hq_update_company_milestone(p_actor_user_id uuid,p_milestone_id uuid,p_status text,p_owner_label text,
  p_target_date date,p_evidence text,p_blocker text,p_next_action text)
returns jsonb language plpgsql security definer set search_path=hq,public,pg_catalog as $$
declare old_row hq.company_milestones%rowtype; new_row hq.company_milestones%rowtype;
begin
  if not hq.is_active_owner(p_actor_user_id) then raise exception 'Active HQ owner access required'; end if;
  if p_status not in ('not_started','in_progress','blocked','complete') then raise exception 'Invalid milestone status'; end if;
  select * into old_row from hq.company_milestones where id=p_milestone_id for update;
  if old_row.id is null then raise exception 'Milestone not found'; end if;
  if p_status='complete' and length(trim(coalesce(p_evidence,'')))<5 then raise exception 'Evidence is required to complete a milestone'; end if;
  if p_status='blocked' and length(trim(coalesce(p_blocker,'')))<3 then raise exception 'Describe the blocker'; end if;
  update hq.company_milestones set status=p_status,owner_label=nullif(trim(p_owner_label),''),target_date=p_target_date,
    evidence=nullif(trim(p_evidence),''),blocker=nullif(trim(p_blocker),''),next_action=nullif(trim(p_next_action),''),
    completed_at=case when p_status='complete' then coalesce(completed_at,now()) else null end,updated_at=now()
  where id=p_milestone_id returning * into new_row;
  insert into hq.audit_log(actor_user_id,company_id,action,entity_type,entity_id,old_values,new_values)
  values(p_actor_user_id,new_row.company_id,'update','company_milestone',new_row.id::text,to_jsonb(old_row),to_jsonb(new_row));
  return jsonb_build_object('id',new_row.id,'status',new_row.status,'updatedAt',new_row.updated_at);
end $$;

create or replace function public.hq_update_department_seat(p_actor_user_id uuid,p_seat_id uuid,p_current_owner_label text,
  p_appointment_status text,p_owner_confidence smallint,p_next_review_date date,p_mandate text,p_operator_risk_level text)
returns jsonb language plpgsql security definer set search_path=hq,public,pg_catalog as $$
declare old_row hq.operator_seats%rowtype; new_row hq.operator_seats%rowtype;
begin
  if not hq.is_active_owner(p_actor_user_id) then raise exception 'Active HQ owner access required'; end if;
  if p_appointment_status not in ('vacant','interim','probation','active','replacement_required') then raise exception 'Invalid appointment status'; end if;
  if p_owner_confidence is not null and p_owner_confidence not between 1 and 5 then raise exception 'Owner confidence must be between 1 and 5'; end if;
  if p_operator_risk_level not in ('critical','high','medium','low') then raise exception 'Invalid risk level'; end if;
  select * into old_row from hq.operator_seats where id=p_seat_id and seat_type='department_manager' for update;
  if old_row.id is null then raise exception 'Department seat not found'; end if;
  update hq.operator_seats set current_owner_label=nullif(trim(p_current_owner_label),''),appointment_status=p_appointment_status,
    owner_confidence=p_owner_confidence,next_review_date=p_next_review_date,mandate=nullif(trim(p_mandate),''),operator_risk_level=p_operator_risk_level,
    transition_status=case when p_appointment_status='active' then 'delegated' when p_appointment_status='probation' then 'mapping' else transition_status end,
    updated_at=now() where id=p_seat_id returning * into new_row;
  insert into hq.audit_log(actor_user_id,company_id,action,entity_type,entity_id,old_values,new_values)
  values(p_actor_user_id,new_row.company_id,'update','department_seat',new_row.id::text,to_jsonb(old_row),to_jsonb(new_row));
  return jsonb_build_object('id',new_row.id,'appointmentStatus',new_row.appointment_status,'updatedAt',new_row.updated_at);
end $$;

revoke all on function public.hq_get_company_blueprints(uuid) from public,anon,authenticated;
revoke all on function public.hq_update_company_plan(uuid,uuid,text,text,text,text,text,text,date,text,text,text) from public,anon,authenticated;
revoke all on function public.hq_update_company_milestone(uuid,uuid,text,text,date,text,text,text) from public,anon,authenticated;
revoke all on function public.hq_update_department_seat(uuid,uuid,text,text,smallint,date,text,text) from public,anon,authenticated;
grant execute on function public.hq_get_company_blueprints(uuid) to service_role;
grant execute on function public.hq_update_company_plan(uuid,uuid,text,text,text,text,text,text,date,text,text,text) to service_role;
grant execute on function public.hq_update_company_milestone(uuid,uuid,text,text,date,text,text,text) to service_role;
grant execute on function public.hq_update_department_seat(uuid,uuid,text,text,smallint,date,text,text) to service_role;
