create table if not exists hq.cash_position_snapshots (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references hq.companies(id) on delete cascade,
  snapshot_date date not null,
  source text not null default 'runtech_quickbooks',
  liquid_bank_cash numeric(14,2) not null default 0,
  excluded_book_cash numeric(14,2) not null default 0,
  credit_card_debt numeric(14,2) not null default 0,
  net_operating_liquidity numeric(14,2) not null default 0,
  payroll_pending numeric(14,2) not null default 0,
  parts_vendor_30d numeric(14,2) not null default 0,
  taxes_30d numeric(14,2) not null default 0,
  rent_debt_30d numeric(14,2) not null default 0,
  other_obligations_30d numeric(14,2) not null default 0,
  restricted_cash numeric(14,2) not null default 0,
  total_known_commitments numeric(14,2) not null default 0,
  projected_after_commitments numeric(14,2) not null default 0,
  required_reserve numeric(14,2) not null default 0,
  hard_floor numeric(14,2) not null default 0,
  reserve_gap numeric(14,2) not null default 0,
  operating_band text not null check (
    operating_band in ('emergency','stabilization','reserve_compliant','capital_review')
  ),
  details jsonb not null default '{}'::jsonb,
  recorded_by uuid references hq.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id,snapshot_date,source)
);

create index if not exists cash_position_company_date_idx
  on hq.cash_position_snapshots(company_id,snapshot_date desc);

alter table hq.cash_position_snapshots enable row level security;
revoke all on hq.cash_position_snapshots from public,anon,authenticated;
grant all on hq.cash_position_snapshots to service_role;

drop policy if exists service_role_cash_position on hq.cash_position_snapshots;
create policy service_role_cash_position
  on hq.cash_position_snapshots
  for all to service_role
  using (true)
  with check (true);

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
begin
  select slug into shop_slug from public.shops where id=p_shop_id;
  if shop_slug is distinct from 'autorx-charlotte' then
    return jsonb_build_object('updated',false,'reason','not_autorx');
  end if;

  select * into liquidity
  from public.qb_cash_snapshots
  where shop_id=p_shop_id
  order by snapshot_day desc,synced_at desc
  limit 1;

  if liquidity.id is null then
    return jsonb_build_object('updated',false,'reason','no_snapshot');
  end if;

  select rp.* into policy
  from hq.reserve_policies rp
  join hq.companies c on c.id=rp.company_id
  where c.slug='autorx'
  for update;

  if policy.id is null then
    raise exception 'AutoRx reserve policy not found';
  end if;

  required:=hq.required_reserve(policy);
  source_label:='QuickBooks liquidity snapshot ' || liquidity.id::text;

  update hq.reserve_policies
  set current_cash=liquidity.net_liquid_after_cards,
      updated_at=now()
  where id=policy.id;

  select id into existing_snapshot_id
  from hq.reserve_snapshots
  where policy_id=policy.id and source_note=source_label
  order by created_at desc
  limit 1;

  if existing_snapshot_id is null then
    insert into hq.reserve_snapshots(
      policy_id,company_id,snapshot_date,current_cash,required_reserve,
      available_capital,source_note,recorded_by
    ) values (
      policy.id,policy.company_id,liquidity.snapshot_day,
      liquidity.net_liquid_after_cards,required,
      greatest(liquidity.net_liquid_after_cards-required,0),source_label,null
    );
  else
    update hq.reserve_snapshots
    set snapshot_date=liquidity.snapshot_day,
        current_cash=liquidity.net_liquid_after_cards,
        required_reserve=required,
        available_capital=greatest(liquidity.net_liquid_after_cards-required,0)
    where id=existing_snapshot_id;
  end if;

  insert into hq.audit_log(actor_user_id,company_id,action,entity_type,entity_id,new_values)
  values(
    null,policy.company_id,'sync_cash','reserve_policy',policy.id::text,
    jsonb_build_object(
      'snapshotId',liquidity.id,
      'snapshotDay',liquidity.snapshot_day,
      'liquidBankBalance',liquidity.total_bank_balance,
      'excludedCashOnHand',liquidity.excluded_cash_on_hand_balance,
      'creditCardDebt',liquidity.total_credit_card_balance,
      'currentCash',liquidity.net_liquid_after_cards,
      'requiredReserve',required
    )
  );

  return jsonb_build_object(
    'updated',true,
    'snapshotId',liquidity.id,
    'snapshotDay',liquidity.snapshot_day,
    'liquidBankBalance',liquidity.total_bank_balance,
    'excludedCashOnHand',liquidity.excluded_cash_on_hand_balance,
    'creditCardDebt',liquidity.total_credit_card_balance,
    'currentCash',liquidity.net_liquid_after_cards,
    'requiredReserve',required,
    'availableCapital',greatest(liquidity.net_liquid_after_cards-required,0),
    'reserveGap',greatest(required-liquidity.net_liquid_after_cards,0),
    'policyStatus',policy.status
  );
end;
$$;

revoke all on function public.hq_refresh_reserve_cash_from_shop(uuid) from public,anon,authenticated;
grant execute on function public.hq_refresh_reserve_cash_from_shop(uuid) to service_role;