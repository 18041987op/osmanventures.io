-- AutoRx Weekly Business Review RPC layer.
-- Browser roles have no direct access; these functions are service-role only.

create or replace function public.hq_get_autorx_weekly_review(
  p_user_id uuid,
  p_week_start date
)
returns jsonb
language plpgsql
stable
security definer
set search_path = hq, public, pg_catalog
as $$
declare autorx_id uuid; result jsonb;
begin
  if not hq.is_active_owner(p_user_id) then raise exception 'Active HQ owner access required'; end if;
  if p_week_start is null then raise exception 'Week start is required'; end if;
  select id into autorx_id from hq.companies where slug = 'autorx' and is_active = true;

  select jsonb_build_object(
    'weekStart', p_week_start,
    'weekEnd', p_week_start + 6,
    'metrics', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', m.id, 'name', m.name, 'definition', m.definition,
        'unit', m.unit, 'sourceSystem', m.source_system,
        'direction', m.direction, 'isOwnerControl', m.is_owner_control,
        'target', r.target, 'actual', r.actual,
        'status', coalesce(r.status::text, 'not_reported'),
        'varianceExplanation', r.variance_explanation,
        'correctiveAction', r.corrective_action,
        'actionDueDate', r.action_due_date, 'updatedAt', r.updated_at
      ) order by m.created_at)
      from hq.metrics m
      left join hq.metric_results r
        on r.metric_id = m.id
       and r.period_start = p_week_start
       and r.period_end = p_week_start + 6
      where m.company_id = autorx_id and m.is_active = true
    ), '[]'::jsonb),
    'review', (
      select jsonb_build_object(
        'id', w.id, 'status', w.status::text,
        'wins', w.wins, 'misses', w.misses,
        'criticalIssues', w.critical_issues,
        'decisionsTaken', w.decisions_taken,
        'decisionsRequired', w.decisions_required,
        'nextCommitments', w.next_commitments,
        'submittedAt', w.submitted_at, 'reviewedAt', w.reviewed_at,
        'updatedAt', w.updated_at
      ) from hq.weekly_reviews w
      where w.company_id = autorx_id and w.week_start = p_week_start
      limit 1
    )
  ) into result;
  return result;
end;
$$;

create or replace function public.hq_upsert_autorx_metric_result(
  p_actor_user_id uuid, p_metric_id uuid, p_week_start date,
  p_target numeric, p_actual numeric, p_variance_explanation text,
  p_corrective_action text, p_action_due_date date default null
)
returns jsonb
language plpgsql
security definer
set search_path = hq, public, pg_catalog
as $$
declare
  metric_row hq.metrics%rowtype;
  old_row hq.metric_results%rowtype;
  saved_row hq.metric_results%rowtype;
  calculated_status hq.metric_status := 'not_reported';
begin
  if not hq.is_active_owner(p_actor_user_id) then raise exception 'Active HQ owner access required'; end if;
  if p_week_start is null then raise exception 'Week start is required'; end if;

  select m.* into metric_row
  from hq.metrics m join hq.companies c on c.id = m.company_id
  where m.id = p_metric_id and c.slug = 'autorx' and m.is_active = true;
  if metric_row.id is null then raise exception 'Metric not found'; end if;

  if p_target is not null and p_actual is not null then
    if metric_row.direction = 'higher_is_better' then
      calculated_status := case
        when p_actual >= p_target then 'on_track'::hq.metric_status
        when p_actual >= p_target * 0.90 then 'watch'::hq.metric_status
        else 'off_track'::hq.metric_status end;
    elsif metric_row.direction = 'lower_is_better' then
      calculated_status := case
        when p_actual <= p_target then 'on_track'::hq.metric_status
        when p_actual <= p_target * 1.10 then 'watch'::hq.metric_status
        else 'off_track'::hq.metric_status end;
    else
      calculated_status := 'watch';
    end if;
  end if;

  select * into old_row from hq.metric_results
  where metric_id = p_metric_id
    and period_start = p_week_start and period_end = p_week_start + 6;

  insert into hq.metric_results (
    metric_id, period_start, period_end, target, actual, status,
    variance_explanation, corrective_action, action_owner_user_id,
    action_due_date, source_reference
  ) values (
    p_metric_id, p_week_start, p_week_start + 6, p_target, p_actual,
    calculated_status, nullif(trim(p_variance_explanation),''),
    nullif(trim(p_corrective_action),''), p_actor_user_id,
    p_action_due_date, 'manual_hq_weekly_review'
  )
  on conflict (metric_id, period_start, period_end) do update set
    target = excluded.target, actual = excluded.actual,
    status = excluded.status,
    variance_explanation = excluded.variance_explanation,
    corrective_action = excluded.corrective_action,
    action_owner_user_id = excluded.action_owner_user_id,
    action_due_date = excluded.action_due_date,
    source_reference = excluded.source_reference,
    updated_at = now()
  returning * into saved_row;

  insert into hq.audit_log (
    actor_user_id, company_id, action, entity_type, entity_id,
    old_values, new_values
  ) values (
    p_actor_user_id, metric_row.company_id,
    case when old_row.id is null then 'create' else 'update' end,
    'metric_result', saved_row.id::text,
    case when old_row.id is null then null else to_jsonb(old_row) end,
    to_jsonb(saved_row)
  );

  return jsonb_build_object('id', saved_row.id, 'status', saved_row.status::text, 'updatedAt', saved_row.updated_at);
