create or replace function public.hq_save_reserve_policy(
  p_actor_user_id uuid,
  p_current_cash numeric,
  p_payroll_buffer numeric,
  p_vendor_buffer numeric,
  p_tax_buffer numeric,
  p_debt_and_rent_buffer numeric,
  p_emergency_buffer numeric,
  p_other_buffer numeric,
  p_notes text,
  p_status text
)
returns jsonb
language plpgsql
security definer
set search_path=hq,public,pg_catalog
as $$
declare
  old_row hq.reserve_policies%rowtype;
  new_row hq.reserve_policies%rowtype;
  autorx_id uuid;
  required numeric;
begin
  if not hq.is_active_owner(p_actor_user_id) then
    raise exception 'Active HQ owner access required';
  end if;
  if p_status not in ('draft','approved','paused') then
    raise exception 'Invalid policy status';
  end if;
  if least(
    coalesce(p_payroll_buffer,0),coalesce(p_vendor_buffer,0),coalesce(p_tax_buffer,0),
    coalesce(p_debt_and_rent_buffer,0),coalesce(p_emergency_buffer,0),coalesce(p_other_buffer,0)
  ) < 0 then
    raise exception 'Reserve values cannot be negative';
  end if;

  select id into autorx_id from hq.companies where slug='autorx';
  select * into old_row from hq.reserve_policies where company_id=autorx_id for update;
  required:=coalesce(p_payroll_buffer,0)+coalesce(p_vendor_buffer,0)+coalesce(p_tax_buffer,0)+coalesce(p_debt_and_rent_buffer,0)+coalesce(p_emergency_buffer,0)+coalesce(p_other_buffer,0);

  if p_status='approved' and (p_current_cash is null or required<=0) then
    raise exception 'Verified cash and a positive reserve are required for approval';
  end if;

  update hq.reserve_policies set
    current_cash=p_current_cash,
    payroll_buffer=coalesce(p_payroll_buffer,0),
    vendor_buffer=coalesce(p_vendor_buffer,0),
    tax_buffer=coalesce(p_tax_buffer,0),
    debt_and_rent_buffer=coalesce(p_debt_and_rent_buffer,0),
    emergency_buffer=coalesce(p_emergency_buffer,0),
    other_buffer=coalesce(p_other_buffer,0),
    notes=nullif(trim(p_notes),''),
    status=p_status,
    approved_by=case when p_status='approved' then p_actor_user_id else approved_by end,
    approved_at=case when p_status='approved' then now() else approved_at end,
    updated_at=now()
  where company_id=autorx_id
  returning * into new_row;

  insert into hq.reserve_snapshots(
    policy_id,company_id,current_cash,required_reserve,available_capital,source_note,recorded_by
  ) values(
    new_row.id,autorx_id,new_row.current_cash,required,
    case when new_row.current_cash is null then null else greatest(new_row.current_cash-required,0) end,
    'Policy save',p_actor_user_id
  );

  insert into hq.audit_log(actor_user_id,company_id,action,entity_type,entity_id,old_values,new_values)
  values(p_actor_user_id,autorx_id,'save','reserve_policy',new_row.id::text,to_jsonb(old_row),to_jsonb(new_row));

  return jsonb_build_object(
    'id',new_row.id,'status',new_row.status,'requiredReserve',required,
    'availableCapital',case when new_row.current_cash is null then null else greatest(new_row.current_cash-required,0) end
  );
end;
$$;

