alter table hq.operator_seats
  add column if not exists mandate text,
  add column if not exists appointment_status text not null default 'vacant',
  add column if not exists appointed_at date,
  add column if not exists review_cadence text not null default 'monthly',
  add column if not exists next_review_date date,
  add column if not exists owner_confidence smallint,
  add column if not exists hiring_job_reference text,
  add column if not exists hiring_candidate_reference text,
  add column if not exists operator_risk_level text not null default 'high';

do $$ begin
  if not exists (select 1 from pg_constraint where conname='operator_seats_appointment_status_check' and connamespace='hq'::regnamespace) then
    alter table hq.operator_seats add constraint operator_seats_appointment_status_check check (appointment_status in ('vacant','interim','probation','active','replacement_required'));
  end if;
  if not exists (select 1 from pg_constraint where conname='operator_seats_owner_confidence_check' and connamespace='hq'::regnamespace) then
    alter table hq.operator_seats add constraint operator_seats_owner_confidence_check check (owner_confidence is null or owner_confidence between 1 and 5);
  end if;
  if not exists (select 1 from pg_constraint where conname='operator_seats_risk_level_check' and connamespace='hq'::regnamespace) then
    alter table hq.operator_seats add constraint operator_seats_risk_level_check check (operator_risk_level in ('critical','high','medium','low'));
  end if;
end $$;

create table if not exists hq.operator_authority_rules (
  id uuid primary key default gen_random_uuid(),
  seat_id uuid not null references hq.operator_seats(id) on delete cascade,
  category text not null,
  authority_level text not null check (authority_level in ('operator','owner_approval','owner_retained')),
  limit_text text not null,
  conditions text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(seat_id,category)
);

