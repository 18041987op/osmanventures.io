-- Osman Ventures HQ authorization foundation.
-- Apply only after 20260725_hq_foundation.sql and after creating the first
-- authorized Supabase Auth user. Owner/profile bootstrap must be performed with
-- the service role; there is intentionally no public profile-registration path.

create or replace function public.hq_current_role()
returns public.hq_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.hq_profiles
  where id = auth.uid() and is_active = true
  limit 1;
$$;

create or replace function public.hq_is_group_leader()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.hq_current_role() in ('owner', 'group_executive'), false);
$$;

create or replace function public.hq_has_company_access(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.hq_is_group_leader()
    or exists (
      select 1
      from public.hq_company_access access
      join public.hq_profiles profile on profile.id = access.user_id
      where access.user_id = auth.uid()
        and access.company_id = target_company_id
        and profile.is_active = true
    );
$$;

create or replace function public.hq_can_manage_company(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.hq_is_group_leader()
    or exists (
      select 1
      from public.hq_company_access access
      join public.hq_profiles profile on profile.id = access.user_id
      where access.user_id = auth.uid()
        and access.company_id = target_company_id
        and access.role in ('company_operator', 'department_manager')
        and profile.is_active = true
    );
$$;

revoke all on function public.hq_current_role() from public;
revoke all on function public.hq_is_group_leader() from public;
revoke all on function public.hq_has_company_access(uuid) from public;
revoke all on function public.hq_can_manage_company(uuid) from public;

grant execute on function public.hq_current_role() to authenticated;
grant execute on function public.hq_is_group_leader() to authenticated;
grant execute on function public.hq_has_company_access(uuid) to authenticated;
grant execute on function public.hq_can_manage_company(uuid) to authenticated;

-- Anonymous users receive no HQ table privileges.
revoke all on public.hq_companies from anon;
revoke all on public.hq_profiles from anon;
revoke all on public.hq_company_access from anon;
revoke all on public.hq_operator_seats from anon;
revoke all on public.hq_metrics from anon;
revoke all on public.hq_metric_results from anon;
revoke all on public.hq_weekly_reviews from anon;
revoke all on public.hq_capital_requests from anon;
revoke all on public.hq_decisions from anon;
revoke all on public.hq_risks from anon;
revoke all on public.hq_dependencies from anon;
revoke all on public.hq_audit_log from anon;

-- Authenticated users receive table privileges; RLS below determines scope.
grant select, insert, update, delete on public.hq_companies to authenticated;
grant select on public.hq_profiles to authenticated;
grant select, insert, update, delete on public.hq_company_access to authenticated;
grant select, insert, update, delete on public.hq_operator_seats to authenticated;
grant select, insert, update, delete on public.hq_metrics to authenticated;
grant select, insert, update on public.hq_metric_results to authenticated;
grant select, insert, update on public.hq_weekly_reviews to authenticated;
grant select, insert, update on public.hq_capital_requests to authenticated;
grant select, insert, update on public.hq_decisions to authenticated;
grant select, insert, update on public.hq_risks to authenticated;
grant select, insert, update, delete on public.hq_dependencies to authenticated;
grant select on public.hq_audit_log to authenticated;

-- Companies
create policy hq_companies_select
on public.hq_companies for select to authenticated
using (public.hq_has_company_access(id));

create policy hq_companies_owner_insert
on public.hq_companies for insert to authenticated
with check (public.hq_is_group_leader());

create policy hq_companies_owner_update
on public.hq_companies for update to authenticated
using (public.hq_is_group_leader())
with check (public.hq_is_group_leader());

create policy hq_companies_owner_delete
on public.hq_companies for delete to authenticated
using (public.hq_is_group_leader());

-- Profiles are visible to the user and group leadership. Profile creation and
-- role changes are service-role operations only.
create policy hq_profiles_select
on public.hq_profiles for select to authenticated
using (id = auth.uid() or public.hq_is_group_leader());

-- Company access assignments
create policy hq_company_access_select
on public.hq_company_access for select to authenticated
using (user_id = auth.uid() or public.hq_is_group_leader());

create policy hq_company_access_owner_insert
on public.hq_company_access for insert to authenticated
with check (public.hq_is_group_leader());

create policy hq_company_access_owner_update
on public.hq_company_access for update to authenticated
using (public.hq_is_group_leader())
with check (public.hq_is_group_leader());

create policy hq_company_access_owner_delete
on public.hq_company_access for delete to authenticated
using (public.hq_is_group_leader());

-- Operator seats
create policy hq_operator_seats_select
on public.hq_operator_seats for select to authenticated
using (public.hq_has_company_access(company_id));

create policy hq_operator_seats_manage_insert
on public.hq_operator_seats for insert to authenticated
with check (public.hq_can_manage_company(company_id));

create policy hq_operator_seats_manage_update
on public.hq_operator_seats for update to authenticated
using (public.hq_can_manage_company(company_id))
with check (public.hq_can_manage_company(company_id));

create policy hq_operator_seats_manage_delete
on public.hq_operator_seats for delete to authenticated
using (public.hq_is_group_leader());

-- Metrics and metric results
create policy hq_metrics_select
on public.hq_metrics for select to authenticated
using (public.hq_has_company_access(company_id));

create policy hq_metrics_manage_insert
on public.hq_metrics for insert to authenticated
with check (public.hq_can_manage_company(company_id));

create policy hq_metrics_manage_update
on public.hq_metrics for update to authenticated
using (public.hq_can_manage_company(company_id))
with check (public.hq_can_manage_company(company_id));

create policy hq_metrics_manage_delete
on public.hq_metrics for delete to authenticated
using (public.hq_is_group_leader());

create policy hq_metric_results_select
on public.hq_metric_results for select to authenticated
using (
  public.hq_has_company_access(
    (select metric.company_id from public.hq_metrics metric where metric.id = metric_id)
  )
);

create policy hq_metric_results_manage_insert
on public.hq_metric_results for insert to authenticated
with check (
  public.hq_can_manage_company(
    (select metric.company_id from public.hq_metrics metric where metric.id = metric_id)
  )
);

create policy hq_metric_results_manage_update
on public.hq_metric_results for update to authenticated
using (
  public.hq_can_manage_company(
    (select metric.company_id from public.hq_metrics metric where metric.id = metric_id)
  )
)
with check (
  public.hq_can_manage_company(
    (select metric.company_id from public.hq_metrics metric where metric.id = metric_id)
  )
);

-- Weekly business reviews
create policy hq_weekly_reviews_select
on public.hq_weekly_reviews for select to authenticated
using (public.hq_has_company_access(company_id));

create policy hq_weekly_reviews_operator_insert
on public.hq_weekly_reviews for insert to authenticated
with check (
  operator_user_id = auth.uid()
  and public.hq_can_manage_company(company_id)
);

create policy hq_weekly_reviews_operator_update
on public.hq_weekly_reviews for update to authenticated
using (operator_user_id = auth.uid() or public.hq_is_group_leader())
with check (
  (operator_user_id = auth.uid() and public.hq_can_manage_company(company_id))
  or public.hq_is_group_leader()
);

-- Capital requests
create policy hq_capital_requests_select
on public.hq_capital_requests for select to authenticated
using (public.hq_has_company_access(company_id));

create policy hq_capital_requests_requester_insert
on public.hq_capital_requests for insert to authenticated
with check (
  requested_by = auth.uid()
  and public.hq_has_company_access(company_id)
);

create policy hq_capital_requests_owner_update
on public.hq_capital_requests for update to authenticated
using (public.hq_is_group_leader())
with check (public.hq_is_group_leader());

-- Decisions
create policy hq_decisions_select
on public.hq_decisions for select to authenticated
using (
  (company_id is null and public.hq_is_group_leader())
  or (company_id is not null and public.hq_has_company_access(company_id))
);

create policy hq_decisions_owner_insert
on public.hq_decisions for insert to authenticated
with check (
  owner_user_id = auth.uid()
  and (
    (company_id is null and public.hq_is_group_leader())
    or (company_id is not null and public.hq_has_company_access(company_id))
  )
);

create policy hq_decisions_owner_update
on public.hq_decisions for update to authenticated
using (owner_user_id = auth.uid() or public.hq_is_group_leader())
with check (owner_user_id = auth.uid() or public.hq_is_group_leader());

-- Risks
create policy hq_risks_select
on public.hq_risks for select to authenticated
using (
  (company_id is null and public.hq_is_group_leader())
  or (company_id is not null and public.hq_has_company_access(company_id))
);

create policy hq_risks_manage_insert
on public.hq_risks for insert to authenticated
with check (
  (company_id is null and public.hq_is_group_leader())
  or (company_id is not null and public.hq_can_manage_company(company_id))
);

create policy hq_risks_manage_update
on public.hq_risks for update to authenticated
using (
  public.hq_is_group_leader()
  or (company_id is not null and public.hq_can_manage_company(company_id))
)
with check (
  public.hq_is_group_leader()
  or (company_id is not null and public.hq_can_manage_company(company_id))
);

-- Osman dependencies
create policy hq_dependencies_select
on public.hq_dependencies for select to authenticated
using (public.hq_has_company_access(company_id));

create policy hq_dependencies_manage_insert
on public.hq_dependencies for insert to authenticated
with check (public.hq_can_manage_company(company_id));

create policy hq_dependencies_manage_update
on public.hq_dependencies for update to authenticated
using (public.hq_can_manage_company(company_id))
with check (public.hq_can_manage_company(company_id));

create policy hq_dependencies_owner_delete
on public.hq_dependencies for delete to authenticated
using (public.hq_is_group_leader());

-- Audit logs are immutable from the browser. They are written by trusted server
-- routes with the service role.
create policy hq_audit_log_select
on public.hq_audit_log for select to authenticated
using (
  public.hq_is_group_leader()
  or (
    public.hq_current_role() = 'auditor'
    and (company_id is null or public.hq_has_company_access(company_id))
  )
);
