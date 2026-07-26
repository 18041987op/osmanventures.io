create or replace function public.hq_get_login_security(p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path=hq,public,auth,pg_catalog
as $$
declare profile hq.profiles%rowtype;
begin
  select * into profile from hq.profiles where id=p_user_id and is_active;
  if profile.id is null then raise exception 'Active HQ access required'; end if;
  return jsonb_build_object(
    'mfaRequired',profile.mfa_required,
    'mfaEnrolled',exists(select 1 from auth.mfa_factors f where f.user_id=profile.id and f.status='verified'),
    'factorId',(select f.id from auth.mfa_factors f where f.user_id=profile.id and f.status='verified' order by f.created_at limit 1)
  );
end $$;

create or replace function public.hq_get_mfa_status(p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path=hq,public,auth,pg_catalog
as $$
declare profile hq.profiles%rowtype;
begin
  select * into profile from hq.profiles where id=p_user_id and is_active;
  if profile.id is null then raise exception 'Active HQ access required'; end if;
  return jsonb_build_object(
    'userId',profile.id,'email',profile.email,'fullName',profile.full_name,'role',profile.role,
    'mfaRequired',profile.mfa_required,'mfaEnrolledAt',profile.mfa_enrolled_at,
    'factors',coalesce((select jsonb_agg(jsonb_build_object(
      'id',f.id,'factorType',f.factor_type,'status',f.status,'friendlyName',f.friendly_name,
      'createdAt',f.created_at,'updatedAt',f.updated_at
    ) order by f.created_at) from auth.mfa_factors f where f.user_id=profile.id),'[]'::jsonb)
  );
end $$;

create or replace function public.hq_mark_mfa_enrolled(p_user_id uuid,p_factor_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=hq,public,auth,pg_catalog
as $$
declare profile hq.profiles%rowtype;
begin
  select * into profile from hq.profiles where id=p_user_id and is_active for update;
  if profile.id is null then raise exception 'Active HQ access required'; end if;
  if not exists(select 1 from auth.mfa_factors f where f.id=p_factor_id and f.user_id=p_user_id and f.status='verified') then
    raise exception 'Verified MFA factor not found';
  end if;
  update hq.profiles set mfa_required=true,mfa_enrolled_at=coalesce(mfa_enrolled_at,now()),updated_at=now() where id=p_user_id;
  insert into hq.audit_log(actor_user_id,action,entity_type,entity_id,new_values)
  values(p_user_id,'enroll','mfa_factor',p_factor_id::text,jsonb_build_object('mfaRequired',true,'enrolledAt',now()));
  return jsonb_build_object('userId',p_user_id,'mfaRequired',true,'factorId',p_factor_id);
end $$;

create or replace function public.hq_update_user_access(
  p_actor_user_id uuid,p_target_user_id uuid,p_role text,p_is_active boolean,p_company_ids uuid[],p_mfa_required boolean
)
returns jsonb
language plpgsql
security definer
set search_path=hq,public,auth,pg_catalog
as $$
declare old_profile hq.profiles%rowtype; new_profile hq.profiles%rowtype; target_role hq.role; company_id uuid;
begin
  if not hq.is_active_owner(p_actor_user_id) then raise exception 'Active HQ owner access required'; end if;
  if p_role not in ('owner','group_executive','company_operator','department_manager','finance_reviewer','auditor') then raise exception 'Invalid HQ role'; end if;
  select * into old_profile from hq.profiles where id=p_target_user_id for update;
  if old_profile.id is null then raise exception 'HQ user not found'; end if;
  if old_profile.role='owner' and (not p_is_active or p_role<>'owner') and (select count(*) from hq.profiles where role='owner' and is_active and id<>p_target_user_id)=0 then
    raise exception 'The sole active owner cannot be deactivated or demoted';
  end if;
  if p_role<>'owner' and (p_company_ids is null or cardinality(p_company_ids)=0) then raise exception 'At least one company is required for a non-owner user'; end if;
  if p_mfa_required and not exists(select 1 from auth.mfa_factors f where f.user_id=p_target_user_id and f.status='verified') then
    raise exception 'This user must enroll a verified MFA factor before MFA can be required';
  end if;
  target_role:=p_role::hq.role;
  update hq.profiles set role=target_role,is_active=p_is_active,mfa_required=coalesce(p_mfa_required,false),last_access_review_at=now(),updated_at=now()
  where id=p_target_user_id returning * into new_profile;
  delete from hq.company_access where user_id=p_target_user_id;
  if target_role='owner' then
    insert into hq.company_access(user_id,company_id,role) select p_target_user_id,id,'owner'::hq.role from hq.companies where is_active;
  else
    foreach company_id in array p_company_ids loop
      if not exists(select 1 from hq.companies where id=company_id and is_active) then raise exception 'Invalid company access'; end if;
      insert into hq.company_access(user_id,company_id,role) values(p_target_user_id,company_id,target_role);
    end loop;
  end if;
  insert into hq.audit_log(actor_user_id,action,entity_type,entity_id,old_values,new_values)
  values(p_actor_user_id,'update','user_access',p_target_user_id::text,to_jsonb(old_profile),to_jsonb(new_profile));
  return jsonb_build_object('userId',new_profile.id,'role',new_profile.role,'isActive',new_profile.is_active,'mfaRequired',new_profile.mfa_required);
end $$;

revoke all on function public.hq_get_login_security(uuid) from public,anon,authenticated;
revoke all on function public.hq_get_mfa_status(uuid) from public,anon,authenticated;
revoke all on function public.hq_mark_mfa_enrolled(uuid,uuid) from public,anon,authenticated;
grant execute on function public.hq_get_login_security(uuid) to service_role;
grant execute on function public.hq_get_mfa_status(uuid) to service_role;
grant execute on function public.hq_mark_mfa_enrolled(uuid,uuid) to service_role;
