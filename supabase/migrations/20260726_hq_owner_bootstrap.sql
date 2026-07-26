-- One-time owner activation for Osman Ventures HQ.
-- The hq schema remains inaccessible to anon/authenticated roles. These RPCs live
-- in public only so trusted server routes can call them through PostgREST with
-- the service-role key. They are not executable by browser roles.

create or replace function public.hq_bootstrap_status()
returns jsonb
language sql
stable
security definer
set search_path = hq, public, pg_catalog
as $$
  select jsonb_build_object(
    'available', not exists (
      select 1 from hq.profiles where role = 'owner' and is_active = true
    ),
    'profile_count', (select count(*) from hq.profiles)
  );
$$;

create or replace function public.hq_bootstrap_owner(
  p_user_id uuid,
  p_full_name text,
  p_email text
)
returns jsonb
language plpgsql
security definer
set search_path = hq, public, pg_catalog
as $$
declare
  normalized_email text := lower(trim(p_email));
begin
  perform pg_advisory_xact_lock(hashtext('osman_ventures_hq_owner_bootstrap'));

  if exists (
    select 1 from hq.profiles where role = 'owner' and is_active = true
  ) then
    raise exception 'HQ owner activation has already been completed';
  end if;

  if p_user_id is null or length(trim(p_full_name)) < 2 or normalized_email = '' then
    raise exception 'Invalid owner profile data';
  end if;

  insert into hq.profiles (id, full_name, email, role, is_active)
  values (p_user_id, trim(p_full_name), normalized_email, 'owner', true);

  insert into hq.company_access (user_id, company_id, role)
  select p_user_id, id, 'owner'::hq.role
  from hq.companies
  where is_active = true
  on conflict (user_id, company_id) do update set role = excluded.role;

  insert into hq.audit_log (
    actor_user_id,
    action,
    entity_type,
    entity_id,
    new_values
  )
  values (
    p_user_id,
    'bootstrap_owner',
    'profile',
    p_user_id::text,
    jsonb_build_object('email', normalized_email, 'role', 'owner')
  );

  return jsonb_build_object(
    'user_id', p_user_id,
    'email', normalized_email,
    'full_name', trim(p_full_name),
    'role', 'owner'
  );
end;
$$;

create or replace function public.hq_get_active_profile(p_user_id uuid)
returns table (
  user_id uuid,
  full_name text,
  email text,
  role text,
  is_active boolean
)
language sql
stable
security definer
set search_path = hq, public, pg_catalog
as $$
  select id, profiles.full_name, profiles.email, profiles.role::text, profiles.is_active
  from hq.profiles
  where id = p_user_id and profiles.is_active = true
  limit 1;
$$;

revoke all on function public.hq_bootstrap_status() from public, anon, authenticated;
revoke all on function public.hq_bootstrap_owner(uuid, text, text) from public, anon, authenticated;
revoke all on function public.hq_get_active_profile(uuid) from public, anon, authenticated;

grant execute on function public.hq_bootstrap_status() to service_role;
grant execute on function public.hq_bootstrap_owner(uuid, text, text) to service_role;
grant execute on function public.hq_get_active_profile(uuid) to service_role;
