alter table hq.metric_results
  add column if not exists is_automated boolean not null default false,
  add column if not exists data_quality text not null default 'manual',
  add column if not exists source_updated_at timestamptz;

do $$ begin
  if not exists (select 1 from pg_constraint where conname='metric_results_data_quality_check' and connamespace='hq'::regnamespace) then
    alter table hq.metric_results add constraint metric_results_data_quality_check
      check (data_quality in ('verified','partial','stale','manual'));
  end if;
end $$;

create table if not exists hq.data_sources (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references hq.companies(id) on delete cascade,
  source_key text not null,
  label text not null,
  source_table text,
  status text not null default 'not_ready' check (status in ('ready','partial','not_ready','stale')),
  row_count bigint not null default 0,
  first_observed_at timestamptz,
  last_observed_at timestamptz,
  freshness_days integer,
  notes text,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id,source_key)
);

create table if not exists hq.metric_automation_rules (
  id uuid primary key default gen_random_uuid(),
  metric_id uuid not null unique references hq.metrics(id) on delete cascade,
  source_key text not null,
  calculation_key text not null,
  source_cadence text not null,
  status text not null default 'not_ready' check (status in ('ready','partial','not_ready','paused')),
  notes text,
  last_synced_at timestamptz,
  last_sync_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists data_sources_company_status_idx on hq.data_sources(company_id,status);
create index if not exists metric_automation_rules_status_idx on hq.metric_automation_rules(status,last_synced_at);

alter table hq.data_sources enable row level security;
alter table hq.metric_automation_rules enable row level security;
revoke all on hq.data_sources,hq.metric_automation_rules from public,anon,authenticated;
grant all on hq.data_sources,hq.metric_automation_rules to service_role;

insert into hq.metrics(company_id,name,definition,unit,source_system,cadence,direction,is_owner_control,is_active)
select c.id,v.name,v.definition,v.unit,v.source_system,v.cadence,v.direction,v.is_owner_control,true
from hq.companies c
cross join (values
  ('Monthly sales','Total income recorded in the verified QuickBooks monthly summary.','USD','QuickBooks','monthly','higher_is_better',true),
  ('Monthly gross profit','Gross profit recorded in the verified QuickBooks monthly summary.','USD','QuickBooks','monthly','higher_is_better',true),
  ('Monthly gross margin','Monthly gross profit divided by monthly total income.','percent','QuickBooks','monthly','higher_is_better',true),
  ('Monthly payroll percentage','QuickBooks payroll expense divided by monthly total income.','percent','QuickBooks','monthly','lower_is_better',true),
  ('Weekly payroll cost','Approved or paid weekly payroll snapshot grand total.','USD','RunPayroll','weekly','lower_is_better',true),
  ('Inbound answer rate','Answered inbound calls divided by inbound calls captured by the connected phone source.','percent','RunTech Phone','weekly','higher_is_better',false),
  ('Missed inbound calls','Inbound calls with no answered timestamp in the connected phone source.','count','RunTech Phone','weekly','lower_is_better',false),
  ('Parts leakage exposure','Open amount at risk in the verified parts reconciliation source.','USD','RunTech Parts','monthly','lower_is_better',true)
) as v(name,definition,unit,source_system,cadence,direction,is_owner_control)
where c.slug='autorx'
on conflict(company_id,name) do nothing;

insert into hq.data_sources(company_id,source_key,label,source_table,status,notes)
select c.id,v.source_key,v.label,v.source_table,v.status,v.notes
from hq.companies c
cross join (values
  ('quickbooks_monthly','QuickBooks monthly financial summary','public.qb_monthly_summary','ready','Monthly accounting summaries are available; cadence remains monthly.'),
  ('payroll_weekly','Approved weekly payroll snapshots','public.payroll_snapshots','ready','Historical approved and paid weekly payroll snapshots are available.'),
  ('phone_calls','Connected phone calls','public.phone_calls','partial','Coverage begins in July 2026 and is not yet a mature trend.'),
  ('service_advisor','Service advisor repair-order performance','public.sa_repair_orders','not_ready','No verified AutoRx coverage was found during source audit.'),
  ('parts_leakage','Parts leakage and reconciliation','public.part_leakage','not_ready','No verified AutoRx leakage rows were found during source audit.'),
  ('tekmetric_operations','Tekmetric operating scorecard','Tekmetric API / RunTech tables','not_ready','Sales, sold hours, ARO, estimate conversion, stopped vehicles, and comeback cost need a verified operating feed.')
) as v(source_key,label,source_table,status,notes)
where c.slug='autorx'
on conflict(company_id,source_key) do update set label=excluded.label,source_table=excluded.source_table,notes=excluded.notes,updated_at=now();

insert into hq.metric_automation_rules(metric_id,source_key,calculation_key,source_cadence,status,notes)
select m.id,v.source_key,v.calculation_key,v.source_cadence,v.status,v.notes
from hq.metrics m join hq.companies c on c.id=m.company_id
join (values
  ('Monthly sales','quickbooks_monthly','qb_total_income','monthly','ready','Uses total_income without converting it into weekly data.'),
  ('Monthly gross profit','quickbooks_monthly','qb_gross_profit','monthly','ready','Uses the accounting summary gross_profit field.'),
  ('Monthly gross margin','quickbooks_monthly','qb_gross_margin','monthly','ready','Calculated only when total_income is nonzero.'),
  ('Monthly payroll percentage','quickbooks_monthly','qb_payroll_percentage','monthly','ready','Calculated only when total_income is nonzero.'),
  ('Weekly payroll cost','payroll_weekly','payroll_grand_total','weekly','ready','Only approved or paid payroll snapshots are synchronized.'),
  ('Inbound answer rate','phone_calls','phone_inbound_answer_rate','weekly','partial','Source coverage is partial and every result is marked partial.'),
  ('Missed inbound calls','phone_calls','phone_missed_inbound','weekly','partial','Source coverage is partial and every result is marked partial.'),
  ('Parts leakage exposure','parts_leakage','parts_open_amount_at_risk','monthly','not_ready','Will not synchronize until verified AutoRx source rows exist.')
) as v(metric_name,source_key,calculation_key,source_cadence,status,notes) on v.metric_name=m.name
where c.slug='autorx'
on conflict(metric_id) do update set source_key=excluded.source_key,calculation_key=excluded.calculation_key,
  source_cadence=excluded.source_cadence,status=excluded.status,notes=excluded.notes,updated_at=now();

create or replace function hq.refresh_autorx_source_health()
returns integer
language plpgsql
security definer
set search_path=hq,public,pg_catalog
as $$
declare autorx_company_id uuid; autorx_shop_id uuid; affected integer:=0;
begin
  select id into autorx_company_id from hq.companies where slug='autorx';
  select id into autorx_shop_id from public.shops where slug='autorx-charlotte' and status='active' limit 1;
  if autorx_company_id is null or autorx_shop_id is null then raise exception 'AutoRx source mapping not found'; end if;

  update hq.data_sources d set row_count=x.row_count,first_observed_at=x.first_at,last_observed_at=x.last_at,
    freshness_days=case when x.last_at is null then null else greatest((current_date-x.last_at::date),0) end,
    status=case when x.row_count=0 then 'not_ready' when current_date-x.last_at::date>45 then 'stale' else 'ready' end,
    last_checked_at=now(),updated_at=now()
  from (select count(*)::bigint row_count,min(month_start)::timestamptz first_at,max(month_end)::timestamptz last_at from public.qb_monthly_summary where shop_id=autorx_shop_id) x
  where d.company_id=autorx_company_id and d.source_key='quickbooks_monthly';
  get diagnostics affected=row_count;

  update hq.data_sources d set row_count=x.row_count,first_observed_at=x.first_at,last_observed_at=x.last_at,
    freshness_days=case when x.last_at is null then null else greatest((current_date-x.last_at::date),0) end,
    status=case when x.row_count=0 then 'not_ready' when current_date-x.last_at::date>21 then 'stale' else 'ready' end,
    last_checked_at=now(),updated_at=now()
  from (select count(*)::bigint row_count,min(week_start)::timestamptz first_at,max(week_end)::timestamptz last_at from public.payroll_snapshots where shop_id=autorx_shop_id and status in ('approved','paid')) x
  where d.company_id=autorx_company_id and d.source_key='payroll_weekly';

  update hq.data_sources d set row_count=x.row_count,first_observed_at=x.first_at,last_observed_at=x.last_at,
    freshness_days=case when x.last_at is null then null else greatest((current_date-x.last_at::date),0) end,
    status=case when x.row_count=0 then 'not_ready' else 'partial' end,
    notes=case when x.row_count=0 then 'No connected AutoRx phone rows were found.' else 'Coverage begins '||to_char(x.first_at,'YYYY-MM-DD')||'; use as a partial operational signal until history matures.' end,
    last_checked_at=now(),updated_at=now()
  from (select count(*)::bigint row_count,min(started_at) first_at,max(started_at) last_at from public.phone_calls where shop_id=autorx_shop_id) x
  where d.company_id=autorx_company_id and d.source_key='phone_calls';

  update hq.data_sources d set row_count=x.row_count,first_observed_at=x.first_at,last_observed_at=x.last_at,
    freshness_days=case when x.last_at is null then null else greatest((current_date-x.last_at::date),0) end,
    status=case when x.row_count=0 then 'not_ready' else 'partial' end,last_checked_at=now(),updated_at=now()
  from (select count(*)::bigint row_count,min(created_at) first_at,max(created_at) last_at from public.sa_repair_orders where shop_id=autorx_shop_id) x
  where d.company_id=autorx_company_id and d.source_key='service_advisor';

  update hq.data_sources d set row_count=x.row_count,first_observed_at=x.first_at,last_observed_at=x.last_at,
    freshness_days=case when x.last_at is null then null else greatest((current_date-x.last_at::date),0) end,
    status=case when x.row_count=0 then 'not_ready' else 'partial' end,last_checked_at=now(),updated_at=now()
  from (select count(*)::bigint row_count,min(created_at) first_at,max(created_at) last_at from public.part_leakage where shop_id=autorx_shop_id) x
  where d.company_id=autorx_company_id and d.source_key='parts_leakage';
  return affected;
end $$;

create or replace function public.hq_refresh_autorx_source_health(p_user_id uuid)
returns jsonb language plpgsql security definer set search_path=hq,public,pg_catalog as $$
begin
  if not hq.is_active_owner(p_user_id) then raise exception 'Active HQ owner access required'; end if;
  perform hq.refresh_autorx_source_health();
  return jsonb_build_object('refreshedAt',now());
end $$;

create or replace function public.hq_sync_autorx_verified_metrics(p_user_id uuid)
returns jsonb language plpgsql security definer set search_path=hq,public,pg_catalog as $$
declare autorx_company_id uuid; autorx_shop_id uuid; sync_count integer:=0; current_count integer;
begin
  if not hq.is_active_owner(p_user_id) then raise exception 'Active HQ owner access required'; end if;
  select id into autorx_company_id from hq.companies where slug='autorx';
  select id into autorx_shop_id from public.shops where slug='autorx-charlotte' and status='active' limit 1;
  if autorx_company_id is null or autorx_shop_id is null then raise exception 'AutoRx source mapping not found'; end if;
  perform hq.refresh_autorx_source_health();

  insert into hq.metric_results(metric_id,period_start,period_end,actual,status,source_reference,is_automated,data_quality,source_updated_at,updated_at)
  select m.id,q.month_start,q.month_end,
    case m.name when 'Monthly sales' then q.total_income when 'Monthly gross profit' then q.gross_profit
      when 'Monthly gross margin' then case when q.total_income<>0 then round(q.gross_profit/q.total_income*100,2) end
      when 'Monthly payroll percentage' then case when q.total_income<>0 then round(q.payroll_expense/q.total_income*100,2) end end,
    'not_reported','public.qb_monthly_summary:'||q.id::text,true,'verified',q.synced_at,now()
  from public.qb_monthly_summary q
  join hq.metrics m on m.company_id=autorx_company_id and m.name in ('Monthly sales','Monthly gross profit','Monthly gross margin','Monthly payroll percentage')
  where q.shop_id=autorx_shop_id
  on conflict(metric_id,period_start,period_end) do update set actual=excluded.actual,source_reference=excluded.source_reference,
    is_automated=true,data_quality='verified',source_updated_at=excluded.source_updated_at,updated_at=now();
  get diagnostics current_count=row_count; sync_count:=sync_count+current_count;

  insert into hq.metric_results(metric_id,period_start,period_end,actual,status,source_reference,is_automated,data_quality,source_updated_at,updated_at)
  select m.id,p.week_start,p.week_end,p.grand_total,'not_reported','public.payroll_snapshots:'||p.id::text,true,'verified',coalesce(p.paid_at,p.approved_at,p.computed_at),now()
  from public.payroll_snapshots p
  join hq.metrics m on m.company_id=autorx_company_id and m.name='Weekly payroll cost'
  where p.shop_id=autorx_shop_id and p.status in ('approved','paid')
  on conflict(metric_id,period_start,period_end) do update set actual=excluded.actual,source_reference=excluded.source_reference,
    is_automated=true,data_quality='verified',source_updated_at=excluded.source_updated_at,updated_at=now();
  get diagnostics current_count=row_count; sync_count:=sync_count+current_count;

  insert into hq.metric_results(metric_id,period_start,period_end,actual,status,source_reference,is_automated,data_quality,source_updated_at,updated_at)
  select m.id,p.week_start,p.week_end,
    case m.name when 'Inbound answer rate' then case when p.inbound_count>0 then round(p.answered_count::numeric/p.inbound_count*100,2) end
      when 'Missed inbound calls' then p.missed_count end,
    'not_reported','public.phone_calls:weekly:'||p.week_start::text,true,'partial',p.last_at,now()
  from (
    select date_trunc('week',started_at)::date week_start,(date_trunc('week',started_at)::date+6) week_end,
      count(*) filter(where direction='inbound') inbound_count,
      count(*) filter(where direction='inbound' and answered_at is not null) answered_count,
      count(*) filter(where direction='inbound' and answered_at is null) missed_count,max(updated_at) last_at
    from public.phone_calls where shop_id=autorx_shop_id group by 1,2
  ) p
  join hq.metrics m on m.company_id=autorx_company_id and m.name in ('Inbound answer rate','Missed inbound calls')
  on conflict(metric_id,period_start,period_end) do update set actual=excluded.actual,source_reference=excluded.source_reference,
    is_automated=true,data_quality='partial',source_updated_at=excluded.source_updated_at,updated_at=now();
  get diagnostics current_count=row_count; sync_count:=sync_count+current_count;

  update hq.metric_automation_rules r set last_synced_at=now(),last_sync_count=(
    select count(*) from hq.metric_results mr where mr.metric_id=r.metric_id and mr.is_automated
  ),updated_at=now()
  where r.metric_id in (select id from hq.metrics where company_id=autorx_company_id) and r.status in ('ready','partial');
  insert into hq.audit_log(actor_user_id,company_id,action,entity_type,new_values)
  values(p_user_id,autorx_company_id,'sync','verified_metrics',jsonb_build_object('rowsAffected',sync_count,'syncedAt',now()));
  return jsonb_build_object('rowsAffected',sync_count,'syncedAt',now());
end $$;

create or replace function public.hq_get_scorecard_automation(p_user_id uuid)
returns jsonb language plpgsql stable security definer set search_path=hq,public,pg_catalog as $$
declare autorx_company_id uuid; result jsonb;
begin
  if not hq.is_active_owner(p_user_id) then raise exception 'Active HQ owner access required'; end if;
  select id into autorx_company_id from hq.companies where slug='autorx';
  select jsonb_build_object(
    'summary',jsonb_build_object(
      'readySources',(select count(*) from hq.data_sources where company_id=autorx_company_id and status='ready'),
      'partialSources',(select count(*) from hq.data_sources where company_id=autorx_company_id and status='partial'),
      'notReadySources',(select count(*) from hq.data_sources where company_id=autorx_company_id and status in ('not_ready','stale')),
      'automatedMetrics',(select count(*) from hq.metric_automation_rules r join hq.metrics m on m.id=r.metric_id where m.company_id=autorx_company_id and r.status in ('ready','partial')),
      'verifiedResults',(select count(*) from hq.metric_results mr join hq.metrics m on m.id=mr.metric_id where m.company_id=autorx_company_id and mr.is_automated and mr.data_quality='verified')
    ),
    'sources',coalesce((select jsonb_agg(jsonb_build_object(
      'id',id,'sourceKey',source_key,'label',label,'sourceTable',source_table,'status',status,'rowCount',row_count,
      'firstObservedAt',first_observed_at,'lastObservedAt',last_observed_at,'freshnessDays',freshness_days,
      'notes',notes,'lastCheckedAt',last_checked_at
    ) order by case status when 'ready' then 0 when 'partial' then 1 when 'stale' then 2 else 3 end,label)
    from hq.data_sources where company_id=autorx_company_id),'[]'::jsonb),
    'rules',coalesce((select jsonb_agg(jsonb_build_object(
      'id',r.id,'metricId',m.id,'metricName',m.name,'unit',m.unit,'sourceKey',r.source_key,
      'calculationKey',r.calculation_key,'sourceCadence',r.source_cadence,'status',r.status,
      'notes',r.notes,'lastSyncedAt',r.last_synced_at,'lastSyncCount',r.last_sync_count
    ) order by m.name) from hq.metric_automation_rules r join hq.metrics m on m.id=r.metric_id where m.company_id=autorx_company_id),'[]'::jsonb),
    'latestResults',coalesce((select jsonb_agg(x.row_data order by x.metric_name) from (
      select distinct on (m.id) m.name metric_name,jsonb_build_object(
        'id',mr.id,'metricId',m.id,'metricName',m.name,'unit',m.unit,'periodStart',mr.period_start,
        'periodEnd',mr.period_end,'actual',mr.actual,'target',mr.target,'status',mr.status,
        'dataQuality',mr.data_quality,'sourceReference',mr.source_reference,'sourceUpdatedAt',mr.source_updated_at
      ) row_data
      from hq.metrics m join hq.metric_results mr on mr.metric_id=m.id
      where m.company_id=autorx_company_id and mr.is_automated
      order by m.id,mr.period_end desc,mr.updated_at desc
    ) x),'[]'::jsonb)
  ) into result;
  return result;
end $$;

revoke all on function public.hq_refresh_autorx_source_health(uuid) from public,anon,authenticated;
revoke all on function public.hq_sync_autorx_verified_metrics(uuid) from public,anon,authenticated;
revoke all on function public.hq_get_scorecard_automation(uuid) from public,anon,authenticated;
grant execute on function public.hq_refresh_autorx_source_health(uuid) to service_role;
grant execute on function public.hq_sync_autorx_verified_metrics(uuid) to service_role;
grant execute on function public.hq_get_scorecard_automation(uuid) to service_role;