create or replace function public.hq_create_capital_request(
  p_actor_user_id uuid,
  p_company_id uuid,
  p_funding_company_id uuid,
  p_title text,
  p_amount numeric,
  p_purpose text,
  p_expected_result text,
  p_milestone text,
  p_review_date date,
  p_stop_condition text,
  p_request_type text,
  p_priority text
)
returns jsonb
language plpgsql
security definer
set search_path=hq,public,pg_catalog
as $$
declare new_row hq.capital_requests%rowtype;
begin
  if not hq.is_active_owner(p_actor_user_id) then raise exception 'Active HQ owner access required'; end if;
  if p_amount<=0 then raise exception 'Amount must be greater than zero'; end if;
  if length(trim(p_title))<3 or length(trim(p_purpose))<5 or length(trim(p_expected_result))<5 or length(trim(p_milestone))<3 or length(trim(p_stop_condition))<3 then
    raise exception 'Complete the capital request requirements';
  end if;

  insert into hq.capital_requests(
    company_id,funding_company_id,requested_by,title,amount,purpose,expected_result,
    milestone,review_date,stop_condition,status,request_type,priority
  ) values(
    p_company_id,p_funding_company_id,p_actor_user_id,trim(p_title),p_amount,
    trim(p_purpose),trim(p_expected_result),trim(p_milestone),p_review_date,
    trim(p_stop_condition),'requested',coalesce(nullif(trim(p_request_type),''),'investment'),
    coalesce(nullif(trim(p_priority),''),'normal')
  ) returning * into new_row;

  insert into hq.audit_log(actor_user_id,company_id,action,entity_type,entity_id,new_values)
  values(p_actor_user_id,p_company_id,'create','capital_request',new_row.id::text,to_jsonb(new_row));

  return jsonb_build_object('id',new_row.id,'status',new_row.status);
end;
$$;

create or replace function public.hq_update_capital_request(
  p_actor_user_id uuid,
  p_request_id uuid,
  p_status text,
  p_approved_amount numeric,
  p_owner_notes text
)
returns jsonb
language plpgsql
security definer
set search_path=hq,public,pg_catalog
as $$
declare
  old_row hq.capital_requests%rowtype;
  new_row hq.capital_requests%rowtype;
  policy hq.reserve_policies%rowtype;
  required numeric;
  amount_to_use numeric;
begin
  if not hq.is_active_owner(p_actor_user_id) then raise exception 'Active HQ owner access required'; end if;
  if p_status not in ('requested','approved','rejected','funded','paused','closed') then raise exception 'Invalid capital request status'; end if;

  select * into old_row from hq.capital_requests where id=p_request_id for update;
  if old_row.id is null then raise exception 'Capital request not found'; end if;

  amount_to_use:=coalesce(p_approved_amount,old_row.amount);

  if p_status='approved' then
    select * into policy from hq.reserve_policies where company_id=old_row.funding_company_id;
    if policy.id is null or policy.status<>'approved' then
      raise exception 'The funding company reserve policy must be approved first';
    end if;
    if policy.current_cash is null then raise exception 'Verified current cash is required'; end if;
    required:=hq.required_reserve(policy);
    if policy.current_cash-amount_to_use<required then
      raise exception 'This approval would reduce cash below the protected reserve';
    end if;
  end if;

  update hq.capital_requests set
    status=p_status,
    approved_by=case when p_status='approved' then p_actor_user_id else approved_by end,
    approved_amount=case when p_status='approved' then amount_to_use else approved_amount end,
    reserve_required_at_decision=case when p_status='approved' then required else reserve_required_at_decision end,
    cash_after=case when p_status='approved' then policy.current_cash-amount_to_use else cash_after end,
    eligibility_status=case when p_status='approved' then 'eligible' when p_status='rejected' then 'rejected' else eligibility_status end,
    owner_notes=nullif(trim(p_owner_notes),''),
    approved_at=case when p_status='approved' then now() else approved_at end,
    rejected_at=case when p_status='rejected' then now() else rejected_at end,
    funded_at=case when p_status='funded' then now() else funded_at end,
    closed_at=case when p_status='closed' then now() else closed_at end,
    updated_at=now()
  where id=p_request_id
  returning * into new_row;

  insert into hq.audit_log(actor_user_id,company_id,action,entity_type,entity_id,old_values,new_values)
  values(p_actor_user_id,new_row.company_id,'update','capital_request',new_row.id::text,to_jsonb(old_row),to_jsonb(new_row));

  return jsonb_build_object('id',new_row.id,'status',new_row.status,'cashAfter',new_row.cash_after);
end;
$$;

