alter table hq.profiles
  add column if not exists mfa_required boolean not null default false,
  add column if not exists mfa_enrolled_at timestamptz,
  add column if not exists last_access_review_at timestamptz;

create table if not exists hq.access_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  full_name text not null,
  role hq.role not null,
  token_hash text not null unique,
  status text not null default 'pending' check (status in ('pending','accepted','revoked','expired','error')),
  invited_by uuid not null references hq.profiles(id),
  auth_user_id uuid,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists hq.invitation_companies (
  invitation_id uuid not null references hq.access_invitations(id) on delete cascade,
  company_id uuid not null references hq.companies(id) on delete cascade,
  role hq.role not null,
  created_at timestamptz not null default now(),
  primary key(invitation_id,company_id)
);

create index if not exists access_invitations_email_status_idx on hq.access_invitations(lower(email),status);
create index if not exists access_invitations_expires_idx on hq.access_invitations(status,expires_at);
alter table hq.access_invitations enable row level security;
alter table hq.invitation_companies enable row level security;
revoke all on hq.access_invitations,hq.invitation_companies from public,anon,authenticated;
grant all on hq.access_invitations,hq.invitation_companies to service_role;

create or replace function public.hq_create_access_invitation(
  p_actor_user_id uuid,p_token_hash text,p_email text,p_full_name text,p_role text,p_company_ids uuid[],p_expires_at timestamptz
)
returns jsonb language plpgsql security definer set search_path=hq,public,auth,pg_catalog as $$
declare invitation hq.access_invitations%rowtype; target_role hq.role; company_id uuid;
begin
  if not hq.is_active_owner(p_actor_user_id) then raise exception 'Active HQ owner access required'; end if;
  if lower(trim(p_email)) !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then raise exception 'A valid email is required'; end if;
  if length(trim(p_full_name))<2 then raise exception 'Full name is required'; end if;
  if p_role not in ('group_executive','company_operator','department_manager','finance_reviewer','auditor') then raise exception 'Invalid invitation role'; end if;
  if p_company_ids is null or cardinality(p_company_ids)=0 then raise exception 'At least one company is required'; end if;
  if p_expires_at<=now() or p_expires_at>now()+interval '30 days' then raise exception 'Invitation expiration must be within 30 days'; end if;
  if exists(select 1 from hq.profiles where lower(email)=lower(trim(p_email)) and is_active) then raise exception 'An active HQ user already has this email'; end if;
  target_role:=p_role::hq.role;
  update hq.access_invitations set status='revoked',revoked_at=now(),updated_at=now() where lower(email)=lower(trim(p_email)) and status='pending';
  insert into hq.access_invitations(email,full_name,role,token_hash,status,invited_by,expires_at)
  values(lower(trim(p_email)),trim(p_full_name),target_role,p_token_hash,'pending',p_actor_user_id,p_expires_at) returning * into invitation;
  foreach company_id in array p_company_ids loop
    if not exists(select 1 from hq.companies where id=company_id and is_active) then raise exception 'Invalid or inactive company access'; end if;
    insert into hq.invitation_companies(invitation_id,company_id,role) values(invitation.id,company_id,target_role);
  end loop;
  insert into hq.audit_log(actor_user_id,action,entity_type,entity_id,new_values)
  values(p_actor_user_id,'create','access_invitation',invitation.id::text,jsonb_build_object('email',invitation.email,'role',invitation.role,'companyIds',p_company_ids,'expiresAt',invitation.expires_at));
  return jsonb_build_object('id',invitation.id,'email',invitation.email,'expiresAt',invitation.expires_at);
end $$;

create or replace function public.hq_get_invitation_preview(p_token_hash text)
returns jsonb language plpgsql stable security definer set search_path=hq,public,pg_catalog as $$
declare invitation hq.access_invitations%rowtype;
begin
  select * into invitation from hq.access_invitations where token_hash=p_token_hash and status='pending' and expires_at>now();
  if invitation.id is null then return null; end if;
  return jsonb_build_object('id',invitation.id,'email',invitation.email,'fullName',invitation.full_name,'role',invitation.role,'expiresAt',invitation.expires_at,
    'companies',coalesce((select jsonb_agg(jsonb_build_object('id',c.id,'name',c.name,'slug',c.slug) order by c.name)
      from hq.invitation_companies ic join hq.companies c on c.id=ic.company_id where ic.invitation_id=invitation.id),'[]'::jsonb));
end $$;