create table if not exists hq.operator_reviews (
  id uuid primary key default gen_random_uuid(),
  seat_id uuid not null references hq.operator_seats(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  status text not null default 'draft' check (status in ('draft','submitted','reviewed','closed')),
  performance_score smallint check (performance_score is null or performance_score between 1 and 5),
  owner_confidence smallint check (owner_confidence is null or owner_confidence between 1 and 5),
  result_summary text,
  wins jsonb not null default '[]'::jsonb,
  misses jsonb not null default '[]'::jsonb,
  corrective_actions jsonb not null default '[]'::jsonb,
  commitments jsonb not null default '[]'::jsonb,
  owner_decision text not null default 'pending' check (owner_decision in ('pending','continue','correct','replace')),
  next_review_date date,
  reviewed_by uuid references hq.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(seat_id,period_start,period_end)
);

create index if not exists operator_authority_rules_seat_idx on hq.operator_authority_rules(seat_id,position);
create index if not exists operator_reviews_seat_period_idx on hq.operator_reviews(seat_id,period_end desc);

alter table hq.operator_authority_rules enable row level security;
alter table hq.operator_reviews enable row level security;
revoke all on hq.operator_authority_rules,hq.operator_reviews from public,anon,authenticated;
grant all on hq.operator_authority_rules,hq.operator_reviews to service_role;

insert into hq.operator_seats (
  company_id,title,seat_type,primary_result,authority_summary,current_owner_label,
  transition_status,appointment_status,mandate,review_cadence,operator_risk_level
)
select c.id,c.name || ' Company Operator','company_operator',
       case c.slug
         when 'runtech' then 'Convert RunTech product investment into a reliable, market-ready operating company with disciplined delivery, adoption, and cash use.'
         when 'arc-homes' then 'Deliver approved real-estate milestones, budgets, permits, construction, sales, and investor reporting without uncontrolled commitments.'
         when 'ulua-loans' then 'Operate lending within approved legal, underwriting, collection, liquidity, and portfolio-risk limits.'
         else 'Produce the approved company results within budget, authority, risk, and reporting requirements.'
       end,
       'The operator owns routine execution and reports outcomes; portfolio capital, banking, debt, equity, executive appointments, and exceptional legal commitments remain owner-controlled.',
       'Osman','mapping','vacant',
       case c.slug
         when 'runtech' then 'Own product delivery, customer value, adoption, security, operating discipline, and approved runway.'
         when 'arc-homes' then 'Own schedule, budget, project controls, contractor accountability, approvals, and milestone reporting.'
         when 'ulua-loans' then 'Own compliant underwriting, collections, portfolio quality, liquidity, reporting, and controlled growth.'
         else 'Own routine operations and measurable results while preserving owner-retained controls.'
       end,
       'monthly',
       case c.slug when 'runtech' then 'high' when 'arc-homes' then 'high' when 'ulua-loans' then 'critical' else 'high' end
from hq.companies c
where c.slug in ('runtech','arc-homes','ulua-loans')
  and not exists (select 1 from hq.operator_seats s where s.company_id=c.id and s.seat_type='company_operator' and s.is_active);

update hq.operator_seats s
set mandate=coalesce(s.mandate,'Own routine company execution, people, reporting, corrective action, and results within the approved authority matrix.'),
    appointment_status=case when s.incumbent_user_id is not null then 'active' else 'vacant' end,
    review_cadence=coalesce(nullif(s.review_cadence,''),'monthly'),
    operator_risk_level=coalesce(nullif(s.operator_risk_level,''),'high'),
    updated_at=now()
where s.seat_type='company_operator';

insert into hq.operator_authority_rules(seat_id,category,authority_level,limit_text,conditions,position)
select s.id,v.category,v.authority_level,v.limit_text,v.conditions,v.position
from hq.operator_seats s
cross join (values
  ('routine_operations','operator','May make normal operating decisions within the approved plan, budget, policies, and documented limits.','Must report material exceptions in the weekly review.',1),
  ('pricing_and_vendors','operator','May select routine vendors and execute normal pricing decisions within approved margin and purchasing rules.','No related-party, unusual, long-term, or above-budget commitments.',2),
  ('non_executive_people','owner_approval','May recommend and manage non-executive staffing; compensation or headcount outside the approved plan requires owner approval.','RunTech Hiring remains the recruiting system of record.',3),
  ('payroll_changes','owner_approval','Payroll structure, rates, bonuses, commissions, and exceptional payments require documented approval.','Routine approved payroll preparation may be delegated; final release follows the control register.',4),
  ('banking_and_payments','owner_retained','Bank accounts, payment authority, signers, wires, and access policy remain owner-retained.','Operators may prepare requests but cannot bypass dual control.',5),
  ('capital_debt_equity','owner_retained','Capital transfers, debt, guarantees, equity, and intercompany funding remain owner-retained.','Must use the HQ capital-request workflow and reserve policy.',6),
  ('executive_people','owner_retained','Company-operator and executive hiring, termination, compensation, and succession remain owner-retained.','HQ records the owner decision; RunTech Hiring stores candidate workflow.',7),
  ('legal_and_reputation','owner_approval','Material legal, regulatory, public-reputation, settlement, refund, and claim exposure requires owner approval.','Emergency safety action is allowed but must be reported immediately.',8)
) as v(category,authority_level,limit_text,conditions,position)
where s.seat_type='company_operator' and s.is_active
on conflict(seat_id,category) do nothing;

create or replace function public.hq_get_operator_center(p_user_id uuid)
returns jsonb language plpgsql stable security definer set search_path=hq,public,pg_catalog as $$
declare result jsonb;
begin
  if not hq.is_active_owner(p_user_id) then raise exception 'Active HQ owner access required'; end if;
  select jsonb_build_object(
    'summary',jsonb_build_object(
      'totalSeats',(select count(*) from hq.operator_seats where seat_type='company_operator' and is_active),
      'installed',(select count(*) from hq.operator_seats where seat_type='company_operator' and is_active and appointment_status in ('probation','active')),
      'vacant',(select count(*) from hq.operator_seats where seat_type='company_operator' and is_active and appointment_status='vacant'),
      'replacementRequired',(select count(*) from hq.operator_seats where seat_type='company_operator' and is_active and appointment_status='replacement_required'),
      'reviewsDue',(select count(*) from hq.operator_seats where seat_type='company_operator' and is_active and next_review_date is not null and next_review_date<=current_date)
    ),
    'seats',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',s.id,'companyId',s.company_id,'companyName',c.name,'companySlug',c.slug,'cashRole',c.cash_role,
        'title',s.title,'primaryResult',s.primary_result,'mandate',s.mandate,'authoritySummary',s.authority_summary,
        'currentOwner',s.current_owner_label,'appointmentStatus',s.appointment_status,'appointedAt',s.appointed_at,
        'reviewCadence',s.review_cadence,'nextReviewDate',s.next_review_date,'ownerConfidence',s.owner_confidence,
        'hiringJobReference',s.hiring_job_reference,'hiringCandidateReference',s.hiring_candidate_reference,
        'riskLevel',s.operator_risk_level,'transitionStatus',s.transition_status,'incumbentUserId',s.incumbent_user_id,
        'authorityRules',coalesce((select jsonb_agg(jsonb_build_object(
          'id',a.id,'category',a.category,'authorityLevel',a.authority_level,'limitText',a.limit_text,
          'conditions',a.conditions,'position',a.position
        ) order by a.position) from hq.operator_authority_rules a where a.seat_id=s.id),'[]'::jsonb),
        'reviews',coalesce((select jsonb_agg(jsonb_build_object(
          'id',r.id,'periodStart',r.period_start,'periodEnd',r.period_end,'status',r.status,
          'performanceScore',r.performance_score,'ownerConfidence',r.owner_confidence,'resultSummary',r.result_summary,
          'wins',r.wins,'misses',r.misses,'correctiveActions',r.corrective_actions,'commitments',r.commitments,
          'ownerDecision',r.owner_decision,'nextReviewDate',r.next_review_date,'reviewedAt',r.reviewed_at,'updatedAt',r.updated_at
        ) order by r.period_end desc) from hq.operator_reviews r where r.seat_id=s.id),'[]'::jsonb)
      ) order by case c.cash_role when 'cash_engine' then 0 when 'asset' then 1 else 2 end,c.name)
      from hq.operator_seats s join hq.companies c on c.id=s.company_id
      where s.seat_type='company_operator' and s.is_active
    ),'[]'::jsonb)
  ) into result;
  return result;
