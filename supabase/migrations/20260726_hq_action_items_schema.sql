create table if not exists hq.action_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references hq.companies(id) on delete set null,
  system_key text unique,
  title text not null,
  description text,
  category text not null default 'operating' check (category in ('transition','operator','capital','governance','data','company_plan','operating','other')),
  priority text not null default 'medium' check (priority in ('critical','high','medium','low')),
  status text not null default 'open' check (status in ('open','in_progress','blocked','done','cancelled')),
  owner_label text,
  due_date date,
  source_type text,
  source_id text,
  source_path text,
  evidence_required text,
  evidence_notes text,
  blocker text,
  created_by uuid references hq.profiles(id) on delete set null,
  updated_by uuid references hq.profiles(id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists action_items_status_priority_idx on hq.action_items(status,priority,due_date);
create index if not exists action_items_company_idx on hq.action_items(company_id,status);
alter table hq.action_items enable row level security;
revoke all on hq.action_items from public,anon,authenticated;
grant all on hq.action_items to service_role;

create or replace function hq.set_system_action(
  p_condition boolean,
  p_system_key text,
  p_company_id uuid,
  p_title text,
  p_description text,
  p_category text,
  p_priority text,
  p_source_type text,
  p_source_id text,
  p_source_path text,
  p_evidence_required text,
  p_owner_label text default 'Osman',
  p_suggested_status text default 'open',
  p_blocker text default null
)
returns void
language plpgsql
security definer
set search_path=hq,public,pg_catalog
as $$
begin
  if p_condition then
    insert into hq.action_items(
      company_id,system_key,title,description,category,priority,status,owner_label,
      source_type,source_id,source_path,evidence_required,blocker
    ) values (
      p_company_id,p_system_key,p_title,p_description,p_category,p_priority,p_suggested_status,p_owner_label,
      p_source_type,p_source_id,p_source_path,p_evidence_required,p_blocker
    )
    on conflict(system_key) do update set
      company_id=excluded.company_id,
      title=excluded.title,
      description=excluded.description,
      category=excluded.category,
      priority=excluded.priority,
      status=case when hq.action_items.status='done' then excluded.status else hq.action_items.status end,
      owner_label=coalesce(hq.action_items.owner_label,excluded.owner_label),
      source_type=excluded.source_type,
      source_id=excluded.source_id,
      source_path=excluded.source_path,
      evidence_required=excluded.evidence_required,
      blocker=case when hq.action_items.status='blocked' then coalesce(hq.action_items.blocker,excluded.blocker) else excluded.blocker end,
      completed_at=case when hq.action_items.status='done' then null else hq.action_items.completed_at end,
      updated_at=now();
  else
    update hq.action_items
       set status='done',completed_at=coalesce(completed_at,now()),blocker=null,updated_at=now()
     where system_key=p_system_key and status not in ('done','cancelled');
  end if;
end;
$$;

revoke all on function hq.set_system_action(boolean,text,uuid,text,text,text,text,text,text,text,text,text,text,text) from public,anon,authenticated;