create or replace function public.hq_create_decision(
  p_actor_user_id uuid,
  p_company_id uuid,
  p_title text,
  p_context text,
  p_options jsonb,
  p_assumptions jsonb,
  p_decision_type text,
  p_priority text,
  p_expected_result text,
  p_due_date date,
  p_review_date date,
  p_linked_entity_type text,
  p_linked_entity_id text
)
returns jsonb
language plpgsql
security definer
set search_path=hq,public,pg_catalog
as $$
declare new_row hq.decisions%rowtype;
begin
  if not hq.is_active_owner(p_actor_user_id) then raise exception 'Active HQ owner access required'; end if;
  if length(trim(p_title))<3 or length(trim(p_context))<5 then raise exception 'Decision title and context are required'; end if;

  insert into hq.decisions(
    company_id,title,context,options,assumptions,owner_user_id,status,
    decision_type,priority,expected_result,due_date,review_date,
    linked_entity_type,linked_entity_id
  ) values(
    p_company_id,trim(p_title),trim(p_context),coalesce(p_options,'[]'::jsonb),
    coalesce(p_assumptions,'[]'::jsonb),p_actor_user_id,'proposed',
    coalesce(nullif(trim(p_decision_type),''),'operating'),
    coalesce(nullif(trim(p_priority),''),'normal'),nullif(trim(p_expected_result),''),
    p_due_date,p_review_date,nullif(trim(p_linked_entity_type),''),nullif(trim(p_linked_entity_id),'')
  ) returning * into new_row;

  insert into hq.audit_log(actor_user_id,company_id,action,entity_type,entity_id,new_values)
  values(p_actor_user_id,p_company_id,'create','decision',new_row.id::text,to_jsonb(new_row));

  return jsonb_build_object('id',new_row.id,'status',new_row.status);
end;
$$;

create or replace function public.hq_update_decision(
  p_actor_user_id uuid,
  p_decision_id uuid,
  p_status text,
  p_decision text,
  p_actual_result text,
  p_lessons text
)
returns jsonb
language plpgsql
security definer
set search_path=hq,public,pg_catalog
as $$
declare old_row hq.decisions%rowtype; new_row hq.decisions%rowtype;
begin
  if not hq.is_active_owner(p_actor_user_id) then raise exception 'Active HQ owner access required'; end if;
  if p_status not in ('proposed','approved','rejected','implemented','reviewed') then raise exception 'Invalid decision status'; end if;

  select * into old_row from hq.decisions where id=p_decision_id for update;
  if old_row.id is null then raise exception 'Decision not found'; end if;
  if p_status in ('approved','rejected') and length(trim(coalesce(p_decision,'')))<3 then
    raise exception 'A written decision is required';
  end if;

  update hq.decisions set
    status=p_status::hq.decision_status,
    decision=nullif(trim(p_decision),''),
    actual_result=nullif(trim(p_actual_result),''),
    lessons=nullif(trim(p_lessons),''),
    decided_at=case when p_status in ('approved','rejected') then now() else decided_at end,
    updated_at=now()
  where id=p_decision_id
  returning * into new_row;

  insert into hq.audit_log(actor_user_id,company_id,action,entity_type,entity_id,old_values,new_values)
  values(p_actor_user_id,new_row.company_id,'update','decision',new_row.id::text,to_jsonb(old_row),to_jsonb(new_row));

  return jsonb_build_object('id',new_row.id,'status',new_row.status);
end;
$$;

create or replace function public.hq_create_risk(
  p_actor_user_id uuid,
  p_company_id uuid,
  p_title text,
  p_category text,
  p_description text,
  p_probability smallint,
  p_impact smallint,
  p_owner_label text,
  p_mitigation_plan text,
  p_trigger_condition text,
  p_next_review_date date
)
returns jsonb
language plpgsql
security definer
set search_path=hq,public,pg_catalog
as $$
declare new_row hq.risks%rowtype;
begin
  if not hq.is_active_owner(p_actor_user_id) then raise exception 'Active HQ owner access required'; end if;
  if p_probability not between 1 and 5 or p_impact not between 1 and 5 then raise exception 'Probability and impact must be between 1 and 5'; end if;
  if length(trim(p_title))<3 then raise exception 'Risk title is required'; end if;

  insert into hq.risks(
    company_id,title,category,probability,impact,description,owner_label,
    mitigation_plan,trigger_condition,next_review_date,status
  ) values(
    p_company_id,trim(p_title),coalesce(nullif(trim(p_category),''),'general'),
    p_probability,p_impact,nullif(trim(p_description),''),nullif(trim(p_owner_label),''),
    nullif(trim(p_mitigation_plan),''),nullif(trim(p_trigger_condition),''),p_next_review_date,'open'
  ) returning * into new_row;

  insert into hq.audit_log(actor_user_id,company_id,action,entity_type,entity_id,new_values)
  values(p_actor_user_id,p_company_id,'create','risk',new_row.id::text,to_jsonb(new_row));

  return jsonb_build_object('id',new_row.id,'status',new_row.status);