end $$;

create or replace function public.hq_update_operator_seat(
  p_actor_user_id uuid,p_seat_id uuid,p_current_owner_label text,p_appointment_status text,p_appointed_at date,
  p_next_review_date date,p_owner_confidence smallint,p_hiring_job_reference text,p_hiring_candidate_reference text,
  p_mandate text,p_operator_risk_level text
)
returns jsonb language plpgsql security definer set search_path=hq,public,pg_catalog as $$
declare old_row hq.operator_seats%rowtype; new_row hq.operator_seats%rowtype;
begin
  if not hq.is_active_owner(p_actor_user_id) then raise exception 'Active HQ owner access required'; end if;
  if p_appointment_status not in ('vacant','interim','probation','active','replacement_required') then raise exception 'Invalid appointment status'; end if;
  if p_owner_confidence is not null and p_owner_confidence not between 1 and 5 then raise exception 'Owner confidence must be between 1 and 5'; end if;
  if p_operator_risk_level not in ('critical','high','medium','low') then raise exception 'Invalid operator risk level'; end if;
  select * into old_row from hq.operator_seats where id=p_seat_id and seat_type='company_operator' for update;
  if old_row.id is null then raise exception 'Operator seat not found'; end if;
  update hq.operator_seats set current_owner_label=nullif(trim(p_current_owner_label),''),appointment_status=p_appointment_status,
    appointed_at=p_appointed_at,next_review_date=p_next_review_date,owner_confidence=p_owner_confidence,
    hiring_job_reference=nullif(trim(p_hiring_job_reference),''),hiring_candidate_reference=nullif(trim(p_hiring_candidate_reference),''),
    mandate=nullif(trim(p_mandate),''),operator_risk_level=p_operator_risk_level,
    transition_status=case when p_appointment_status='active' then 'delegated' when p_appointment_status='probation' then 'mapping' else transition_status end,
    updated_at=now()
  where id=p_seat_id returning * into new_row;
  insert into hq.audit_log(actor_user_id,company_id,action,entity_type,entity_id,old_values,new_values)
  values(p_actor_user_id,new_row.company_id,'update','operator_seat',new_row.id::text,to_jsonb(old_row),to_jsonb(new_row));
  return jsonb_build_object('id',new_row.id,'appointmentStatus',new_row.appointment_status,'updatedAt',new_row.updated_at);
end $$;

