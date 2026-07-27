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

  if not exists(
    select 1 from hq.reserve_snapshots
    where policy_id=policy.id and source_note=source_label
  ) then
    insert into hq.reserve_snapshots(
      policy_id,company_id,snapshot_date,current_cash,required_reserve,
      available_capital,source_note,recorded_by
    ) values (
      policy.id,policy.company_id,liquidity.snapshot_day,
      liquidity.net_liquid_after_cards,required,
      greatest(liquidity.net_liquid_after_cards-required,0),source_label,null
    );

    insert into hq.audit_log(actor_user_id,company_id,action,entity_type,entity_id,new_values)
    values(
      null,policy.company_id,'sync_cash','reserve_policy',policy.id::text,
      jsonb_build_object(
        'snapshotId',liquidity.id,
        'snapshotDay',liquidity.snapshot_day,
        'bankBalance',liquidity.total_bank_balance,
        'creditCardBalance',liquidity.total_credit_card_balance,
        'currentCash',liquidity.net_liquid_after_cards,
        'requiredReserve',required
      )
    );
  end if;

  return jsonb_build_object(
    'updated',true,
    'snapshotId',liquidity.id,
    'snapshotDay',liquidity.snapshot_day,
    'bankBalance',liquidity.total_bank_balance,
    'creditCardBalance',liquidity.total_credit_card_balance,
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