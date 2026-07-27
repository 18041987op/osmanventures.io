create or replace function public.hq_get_governance_center(p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path=hq,public,pg_catalog
as $$
declare result jsonb;
begin
  if not hq.is_active_owner(p_user_id) then
    raise exception 'Active HQ owner access required';
  end if;

  select jsonb_build_object(
    'companies', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',id,'name',name,'slug',slug,'cashRole',cash_role
      ) order by created_at)
      from hq.companies where is_active
    ),'[]'::jsonb),
    'reservePolicy', (
      select jsonb_build_object(
        'id',p.id,'companyId',p.company_id,'status',p.status,'currency',p.currency,
        'currentCash',p.current_cash,'payrollBuffer',p.payroll_buffer,
        'vendorBuffer',p.vendor_buffer,'taxBuffer',p.tax_buffer,
        'debtAndRentBuffer',p.debt_and_rent_buffer,'emergencyBuffer',p.emergency_buffer,
        'otherBuffer',p.other_buffer,'requiredReserve',hq.required_reserve(p),
        'availableCapital',case when p.current_cash is null then null else greatest(p.current_cash-hq.required_reserve(p),0) end,
        'reserveGap',case when p.current_cash is null then null else greatest(hq.required_reserve(p)-p.current_cash,0) end,
        'notes',p.notes,'approvedAt',p.approved_at,'updatedAt',p.updated_at
      )
      from hq.reserve_policies p
      join hq.companies c on c.id=p.company_id
      where c.slug='autorx'
    ),
    'cashPosition', (
      select jsonb_build_object(
        'id',x.id,'companyId',x.company_id,'snapshotDate',x.snapshot_date,
        'source',x.source,'liquidBankCash',x.liquid_bank_cash,
        'excludedBookCash',x.excluded_book_cash,'creditCardDebt',x.credit_card_debt,
        'netOperatingLiquidity',x.net_operating_liquidity,
        'payrollPending',x.payroll_pending,'partsVendor30d',x.parts_vendor_30d,
        'taxes30d',x.taxes_30d,'rentDebt30d',x.rent_debt_30d,
        'otherObligations30d',x.other_obligations_30d,'restrictedCash',x.restricted_cash,
        'totalKnownCommitments',x.total_known_commitments,
        'projectedAfterCommitments',x.projected_after_commitments,
        'requiredReserve',x.required_reserve,'hardFloor',x.hard_floor,
        'reserveGap',x.reserve_gap,'operatingBand',x.operating_band,
        'details',x.details,'updatedAt',x.updated_at
      )
      from hq.cash_position_snapshots x
      join hq.companies c on c.id=x.company_id
      where c.slug='autorx'
      order by x.snapshot_date desc,x.updated_at desc
      limit 1
    ),
    'capitalRequests', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',r.id,'companyId',r.company_id,'companyName',c.name,
        'fundingCompanyId',r.funding_company_id,'fundingCompanyName',fc.name,
        'title',coalesce(r.title,r.purpose),'amount',r.amount,'purpose',r.purpose,
        'expectedResult',r.expected_result,'milestone',r.milestone,
        'reviewDate',r.review_date,'stopCondition',r.stop_condition,'status',r.status,
        'requestType',r.request_type,'priority',r.priority,
        'eligibilityStatus',r.eligibility_status,'approvedAmount',r.approved_amount,
        'reserveRequiredAtDecision',r.reserve_required_at_decision,'cashAfter',r.cash_after,
        'ownerNotes',r.owner_notes,'createdAt',r.created_at,'updatedAt',r.updated_at
      ) order by r.created_at desc)
      from hq.capital_requests r
      join hq.companies c on c.id=r.company_id
      left join hq.companies fc on fc.id=r.funding_company_id
    ),'[]'::jsonb),
    'decisions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',d.id,'companyId',d.company_id,'companyName',c.name,
        'title',d.title,'context',d.context,'options',d.options,'assumptions',d.assumptions,
        'decision',d.decision,'status',d.status,'decisionType',d.decision_type,
        'priority',d.priority,'expectedResult',d.expected_result,'dueDate',d.due_date,
        'reviewDate',d.review_date,'actualResult',d.actual_result,'lessons',d.lessons,
        'linkedEntityType',d.linked_entity_type,'linkedEntityId',d.linked_entity_id,
        'createdAt',d.created_at,'updatedAt',d.updated_at
      ) order by case d.status when 'proposed' then 0 when 'approved' then 1 when 'implemented' then 2 else 3 end,d.created_at desc)
      from hq.decisions d
      left join hq.companies c on c.id=d.company_id
    ),'[]'::jsonb),
    'risks', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',r.id,'companyId',r.company_id,'companyName',c.name,
        'title',r.title,'category',r.category,'description',r.description,
        'probability',r.probability,'impact',r.impact,'exposure',(r.probability*r.impact),
        'ownerLabel',r.owner_label,'mitigationPlan',r.mitigation_plan,
        'triggerCondition',r.trigger_condition,'nextReviewDate',r.next_review_date,
        'status',r.status,'residualProbability',r.residual_probability,
        'residualImpact',r.residual_impact,'updatedAt',r.updated_at
      ) order by (r.probability*r.impact) desc,r.created_at desc)
      from hq.risks r
      left join hq.companies c on c.id=r.company_id
    ),'[]'::jsonb),
    'controls', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',x.id,'companyId',x.company_id,'companyName',c.name,
        'title',x.title,'category',x.category,'objective',x.objective,
        'frequency',x.frequency,'ownerLabel',x.owner_label,
        'evidenceRequired',x.evidence_required,'status',x.status,
        'isOwnerRetained',x.is_owner_retained,'lastCompletedAt',x.last_completed_at,
        'nextDueDate',x.next_due_date,'notes',x.notes,'updatedAt',x.updated_at
      ) order by x.is_owner_retained desc,x.title)
      from hq.controls x
      left join hq.companies c on c.id=x.company_id
    ),'[]'::jsonb),
    'summary', jsonb_build_object(
      'pendingCapitalRequests',(select count(*) from hq.capital_requests where status in ('draft','requested')),
      'openDecisions',(select count(*) from hq.decisions where status='proposed'),
      'highRisks',(select count(*) from hq.risks where status<>'closed' and probability*impact>=15),
      'controlGaps',(select count(*) from hq.controls where status='gap')
    )
  ) into result;

  return result;
end;
$$;

revoke all on function public.hq_get_governance_center(uuid) from public,anon,authenticated;
grant execute on function public.hq_get_governance_center(uuid) to service_role;