create or replace function public.hq_accept_access_invitation(p_token_hash text,p_auth_user_id uuid)
returns jsonb language plpgsql security definer set search_path=hq,public,auth,pg_catalog as $$
declare invitation hq.access_invitations%rowtype; auth_email text;
begin
  select * into invitation from hq.access_invitations where token_hash=p_token_hash for update;
  if invitation.id is null or invitation.status<>'pending' then raise exception 'Invitation is not available'; end if;
  if invitation.expires_at<=now() then update hq.access_invitations set status='expired',updated_at=now() where id=invitation.id; raise exception 'Invitation has expired'; end if;
  select lower(email) into auth_email from auth.users where id=p_auth_user_id and deleted_at is null;
  if auth_email is null or auth_email<>lower(invitation.email) then raise exception 'Authenticated email does not match invitation'; end if;
  insert into hq.profiles(id,full_name,email,role,is_active,updated_at)
  values(p_auth_user_id,invitation.full_name,invitation.email,invitation.role,true,now())
  on conflict(id) do update set full_name=excluded.full_name,email=excluded.email,role=excluded.role,is_active=true,updated_at=now();
  delete from hq.company_access where user_id=p_auth_user_id;
  insert into hq.company_access(user_id,company_id,role)
  select p_auth_user_id,company_id,role from hq.invitation_companies where invitation_id=invitation.id;
  update hq.access_invitations set status='accepted',auth_user_id=p_auth_user_id,accepted_at=now(),updated_at=now() where id=invitation.id;
  insert into hq.audit_log(actor_user_id,action,entity_type,entity_id,new_values)
  values(p_auth_user_id,'accept','access_invitation',invitation.id::text,jsonb_build_object('email',invitation.email,'role',invitation.role));
  return jsonb_build_object('userId',p_auth_user_id,'email',invitation.email,'fullName',invitation.full_name,'role',invitation.role,'isActive',true);
end $$;

create or replace function public.hq_revoke_access_invitation(p_actor_user_id uuid,p_invitation_id uuid)
returns jsonb language plpgsql security definer set search_path=hq,public,pg_catalog as $$
declare invitation hq.access_invitations%rowtype;
begin
  if not hq.is_active_owner(p_actor_user_id) then raise exception 'Active HQ owner access required'; end if;
  select * into invitation from hq.access_invitations where id=p_invitation_id for update;
  if invitation.id is null then raise exception 'Invitation not found'; end if;
  if invitation.status='accepted' then raise exception 'Accepted invitations are managed as users'; end if;
  update hq.access_invitations set status='revoked',revoked_at=now(),updated_at=now() where id=invitation.id;
  insert into hq.audit_log(actor_user_id,action,entity_type,entity_id,old_values,new_values)
  values(p_actor_user_id,'revoke','access_invitation',invitation.id::text,to_jsonb(invitation),jsonb_build_object('status','revoked'));
  return jsonb_build_object('id',invitation.id,'status','revoked');
end $$;

create or replace function public.hq_update_user_access(
  p_actor_user_id uuid,p_target_user_id uuid,p_role text,p_is_active boolean,p_company_ids uuid[],p_mfa_required boolean
)
returns jsonb language plpgsql security definer set search_path=hq,public,pg_catalog as $$
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

create or replace function public.hq_get_access_audit_center(p_user_id uuid)
returns jsonb language plpgsql stable security definer set search_path=hq,public,auth,pg_catalog as $$
declare result jsonb;
begin
  if not hq.is_active_owner(p_user_id) then raise exception 'Active HQ owner access required'; end if;
  select jsonb_build_object(
    'summary',jsonb_build_object(
      'activeUsers',(select count(*) from hq.profiles where is_active),
      'inactiveUsers',(select count(*) from hq.profiles where not is_active),
      'pendingInvitations',(select count(*) from hq.access_invitations where status='pending' and expires_at>now()),
      'mfaEnrolled',(select count(distinct p.id) from hq.profiles p join auth.mfa_factors f on f.user_id=p.id where f.status='verified'),
      'mfaRequiredNotEnrolled',(select count(*) from hq.profiles p where p.is_active and p.mfa_required and not exists(select 1 from auth.mfa_factors f where f.user_id=p.id and f.status='verified')),
      'auditEvents',(select count(*) from hq.audit_log)
    ),
    'companies',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name,'slug',slug) order by name) from hq.companies where is_active),'[]'::jsonb),
    'users',coalesce((select jsonb_agg(jsonb_build_object(
      'id',p.id,'fullName',p.full_name,'email',p.email,'role',p.role,'isActive',p.is_active,'mfaRequired',p.mfa_required,
      'mfaEnrolled',exists(select 1 from auth.mfa_factors f where f.user_id=p.id and f.status='verified'),'mfaEnrolledAt',p.mfa_enrolled_at,
      'emailConfirmedAt',u.email_confirmed_at,'lastSignInAt',u.last_sign_in_at,'createdAt',p.created_at,'updatedAt',p.updated_at,
      'lastAccessReviewAt',p.last_access_review_at,'companies',coalesce((select jsonb_agg(jsonb_build_object('id',c.id,'name',c.name,'slug',c.slug,'role',ca.role) order by c.name)
        from hq.company_access ca join hq.companies c on c.id=ca.company_id where ca.user_id=p.id),'[]'::jsonb))
      order by case p.role when 'owner' then 0 when 'group_executive' then 1 else 2 end,p.full_name)
      from hq.profiles p left join auth.users u on u.id=p.id),'[]'::jsonb),
    'invitations',coalesce((select jsonb_agg(jsonb_build_object(
      'id',i.id,'email',i.email,'fullName',i.full_name,'role',i.role,'status',case when i.status='pending' and i.expires_at<=now() then 'expired' else i.status end,
      'expiresAt',i.expires_at,'acceptedAt',i.accepted_at,'revokedAt',i.revoked_at,'createdAt',i.created_at,
      'companies',coalesce((select jsonb_agg(jsonb_build_object('id',c.id,'name',c.name,'slug',c.slug) order by c.name)
        from hq.invitation_companies ic join hq.companies c on c.id=ic.company_id where ic.invitation_id=i.id),'[]'::jsonb)) order by i.created_at desc)
      from hq.access_invitations i),'[]'::jsonb),
    'auditEvents',coalesce((select jsonb_agg(jsonb_build_object(
      'id',a.id,'actorUserId',a.actor_user_id,'actorName',p.full_name,'actorEmail',p.email,'companyId',a.company_id,'companyName',c.name,
      'action',a.action,'entityType',a.entity_type,'entityId',a.entity_id,'oldValues',a.old_values,'newValues',a.new_values,'createdAt',a.created_at
    ) order by a.created_at desc) from (select * from hq.audit_log order by created_at desc limit 250) a
      left join hq.profiles p on p.id=a.actor_user_id left join hq.companies c on c.id=a.company_id),'[]'::jsonb)
  ) into result;
  return result;