end;
$$;

create or replace function public.hq_update_risk(
  p_actor_user_id uuid,
  p_risk_id uuid,
  p_status text,
  p_probability smallint,
  p_impact smallint,
  p_owner_label text,
  p_mitigation_plan text,
  p_trigger_condition text,
  p_next_review_date date,
  p_residual_probability smallint,
  p_residual_impact smallint
)
returns jsonb
language plpgsql
security definer
set search_path=hq,public,pg_catalog
as $$
declare old_row hq.risks%rowtype; new_row hq.risks%rowtype;
begin
  if not hq.is_active_owner(p_actor_user_id) then raise exception 'Active HQ owner access required'; end if;
  if p_status not in ('open','mitigating','accepted','closed') then raise exception 'Invalid risk status'; end if;
  if p_probability not between 1 and 5 or p_impact not between 1 and 5 then raise exception 'Probability and impact must be between 1 and 5'; end if;

  select * into old_row from hq.risks where id=p_risk_id for update;
  if old_row.id is null then raise exception 'Risk not found'; end if;

  update hq.risks set
    status=p_status::hq.risk_status,
    probability=p_probability,
    impact=p_impact,
    owner_label=nullif(trim(p_owner_label),''),
    mitigation_plan=nullif(trim(p_mitigation_plan),''),
    trigger_condition=nullif(trim(p_trigger_condition),''),
    next_review_date=p_next_review_date,
    residual_probability=p_residual_probability,
    residual_impact=p_residual_impact,
    last_reviewed_at=now(),
    updated_at=now()
  where id=p_risk_id
  returning * into new_row;

  insert into hq.audit_log(actor_user_id,company_id,action,entity_type,entity_id,old_values,new_values)
  values(p_actor_user_id,new_row.company_id,'update','risk',new_row.id::text,to_jsonb(old_row),to_jsonb(new_row));

  return jsonb_build_object('id',new_row.id,'status',new_row.status);
end;
$$;

create or replace function public.hq_create_control(
  p_actor_user_id uuid,
  p_company_id uuid,
  p_title text,
  p_category text,
  p_objective text,
  p_frequency text,
  p_owner_label text,
  p_evidence_required text,
  p_is_owner_retained boolean,
  p_next_due_date date
)
returns jsonb
language plpgsql
security definer
set search_path=hq,public,pg_catalog
as $$
declare new_row hq.controls%rowtype;
begin
  if not hq.is_active_owner(p_actor_user_id) then raise exception 'Active HQ owner access required'; end if;
  if length(trim(p_title))<3 or length(trim(p_objective))<5 then raise exception 'Control title and objective are required'; end if;

  insert into hq.controls(
    company_id,title,category,objective,frequency,owner_label,
    evidence_required,status,is_owner_retained,next_due_date
  ) values(
    p_company_id,trim(p_title),coalesce(nullif(trim(p_category),''),'general'),
    trim(p_objective),coalesce(nullif(trim(p_frequency),''),'monthly'),
    nullif(trim(p_owner_label),''),nullif(trim(p_evidence_required),''),
    'gap',coalesce(p_is_owner_retained,false),p_next_due_date
  ) returning * into new_row;

  insert into hq.audit_log(actor_user_id,company_id,action,entity_type,entity_id,new_values)
  values(p_actor_user_id,p_company_id,'create','control',new_row.id::text,to_jsonb(new_row));

  return jsonb_build_object('id',new_row.id,'status',new_row.status);
