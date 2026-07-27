create or replace function public.hq_get_action_center(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=hq,public,pg_catalog
as $$
declare result jsonb;
begin
  if not hq.is_active_owner(p_user_id) then
    raise exception 'Active HQ owner access required';
  end if;

  perform public.hq_sync_action_items(p_user_id);

  select jsonb_build_object(
    'summary',jsonb_build_object(
      'open',(select count(*) from hq.action_items where status in ('open','in_progress','blocked')),
      'critical',(select count(*) from hq.action_items where status in ('open','in_progress','blocked') and priority='critical'),
      'blocked',(select count(*) from hq.action_items where status='blocked'),
      'overdue',(select count(*) from hq.action_items where status in ('open','in_progress','blocked') and due_date<current_date),
      'dueSoon',(select count(*) from hq.action_items where status in ('open','in_progress','blocked') and due_date between current_date and current_date+7),
      'completed',(select count(*) from hq.action_items where status='done'),
      'systemOpen',(select count(*) from hq.action_items where system_key is not null and status in ('open','in_progress','blocked')),
      'systemResolved',(select count(*) from hq.action_items where system_key is not null and status='done')
    ),
    'companies',coalesce((
      select jsonb_agg(jsonb_build_object('id',id,'name',name,'slug',slug) order by name)
      from hq.companies where is_active
    ),'[]'::jsonb),
    'actions',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',a.id,'companyId',a.company_id,'companyName',c.name,'companySlug',c.slug,
        'systemKey',a.system_key,'title',a.title,'description',a.description,'category',a.category,
        'priority',a.priority,'status',a.status,'ownerLabel',a.owner_label,'dueDate',a.due_date,
        'sourceType',a.source_type,'sourceId',a.source_id,'sourcePath',a.source_path,
        'evidenceRequired',a.evidence_required,'evidenceNotes',a.evidence_notes,'blocker',a.blocker,
        'completedAt',a.completed_at,'createdAt',a.created_at,'updatedAt',a.updated_at
      ) order by
        case a.status when 'blocked' then 0 when 'open' then 1 when 'in_progress' then 2 when 'done' then 3 else 4 end,
        case a.priority when 'critical' then 0 when 'high' then 1 when 'medium' then 2 else 3 end,
        a.due_date nulls last,a.created_at)
      from hq.action_items a
      left join hq.companies c on c.id=a.company_id
    ),'[]'::jsonb)
  ) into result;

  return result;
end;
$$;

create or replace function public.hq_create_action_item(
  p_actor_user_id uuid,
  p_company_id uuid,
  p_title text,
  p_description text,
  p_category text,
  p_priority text,
  p_owner_label text,
  p_due_date date,
  p_evidence_required text
)
returns jsonb
language plpgsql
security definer
set search_path=hq,public,pg_catalog
as $$
declare item hq.action_items%rowtype;
begin
  if not hq.is_active_owner(p_actor_user_id) then raise exception 'Active HQ owner access required'; end if;
  if length(trim(coalesce(p_title,'')))<3 then raise exception 'Action title is required'; end if;
  if p_category not in ('transition','operator','capital','governance','data','company_plan','operating','other') then raise exception 'Invalid action category'; end if;
  if p_priority not in ('critical','high','medium','low') then raise exception 'Invalid action priority'; end if;
  if p_company_id is not null and not exists(select 1 from hq.companies where id=p_company_id and is_active) then raise exception 'Invalid company'; end if;

  insert into hq.action_items(
    company_id,title,description,category,priority,status,owner_label,due_date,
    evidence_required,created_by,updated_by
  ) values (
    p_company_id,trim(p_title),nullif(trim(coalesce(p_description,'')),''),p_category,p_priority,'open',
    nullif(trim(coalesce(p_owner_label,'')),''),p_due_date,nullif(trim(coalesce(p_evidence_required,'')),''),
    p_actor_user_id,p_actor_user_id
  ) returning * into item;

  insert into hq.audit_log(actor_user_id,company_id,action,entity_type,entity_id,new_values)
  values(p_actor_user_id,item.company_id,'create','action_item',item.id::text,to_jsonb(item));

  return to_jsonb(item);
end;
$$;

create or replace function public.hq_update_action_item(
  p_actor_user_id uuid,
  p_action_id uuid,
  p_status text,
  p_priority text,
  p_owner_label text,
  p_due_date date,
  p_evidence_notes text,
  p_blocker text
)
returns jsonb
language plpgsql
security definer
set search_path=hq,public,pg_catalog
as $$
declare old_item hq.action_items%rowtype; new_item hq.action_items%rowtype;
begin
  if not hq.is_active_owner(p_actor_user_id) then raise exception 'Active HQ owner access required'; end if;
  if p_status not in ('open','in_progress','blocked','done','cancelled') then raise exception 'Invalid action status'; end if;
  if p_priority not in ('critical','high','medium','low') then raise exception 'Invalid action priority'; end if;

  select * into old_item from hq.action_items where id=p_action_id for update;
  if old_item.id is null then raise exception 'Action item not found'; end if;
  if old_item.system_key is not null and p_status in ('done','cancelled') then
    raise exception 'System actions close automatically when the underlying condition is resolved';
  end if;

  update hq.action_items set
    status=p_status,
    priority=p_priority,
    owner_label=nullif(trim(coalesce(p_owner_label,'')),''),
    due_date=p_due_date,
    evidence_notes=nullif(trim(coalesce(p_evidence_notes,'')),''),
    blocker=case when p_status='blocked' then nullif(trim(coalesce(p_blocker,'')),'') else null end,
    completed_at=case when p_status='done' then coalesce(completed_at,now()) else null end,
    updated_by=p_actor_user_id,
    updated_at=now()
  where id=p_action_id
  returning * into new_item;

  insert into hq.audit_log(actor_user_id,company_id,action,entity_type,entity_id,old_values,new_values)
  values(p_actor_user_id,new_item.company_id,'update','action_item',new_item.id::text,to_jsonb(old_item),to_jsonb(new_item));

  return to_jsonb(new_item);
end;
$$;

revoke all on function public.hq_get_action_center(uuid) from public,anon,authenticated;
revoke all on function public.hq_create_action_item(uuid,uuid,text,text,text,text,text,date,text) from public,anon,authenticated;
revoke all on function public.hq_update_action_item(uuid,uuid,text,text,text,date,text,text) from public,anon,authenticated;

grant execute on function public.hq_get_action_center(uuid) to service_role;
grant execute on function public.hq_create_action_item(uuid,uuid,text,text,text,text,text,date,text) to service_role;
grant execute on function public.hq_update_action_item(uuid,uuid,text,text,text,date,text,text) to service_role;