end $$;

create or replace function public.hq_get_user_workspace(p_user_id uuid)
returns jsonb language plpgsql stable security definer set search_path=hq,public,pg_catalog as $$
declare profile hq.profiles%rowtype; result jsonb;
begin
  select * into profile from hq.profiles where id=p_user_id and is_active;
  if profile.id is null then raise exception 'Active HQ access required'; end if;
  select jsonb_build_object(
    'profile',jsonb_build_object('id',profile.id,'fullName',profile.full_name,'email',profile.email,'role',profile.role,'mfaRequired',profile.mfa_required),
    'companies',coalesce((select jsonb_agg(jsonb_build_object(
      'id',c.id,'name',c.name,'slug',c.slug,'cashRole',c.cash_role,'stage',c.stage,'accessRole',ca.role,
      'plan',case when p.id is null then null else jsonb_build_object('status',p.status,'strategicThesis',p.strategic_thesis,'twelveMonthOutcome',p.twelve_month_outcome,'currentConstraint',p.current_constraint,'reviewCadence',p.review_cadence,'nextReviewDate',p.next_review_date) end,
      'milestones',coalesce((select jsonb_agg(jsonb_build_object('id',m.id,'code',m.code,'title',m.title,'outcome',m.outcome,'status',m.status,'ownerLabel',m.owner_label,'targetDate',m.target_date,'nextAction',m.next_action) order by m.position) from hq.company_milestones m where m.company_id=c.id),'[]'::jsonb),
      'seats',coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'title',s.title,'seatType',s.seat_type,'primaryResult',s.primary_result,'mandate',s.mandate,'currentOwner',s.current_owner_label,'appointmentStatus',s.appointment_status,'nextReviewDate',s.next_review_date) order by s.seat_type,s.title) from hq.operator_seats s where s.company_id=c.id and s.is_active),'[]'::jsonb),
      'controls',coalesce((select jsonb_agg(jsonb_build_object('id',x.id,'title',x.title,'category',x.category,'objective',x.objective,'frequency',x.frequency,'ownerLabel',x.owner_label,'status',x.status,'nextDueDate',x.next_due_date,'evidenceRequired',x.evidence_required) order by x.title) from hq.controls x where x.company_id=c.id and x.status<>'retired'),'[]'::jsonb)
    ) order by c.name) from hq.company_access ca join hq.companies c on c.id=ca.company_id
      left join hq.company_operating_plans p on p.company_id=c.id where ca.user_id=profile.id and c.is_active),'[]'::jsonb)
  ) into result;
  return result;
end $$;

revoke all on function public.hq_create_access_invitation(uuid,text,text,text,text,uuid[],timestamptz) from public,anon,authenticated;
revoke all on function public.hq_get_invitation_preview(text) from public,anon,authenticated;
revoke all on function public.hq_accept_access_invitation(text,uuid) from public,anon,authenticated;
revoke all on function public.hq_revoke_access_invitation(uuid,uuid) from public,anon,authenticated;
revoke all on function public.hq_update_user_access(uuid,uuid,text,boolean,uuid[],boolean) from public,anon,authenticated;
revoke all on function public.hq_get_access_audit_center(uuid) from public,anon,authenticated;
revoke all on function public.hq_get_user_workspace(uuid) from public,anon,authenticated;
grant execute on function public.hq_create_access_invitation(uuid,text,text,text,text,uuid[],timestamptz) to service_role;
grant execute on function public.hq_get_invitation_preview(text) to service_role;
grant execute on function public.hq_accept_access_invitation(text,uuid) to service_role;
grant execute on function public.hq_revoke_access_invitation(uuid,uuid) to service_role;
grant execute on function public.hq_update_user_access(uuid,uuid,text,boolean,uuid[],boolean) to service_role;
grant execute on function public.hq_get_access_audit_center(uuid) to service_role;
grant execute on function public.hq_get_user_workspace(uuid) to service_role;