end;
$$;

create or replace function public.hq_save_autorx_weekly_review(
  p_actor_user_id uuid, p_week_start date, p_status text,
  p_wins jsonb, p_misses jsonb, p_critical_issues jsonb,
  p_decisions_taken jsonb, p_decisions_required jsonb,
  p_next_commitments jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = hq, public, pg_catalog
as $$
declare
  autorx_id uuid;
  old_row hq.weekly_reviews%rowtype;
  saved_row hq.weekly_reviews%rowtype;
  review_status hq.review_status;
begin
  if not hq.is_active_owner(p_actor_user_id) then raise exception 'Active HQ owner access required'; end if;
  if p_week_start is null then raise exception 'Week start is required'; end if;
  if p_status not in ('draft','submitted') then raise exception 'Invalid review status'; end if;
  review_status := p_status::hq.review_status;
  select id into autorx_id from hq.companies where slug = 'autorx' and is_active = true;
  select * into old_row from hq.weekly_reviews where company_id = autorx_id and week_start = p_week_start;

  insert into hq.weekly_reviews (
    company_id, operator_user_id, week_start, status,
    wins, misses, critical_issues, decisions_taken,
    decisions_required, next_commitments, submitted_at
  ) values (
    autorx_id, p_actor_user_id, p_week_start, review_status,
    coalesce(p_wins,'[]'::jsonb), coalesce(p_misses,'[]'::jsonb),
    coalesce(p_critical_issues,'[]'::jsonb), coalesce(p_decisions_taken,'[]'::jsonb),
    coalesce(p_decisions_required,'[]'::jsonb), coalesce(p_next_commitments,'[]'::jsonb),
    case when review_status = 'submitted' then now() else null end
  )
  on conflict (company_id, week_start) do update set
    operator_user_id = excluded.operator_user_id,
    status = excluded.status, wins = excluded.wins,
    misses = excluded.misses, critical_issues = excluded.critical_issues,
    decisions_taken = excluded.decisions_taken,
    decisions_required = excluded.decisions_required,
    next_commitments = excluded.next_commitments,
    submitted_at = case
      when excluded.status = 'submitted' and hq.weekly_reviews.submitted_at is null then now()
      when excluded.status = 'draft' then null
      else hq.weekly_reviews.submitted_at end,
    updated_at = now()
  returning * into saved_row;

  insert into hq.audit_log (
    actor_user_id, company_id, action, entity_type, entity_id,
    old_values, new_values
  ) values (
    p_actor_user_id, autorx_id,
    case when old_row.id is null then 'create' else 'update' end,
    'weekly_review', saved_row.id::text,
    case when old_row.id is null then null else to_jsonb(old_row) end,
    to_jsonb(saved_row)
  );

  return jsonb_build_object('id', saved_row.id, 'status', saved_row.status::text, 'submittedAt', saved_row.submitted_at, 'updatedAt', saved_row.updated_at);
end;
$$;

revoke all on function public.hq_get_autorx_weekly_review(uuid,date) from public, anon, authenticated;
revoke all on function public.hq_upsert_autorx_metric_result(uuid,uuid,date,numeric,numeric,text,text,date) from public, anon, authenticated;
revoke all on function public.hq_save_autorx_weekly_review(uuid,date,text,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb) from public, anon, authenticated;
grant execute on function public.hq_get_autorx_weekly_review(uuid,date) to service_role;
grant execute on function public.hq_upsert_autorx_metric_result(uuid,uuid,date,numeric,numeric,text,text,date) to service_role;
grant execute on function public.hq_save_autorx_weekly_review(uuid,date,text,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb) to service_role;
