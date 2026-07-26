# Osman Ventures HQ

## Mission

Osman Ventures HQ is the private governance layer for the companies owned or managed by Osman. Its first mission is narrow and measurable:

> Protect AutoRx cash flow while transferring the general manager role from Osman to a capable operator.

The HQ is not intended to replace Tekmetric, QuickBooks, RunTech, payroll systems, banking platforms, or project-management tools. It sits above those systems and controls accountability, capital allocation, decisions, risks, and owner visibility.

## Public and private surfaces

- `osmanventures.io` remains the public site.
- `hq.osmanventures.io` is the private command center.
- Both surfaces may use the same Next.js repository and Vercel project.
- `src/proxy.ts` rewrites requests from the HQ hostname into the `/hq` application tree.
- Authentication and authorization must be enforced before production data is added.

## Product principles

1. AutoRx is the current cash engine and receives first protection.
2. One company has one accountable operator.
3. Delegation never removes owner visibility over cash, payroll, legal exposure, critical customer issues, or fraud indicators.
4. Every capital allocation has an amount, purpose, owner, milestone, review date, and stop condition.
5. Managers report outcomes, variances, causes, actions, and commitments—not activity narratives.
6. Data is connected only after its definition and source are verified.
7. The system should reveal dependency on Osman rather than disguise it.

## Initial modules

### Executive

Portfolio-level health, cash-engine status, operator coverage, critical risks, and decisions requiring the owner.

### Companies

Company stage, operator, cash role, objectives, scorecard, risks, and capital use.

### Operators

Role charter, authority matrix, scorecard, weekly commitments, evaluations, improvement plans, and succession coverage.

### AutoRx GM Transition

Dependency map, delegation progress, candidate pipeline, 30/60/90 plan, absence tests, unresolved owner dependencies, and deterioration tracking.

### Capital

Requests, approvals, transfers, spend, milestones, review outcomes, and stop/continue decisions.

### Decisions

Decision context, options, assumptions, decision owner, expected result, review date, actual result, and lessons.

### Controls and Risks

Banking, payroll, access, refunds, warranties, legal exposure, cybersecurity, key-person risk, and other owner-level controls.

## Security model

The production version must include:

- Invite-only authentication.
- Multi-factor authentication for privileged roles.
- Role-based and company-scoped authorization.
- Row Level Security in Supabase.
- Audit logs for sensitive reads and all writes.
- No service-role key in browser code.
- No shared accounts.
- Immediate access revocation when a person leaves.
- Owner-only controls for capital, role assignment, and system administration.

Initial roles:

- `owner`
- `group_executive`
- `company_operator`
- `department_manager`
- `finance_reviewer`
- `auditor`

## Delivery sequence

### Phase 1 — Foundation

- Create `/hq` UI foundation.
- Add hostname routing for `hq.osmanventures.io`.
- Define the domain model and security requirements.
- Keep all displayed values clearly marked as planning data until integrations are verified.

### Phase 2 — Secure access

- Configure Supabase Auth.
- Disable public signup.
- Add invite flow and MFA.
- Add server-side session handling.
- Apply company-scoped RLS policies.

### Phase 3 — AutoRx GM Transition

- Create the GM role charter.
- Create Osman dependency inventory.
- Create department ownership map.
- Add scorecard definitions and weekly business review.
- Add candidate assessment and 30/60/90 tracking.
- Add absence-test records.

### Phase 4 — Financial protection

- Add AutoRx reserve policy.
- Add capital requests and approvals.
- Add project budgets and review dates.
- Add owner alerts and audit logs.

### Phase 5 — Verified integrations

Connect sources incrementally, beginning with read-only data. Every metric must have a documented definition, source, refresh cadence, owner, and reconciliation process.

## Explicit non-goals for the first release

- Replacing Tekmetric.
- Replacing QuickBooks.
- Building a complete ERP.
- Allowing managers to move money from the HQ.
- Giving AI autonomous legal, employment, payroll, refund, or capital authority.
- Supporting every future company before AutoRx transition workflows are proven.