end;
$$;

create or replace function public.hq_update_control(
  p_actor_user_id uuid,
  p_control_id uuid,
  p_status text,
  p_owner_label text,
  p_evidence_required text,
  p_next_due_date date,
  p_notes text,
  p_mark_completed boolean
)
returns jsonb
language plpgsql
security definer
set search_path=hq,public,pg_catalog
as $$
declare old_row hq.controls%rowtype; new_row hq.controls%rowtype;
begin
  if not hq.is_active_owner(p_actor_user_id) then raise exception 'Active HQ owner access required'; end if;
  if p_status not in ('active','gap','paused','retired') then raise exception 'Invalid control status'; end if;

  select * into old_row from hq.controls where id=p_control_id for update;
  if old_row.id is null then raise exception 'Control not found'; end if;

  update hq.controls set
    status=p_status,
    owner_label=nullif(trim(p_owner_label),''),
    evidence_required=nullif(trim(p_evidence_required),''),
    next_due_date=p_next_due_date,
    notes=nullif(trim(p_notes),''),
    last_completed_at=case when p_mark_completed then now() else last_completed_at end,
    updated_at=now()
  where id=p_control_id
  returning * into new_row;

  insert into hq.audit_log(actor_user_id,company_id,action,entity_type,entity_id,old_values,new_values)
  values(p_actor_user_id,new_row.company_id,'update','control',new_row.id::text,to_jsonb(old_row),to_jsonb(new_row));

  return jsonb_build_object('id',new_row.id,'status',new_row.status,'lastCompletedAt',new_row.last_completed_at);
end;
$$;

revoke all on function public.hq_save_reserve_policy(uuid,numeric,numeric,numeric,numeric,numeric,numeric,numeric,text,text) from public,anon,authenticated;
revoke all on function public.hq_create_capital_request(uuid,uuid,uuid,text,numeric,text,text,text,date,text,text,text) from public,anon,authenticated;
revoke all on function public.hq_update_capital_request(uuid,uuid,text,numeric,text) from public,anon,authenticated;
revoke all on function public.hq_create_decision(uuid,uuid,text,text,jsonb,jsonb,text,text,text,date,date,text,text) from public,anon,authenticated;
revoke all on function public.hq_update_decision(uuid,uuid,text,text,text,text) from public,anon,authenticated;
revoke all on function public.hq_create_risk(uuid,uuid,text,text,text,smallint,smallint,text,text,text,date) from public,anon,authenticated;
revoke all on function public.hq_update_risk(uuid,uuid,text,smallint,smallint,text,text,text,date,smallint,smallint) from public,anon,authenticated;
revoke all on function public.hq_create_control(uuid,uuid,text,text,text,text,text,text,boolean,date) from public,anon,authenticated;
revoke all on function public.hq_update_control(uuid,uuid,text,text,text,date,text,boolean) from public,anon,authenticated;

grant execute on function public.hq_save_reserve_policy(uuid,numeric,numeric,numeric,numeric,numeric,numeric,numeric,text,text) to service_role;
grant execute on function public.hq_create_capital_request(uuid,uuid,uuid,text,numeric,text,text,text,date,text,text,text) to service_role;
grant execute on function public.hq_update_capital_request(uuid,uuid,text,numeric,text) to service_role;
grant execute on function public.hq_create_decision(uuid,uuid,text,text,jsonb,jsonb,text,text,text,date,date,text,text) to service_role;
grant execute on function public.hq_update_decision(uuid,uuid,text,text,text,text) to service_role;
grant execute on function public.hq_create_risk(uuid,uuid,text,text,text,smallint,smallint,text,text,text,date) to service_role;
grant execute on function public.hq_update_risk(uuid,uuid,text,smallint,smallint,text,text,text,date,smallint,smallint) to service_role;
grant execute on function public.hq_create_control(uuid,uuid,text,text,text,text,text,text,boolean,date) to service_role;
grant execute on function public.hq_update_control(uuid,uuid,text,text,text,date,text,boolean) to service_role;
