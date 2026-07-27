create or replace function hq.refresh_cash_position_from_shop(p_shop_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=hq,public,pg_catalog
as $$
declare
  autorx_id uuid;
  liquidity public.qb_cash_snapshots%rowtype;
  policy hq.reserve_policies%rowtype;
  payroll_due numeric:=0;
  parts_due numeric:=0;
  taxes_due numeric:=0;
  rent_debt_due numeric:=0;
  other_due numeric:=0;
  total_commitments numeric:=0;
  projected_after numeric:=0;
  required numeric:=0;
  hard_floor numeric:=125000;
  release_threshold numeric:=180000;
  band text;
  position_id uuid;
begin
  select id into autorx_id from hq.companies where slug='autorx';
  if autorx_id is null then raise exception 'AutoRx HQ company not found'; end if;

  if not exists(select 1 from public.shops where id=p_shop_id and slug='autorx-charlotte') then
    return jsonb_build_object('updated',false,'reason','not_autorx');
  end if;

  select * into liquidity
  from public.qb_cash_snapshots
  where shop_id=p_shop_id
  order by snapshot_day desc,synced_at desc
  limit 1;
  if liquidity.id is null then return jsonb_build_object('updated',false,'reason','no_liquidity_snapshot'); end if;

  select * into policy from hq.reserve_policies where company_id=autorx_id;
  if policy.id is null then raise exception 'AutoRx reserve policy not found'; end if;
  required:=hq.required_reserve(policy);

  select coalesce(sum(grand_total),0)
  into payroll_due
  from public.payroll_snapshots
  where shop_id=p_shop_id
    and paid_at is null
    and status in ('pending_review','approved');

  with recursive occurrences as (
    select id,vendor_name,category,cost_type,frequency,expected_amount,next_due_date as due_date
    from public.vendor_bills
    where shop_id=p_shop_id
      and is_active
      and next_due_date between liquidity.snapshot_day and liquidity.snapshot_day+30
    union all
    select id,vendor_name,category,cost_type,frequency,expected_amount,
      case frequency
        when 'weekly' then due_date+7
        when 'biweekly' then due_date+14
        when 'monthly' then (due_date+interval '1 month')::date
        when 'quarterly' then (due_date+interval '3 months')::date
        when 'yearly' then (due_date+interval '1 year')::date
        when 'annual' then (due_date+interval '1 year')::date
        else liquidity.snapshot_day+31
      end
    from occurrences
    where case frequency
        when 'weekly' then due_date+7
        when 'biweekly' then due_date+14
        when 'monthly' then (due_date+interval '1 month')::date
        when 'quarterly' then (due_date+interval '3 months')::date
        when 'yearly' then (due_date+interval '1 year')::date
        when 'annual' then (due_date+interval '1 year')::date
        else liquidity.snapshot_day+31
      end <= liquidity.snapshot_day+30
  ), classified as (
    select expected_amount,
      case
        when coalesce(category,'') ilike '%credit card%'
          or lower(vendor_name) in ('amex card','citibank') then 'credit_cards'
        when coalesce(category,'') ilike '%parts%'
          or lower(vendor_name) in ('worldpac','oreilly','o''reilly auto parts','advance auto parts') then 'parts'
        when coalesce(category,'') ilike '%withholding%'
          or coalesce(category,'') ilike '%sales tax%'
          or lower(vendor_name)='irs'
          or lower(vendor_name) like '%dept revenue%' then 'taxes'
        when coalesce(category,'') ilike '%rent%'
          or coalesce(category,'') ilike '%loan%'
          or coalesce(category,'') ilike '%debt%' then 'rent_debt'
        else 'other'
      end as obligation_group
    from occurrences
    where due_date between liquidity.snapshot_day and liquidity.snapshot_day+30
  )
  select
    coalesce(sum(expected_amount) filter(where obligation_group='parts'),0),
    coalesce(sum(expected_amount) filter(where obligation_group='taxes'),0),
    coalesce(sum(expected_amount) filter(where obligation_group='rent_debt'),0),
    coalesce(sum(expected_amount) filter(where obligation_group='other'),0)
  into parts_due,taxes_due,rent_debt_due,other_due
  from classified;

  total_commitments:=coalesce(liquidity.total_credit_card_balance,0)+payroll_due+parts_due+taxes_due+rent_debt_due+other_due;
  projected_after:=coalesce(liquidity.total_bank_balance,0)-total_commitments;

  band:=case
    when liquidity.net_liquid_after_cards<hard_floor then 'emergency'
    when liquidity.net_liquid_after_cards<required then 'stabilization'
    when liquidity.net_liquid_after_cards<release_threshold then 'reserve_compliant'
    else 'capital_review'
  end;

  insert into hq.cash_position_snapshots(
    company_id,snapshot_date,source,liquid_bank_cash,excluded_book_cash,
    credit_card_debt,net_operating_liquidity,payroll_pending,parts_vendor_30d,
    taxes_30d,rent_debt_30d,other_obligations_30d,restricted_cash,
    total_known_commitments,projected_after_commitments,required_reserve,
    hard_floor,reserve_gap,operating_band,details,recorded_by,updated_at
  ) values(
    autorx_id,liquidity.snapshot_day,'runtech_quickbooks',liquidity.total_bank_balance,
    liquidity.excluded_cash_on_hand_balance,liquidity.total_credit_card_balance,
    liquidity.net_liquid_after_cards,payroll_due,parts_due,taxes_due,rent_debt_due,
    other_due,taxes_due,total_commitments,projected_after,required,hard_floor,
    greatest(required-liquidity.net_liquid_after_cards,0),band,
    jsonb_build_object(
      'liquiditySnapshotId',liquidity.id,
      'releaseThreshold',release_threshold,
      'bankAccounts',liquidity.bank_accounts,
      'creditCardAccounts',liquidity.credit_card_accounts,
      'excludedCashReason','QuickBooks CashOnHand balances are retained for reconciliation but excluded until physically verified and deposited.',
      'forecastWindowDays',30,
      'futureSalesIncluded',false
    ),null,now()
  )
  on conflict(company_id,snapshot_date,source) do update set
    liquid_bank_cash=excluded.liquid_bank_cash,
    excluded_book_cash=excluded.excluded_book_cash,
    credit_card_debt=excluded.credit_card_debt,
    net_operating_liquidity=excluded.net_operating_liquidity,
    payroll_pending=excluded.payroll_pending,
    parts_vendor_30d=excluded.parts_vendor_30d,
    taxes_30d=excluded.taxes_30d,
    rent_debt_30d=excluded.rent_debt_30d,
    other_obligations_30d=excluded.other_obligations_30d,
    restricted_cash=excluded.restricted_cash,
    total_known_commitments=excluded.total_known_commitments,
    projected_after_commitments=excluded.projected_after_commitments,
    required_reserve=excluded.required_reserve,
    hard_floor=excluded.hard_floor,
    reserve_gap=excluded.reserve_gap,
    operating_band=excluded.operating_band,
    details=excluded.details,
    updated_at=now()
  returning id into position_id;

  return jsonb_build_object(
    'updated',true,'cashPositionId',position_id,'snapshotDay',liquidity.snapshot_day,
    'liquidBankCash',liquidity.total_bank_balance,'creditCardDebt',liquidity.total_credit_card_balance,
    'netOperatingLiquidity',liquidity.net_liquid_after_cards,'payrollPending',payroll_due,
    'partsVendor30d',parts_due,'taxes30d',taxes_due,'rentDebt30d',rent_debt_due,
    'otherObligations30d',other_due,'totalKnownCommitments',total_commitments,
    'projectedAfterCommitments',projected_after,'requiredReserve',required,
    'reserveGap',greatest(required-liquidity.net_liquid_after_cards,0),'operatingBand',band
  );
end;
$$;

revoke all on function hq.refresh_cash_position_from_shop(uuid) from public,anon,authenticated;
grant execute on function hq.refresh_cash_position_from_shop(uuid) to service_role;

create or replace function public.hq_refresh_reserve_cash_from_shop(p_shop_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=hq,public,pg_catalog
as $$
declare
  shop_slug text;
  liquidity public.qb_cash_snapshots%rowtype;
  policy hq.reserve_policies%rowtype;
  required numeric;
  source_label text;
  existing_snapshot_id uuid;
  position_result jsonb;
begin
  select slug into shop_slug from public.shops where id=p_shop_id;
  if shop_slug is distinct from 'autorx-charlotte' then return jsonb_build_object('updated',false,'reason','not_autorx'); end if;

  select * into liquidity from public.qb_cash_snapshots where shop_id=p_shop_id order by snapshot_day desc,synced_at desc limit 1;
  if liquidity.id is null then return jsonb_build_object('updated',false,'reason','no_snapshot'); end if;

  select rp.* into policy from hq.reserve_policies rp join hq.companies c on c.id=rp.company_id where c.slug='autorx' for update;
  if policy.id is null then raise exception 'AutoRx reserve policy not found'; end if;

  required:=hq.required_reserve(policy);
  source_label:='QuickBooks liquidity snapshot ' || liquidity.id::text;

  update hq.reserve_policies set current_cash=liquidity.net_liquid_after_cards,updated_at=now() where id=policy.id;

  select id into existing_snapshot_id from hq.reserve_snapshots where policy_id=policy.id and source_note=source_label order by created_at desc limit 1;
  if existing_snapshot_id is null then
    insert into hq.reserve_snapshots(policy_id,company_id,snapshot_date,current_cash,required_reserve,available_capital,source_note,recorded_by)
    values(policy.id,policy.company_id,liquidity.snapshot_day,liquidity.net_liquid_after_cards,required,greatest(liquidity.net_liquid_after_cards-required,0),source_label,null);
  else
    update hq.reserve_snapshots set snapshot_date=liquidity.snapshot_day,current_cash=liquidity.net_liquid_after_cards,required_reserve=required,available_capital=greatest(liquidity.net_liquid_after_cards-required,0) where id=existing_snapshot_id;
  end if;

  position_result:=hq.refresh_cash_position_from_shop(p_shop_id);

  insert into hq.audit_log(actor_user_id,company_id,action,entity_type,entity_id,new_values)
  values(null,policy.company_id,'sync_cash','reserve_policy',policy.id::text,jsonb_build_object('snapshotId',liquidity.id,'snapshotDay',liquidity.snapshot_day,'liquidBankBalance',liquidity.total_bank_balance,'excludedCashOnHand',liquidity.excluded_cash_on_hand_balance,'creditCardDebt',liquidity.total_credit_card_balance,'currentCash',liquidity.net_liquid_after_cards,'requiredReserve',required,'cashPosition',position_result));

  return jsonb_build_object('updated',true,'snapshotId',liquidity.id,'snapshotDay',liquidity.snapshot_day,'liquidBankBalance',liquidity.total_bank_balance,'excludedCashOnHand',liquidity.excluded_cash_on_hand_balance,'creditCardDebt',liquidity.total_credit_card_balance,'currentCash',liquidity.net_liquid_after_cards,'requiredReserve',required,'availableCapital',greatest(liquidity.net_liquid_after_cards-required,0),'reserveGap',greatest(required-liquidity.net_liquid_after_cards,0),'policyStatus',policy.status,'cashPosition',position_result);
end;
$$;

revoke all on function public.hq_refresh_reserve_cash_from_shop(uuid) from public,anon,authenticated;
grant execute on function public.hq_refresh_reserve_cash_from_shop(uuid) to service_role;