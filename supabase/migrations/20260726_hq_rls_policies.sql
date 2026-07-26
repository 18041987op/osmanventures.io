-- Server-only access boundary for Osman Ventures HQ on Supabase B.
-- The hq schema is intentionally not exposed directly to browser clients.
-- These functions are callable only with the service_role key from trusted
-- Next.js server routes.

create or replace function public.ov_hq_login_profile(target_user_id uuid)
returns table (
  user_id uuid,
  email text,
  full_name text,
  role text,
  is_active boolean
)
language sql
stable
security definer
set search_path = hq, auth, pg_catalog
as $$
  select p.id, p.email, p.full_name, p.role::text, p.is_active
  from hq.profiles p
  where p.id = target_user_id
  limit 1;
$$;

create or replace function public.ov_hq_bootstrap_owner(
  target_user_id uuid,
  target_email text,
  target_full_name text
)
returns void
language plpgsql
security definer
set search_path = hq, auth, pg_catalog
as $$
begin
  if not exists (select 1 from auth.users where id = target_user_id) then
    raise exception 'Auth user does not exist';
  end if;

  if exists (
    select 1 from hq.profiles
    where role = 'owner'::hq.role and id <> target_user_id and is_active = true
  ) then
    raise exception 'An active HQ owner already exists';
  end if;

  insert into hq.profiles (id, email, full_name, role, is_active)
  values (
    target_user_id,
    lower(trim(target_email)),
    trim(target_full_name),
    'owner'::hq.role,
    true
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    role = 'owner'::hq.role,
    is_active = true,
    updated_at = now();

  insert into hq.company_access (user_id, company_id, role)
  select target_user_id, id, 'owner'::hq.role
  from hq.companies
  on conflict (user_id, company_id) do update set role = 'owner'::hq.role;

  insert into hq.audit_log (
    actor_user_id, action, entity_type, entity_id, new_values
  ) values (
    target_user_id,
    'owner_bootstrapped',
    'profile',
    target_user_id::text,
    jsonb_build_object('email', lower(trim(target_email)), 'role', 'owner')
  );
end;
$$;

create or replace function public.ov_hq_portfolio_snapshot()
returns jsonb
language sql
stable
security definer
set search_path = hq, pg_catalog
as $$
  select jsonb_build_object(
    'companies', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', c.id,
          'name', c.name,
          'slug', c.slug,
          'stage', c.stage::text,
          'cashRole', c.cash_role,
          'description', c.description,
          'priority', c.owner_priority,
          'operator', coalesce(s.title, 'Not assigned')
        ) order by
          case c.cash_role when 'cash_engine' then 1 when 'asset' then 2 else 3 end,
          c.name
      )
      from hq.companies c
      left join lateral (
        select title
        from hq.operator_seats os
        where os.company_id = c.id and os.is_active = true
        order by case when os.seat_type = 'company_operator' then 0 else 1 end, os.created_at
        limit 1
      ) s on true
      where c.is_active = true
    ), '[]'::jsonb),
    'autorxMetrics', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', m.id,
          'name', m.name,
          'definition', m.definition,
          'unit', m.unit,
          'sourceSystem', m.source_system,
          'cadence', m.cadence,
          'direction', m.direction,
          'ownerControl', m.is_owner_control
        ) order by m.is_owner_control desc, m.name
      )
      from hq.metrics m
      join hq.companies c on c.id = m.company_id
      where c.slug = 'autorx' and m.is_active = true
    ), '[]'::jsonb),
    'generatedAt', now()
  );
$$;

create or replace function public.ov_hq_record_audit(
  target_actor uuid,
  target_company uuid,
  target_action text,
  target_entity_type text,
  target_entity_id text,
  target_old_values jsonb default null,
  target_new_values jsonb default null
)
returns bigint
language plpgsql
security definer
set search_path = hq, pg_catalog
as $$
declare
  inserted_id bigint;
begin
  insert into hq.audit_log (
    actor_user_id, company_id, action, entity_type, entity_id, old_values, new_values
  ) values (
    target_actor,
    target_company,
    target_action,
    target_entity_type,
    target_entity_id,
    target_old_values,
    target_new_values
  ) returning id into inserted_id;
  return inserted_id;
end;
$$;

revoke all on function public.ov_hq_login_profile(uuid) from public, anon, authenticated;
revoke all on function public.ov_hq_bootstrap_owner(uuid, text, text) from public, anon, authenticated;
revoke all on function public.ov_hq_portfolio_snapshot() from public, anon, authenticated;
revoke all on function public.ov_hq_record_audit(uuid, uuid, text, text, text, jsonb, jsonb) from public, anon, authenticated;

grant execute on function public.ov_hq_login_profile(uuid) to service_role;
grant execute on function public.ov_hq_bootstrap_owner(uuid, text, text) to service_role;
grant execute on function public.ov_hq_portfolio_snapshot() to service_role;
grant execute on function public.ov_hq_record_audit(uuid, uuid, text, text, text, jsonb, jsonb) to service_role;
