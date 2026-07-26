create or replace function public.hq_get_executive_dashboard(p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = hq, public, pg_catalog
as $$
declare result jsonb;
begin
  if not hq.is_active_owner(p_user_id) then
    raise exception 'Active HQ owner access required';
  end if;

  select jsonb_build_object(
    'companies', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', c.id, 'name', c.name, 'slug', c.slug,
        'stage', c.stage::text, 'cashRole', c.cash_role,
        'description', c.description, 'ownerPriority', c.owner_priority,
        'isActive', c.is_active
      ) order by c.created_at)
      from hq.companies c where c.is_active = true
    ), '[]'::jsonb),
    'summary', jsonb_build_object(
      'cashEngines', (select count(*) from hq.companies where is_active and cash_role = 'cash_engine'),
      'operatorsInstalled', (select count(*) from hq.operator_seats where is_active and seat_type = 'company_operator' and incumbent_user_id is not null),
      'companiesGoverned', (select count(*) from hq.companies where is_active),
      'openCriticalDependencies', (
        select count(*) from hq.dependencies d join hq.companies c on c.id = d.company_id
        where c.slug = 'autorx' and d.risk_level = 'critical' and d.delegation_status <> 'tested'
      )
    ),
    'autorx', jsonb_build_object(
      'readiness', coalesce((
        select round(sum(case status when 'complete' then 20 when 'in_progress' then 10 else 0 end))::int
        from hq.transition_gates g join hq.companies c on c.id = g.company_id
        where c.slug = 'autorx'
      ), 0),
      'gatesComplete', (select count(*) from hq.transition_gates g join hq.companies c on c.id = g.company_id where c.slug = 'autorx' and g.status = 'complete'),
      'gatesTotal', (select count(*) from hq.transition_gates g join hq.companies c on c.id = g.company_id where c.slug = 'autorx'),
      'dependenciesTotal', (select count(*) from hq.dependencies d join hq.companies c on c.id = d.company_id where c.slug = 'autorx'),
      'dependenciesStarted', (select count(*) from hq.dependencies d join hq.companies c on c.id = d.company_id where c.slug = 'autorx' and (d.documentation_status <> 'missing' or d.delegation_status <> 'not_started')),
      'metricsDefined', (select count(*) from hq.metrics m join hq.companies c on c.id = m.company_id where c.slug = 'autorx' and m.is_active),
      'absenceTestsTotal', (select count(*) from hq.absence_test_templates t join hq.companies c on c.id=t.company_id where c.slug='autorx' and t.is_active),
      'absenceTestsPassed', (
        select count(*) from hq.absence_test_templates t
        join hq.companies c on c.id=t.company_id
        where c.slug='autorx' and t.is_active and (
          select r.status from hq.absence_test_runs r where r.template_id=t.id order by r.created_at desc limit 1
        )='passed'
      ),
      'absenceTestsActive', (
        select count(*) from hq.absence_test_runs r
        join hq.absence_test_templates t on t.id=r.template_id
        join hq.companies c on c.id=t.company_id
        where c.slug='autorx' and r.status='active'
      )
    )
  ) into result;
  return result;
end;
$$;

revoke all on function public.hq_get_executive_dashboard(uuid) from public, anon, authenticated;
grant execute on function public.hq_get_executive_dashboard(uuid) to service_role;