create or replace function public.hq_save_operator_review(
  p_actor_user_id uuid,p_seat_id uuid,p_period_start date,p_period_end date,p_status text,
  p_performance_score smallint,p_owner_confidence smallint,p_result_summary text,p_wins jsonb,p_misses jsonb,
  p_corrective_actions jsonb,p_commitments jsonb,p_owner_decision text,p_next_review_date date
)
returns jsonb language plpgsql security definer set search_path=hq,public,pg_catalog as $$
declare target_company_id uuid; saved hq.operator_reviews%rowtype;
begin
  if not hq.is_active_owner(p_actor_user_id) then raise exception 'Active HQ owner access required'; end if;
  if p_period_end<p_period_start then raise exception 'Review end date cannot precede start date'; end if;
  if p_status not in ('draft','submitted','reviewed','closed') then raise exception 'Invalid review status'; end if;
  if p_owner_decision not in ('pending','continue','correct','replace') then raise exception 'Invalid owner decision'; end if;
  if p_performance_score is not null and p_performance_score not between 1 and 5 then raise exception 'Performance score must be between 1 and 5'; end if;
  if p_owner_confidence is not null and p_owner_confidence not between 1 and 5 then raise exception 'Owner confidence must be between 1 and 5'; end if;
  select company_id into target_company_id from hq.operator_seats where id=p_seat_id and seat_type='company_operator';
  if target_company_id is null then raise exception 'Operator seat not found'; end if;
  insert into hq.operator_reviews(seat_id,period_start,period_end,status,performance_score,owner_confidence,result_summary,wins,misses,
    corrective_actions,commitments,owner_decision,next_review_date,reviewed_by,reviewed_at,updated_at)
  values(p_seat_id,p_period_start,p_period_end,p_status,p_performance_score,p_owner_confidence,nullif(trim(p_result_summary),''),
    coalesce(p_wins,'[]'::jsonb),coalesce(p_misses,'[]'::jsonb),coalesce(p_corrective_actions,'[]'::jsonb),
    coalesce(p_commitments,'[]'::jsonb),p_owner_decision,p_next_review_date,p_actor_user_id,
    case when p_status in ('reviewed','closed') then now() else null end,now())
  on conflict(seat_id,period_start,period_end) do update set status=excluded.status,performance_score=excluded.performance_score,
    owner_confidence=excluded.owner_confidence,result_summary=excluded.result_summary,wins=excluded.wins,misses=excluded.misses,
    corrective_actions=excluded.corrective_actions,commitments=excluded.commitments,owner_decision=excluded.owner_decision,
    next_review_date=excluded.next_review_date,reviewed_by=excluded.reviewed_by,
    reviewed_at=case when excluded.status in ('reviewed','closed') then now() else hq.operator_reviews.reviewed_at end,updated_at=now()
  returning * into saved;
  update hq.operator_seats set owner_confidence=coalesce(p_owner_confidence,owner_confidence),next_review_date=p_next_review_date,
    appointment_status=case when p_owner_decision='replace' then 'replacement_required' else appointment_status end,updated_at=now()
  where id=p_seat_id;
  insert into hq.audit_log(actor_user_id,company_id,action,entity_type,entity_id,new_values)
  values(p_actor_user_id,target_company_id,'save','operator_review',saved.id::text,to_jsonb(saved));
  return jsonb_build_object('id',saved.id,'status',saved.status,'ownerDecision',saved.owner_decision);
end $$;

revoke all on function public.hq_get_operator_center(uuid) from public,anon,authenticated;
revoke all on function public.hq_update_operator_seat(uuid,uuid,text,text,date,date,smallint,text,text,text,text) from public,anon,authenticated;
revoke all on function public.hq_save_operator_review(uuid,uuid,date,date,text,smallint,smallint,text,jsonb,jsonb,jsonb,jsonb,text,date) from public,anon,authenticated;
grant execute on function public.hq_get_operator_center(uuid) to service_role;
grant execute on function public.hq_update_operator_seat(uuid,uuid,text,text,date,date,smallint,text,text,text,text) to service_role;
grant execute on function public.hq_save_operator_review(uuid,uuid,date,date,text,smallint,smallint,text,jsonb,jsonb,jsonb,jsonb,text,date) to service_role;
