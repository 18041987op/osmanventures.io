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
  verified_cash numeric;
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
  verified_cash:=coalesce(p_current_cash,old_row.current_cash);
  required:=coalesce(p_payroll_buffer,0)+coalesce(p_vendor_buffer,0)+coalesce(p_tax_buffer,0)+coalesce(p_debt_and_rent_buffer,0)+coalesce(p_emergency_buffer,0)+coalesce(p_other_buffer,0);

  if p_status='approved' and (verified_cash is null or required<=0) then
    raise exception 'Verified cash and a positive reserve are required for approval';
  end if;

  update hq.reserve_policies set
    current_cash=verified_cash,
    payroll_buffer=coalesce(p_payroll_buffer,0),
    vendor_buffer=coalesce(p_vendor_buffer,0),
    tax_buffer=coalesce(p_tax_buffer,0),
    debt_and_rent_buffer=coalesce(p_debt_and_rent_buffer,0),
    emergency_buffer=coalesce(p_emergency_buffer,0),
    other_buffer=coalesce(p_other_buffer,0),
    notes=nullif(trim(p_notes),''),
    status=p_status,
    approved_by=case when p_status='approved' then p_actor_user_id else approved_by end,
    approved_at=case when p_status='approved' then coalesce(approved_at,now()) else approved_at end,
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

revoke all on function public.hq_save_reserve_policy(uuid,numeric,numeric,numeric,numeric,numeric,numeric,numeric,text,text)
  from public,anon,authenticated;
grant execute on function public.hq_save_reserve_policy(uuid,numeric,numeric,numeric,numeric,numeric,numeric,numeric,text,text)
  to service_role;