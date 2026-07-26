# Osman Ventures HQ — Secure access setup

The HQ code is intentionally locked until its server-side environment variables are configured. There is no public signup route.

## 1. Use a dedicated Supabase project

A dedicated project is recommended for Osman Ventures HQ because this system will eventually contain financial, employee, manager-performance, capital-allocation, and risk information from multiple companies.

Do not reuse browser-visible service-role credentials from another application.

## 2. Apply migrations in order

1. `supabase/migrations/20260725_hq_foundation.sql`
2. `supabase/migrations/20260726_hq_rls_policies.sql`

The first migration creates the domain tables. The second creates helper functions, removes anonymous access, and installs company-scoped RLS policies.

## 3. Disable public registration

In Supabase Authentication settings:

- Disable new-user public signup.
- Require email verification for accounts created by an administrator.
- Create users only through the Supabase dashboard or a future owner-only invitation service.
- Enable MFA before managers receive access.

## 4. Create the first owner account

Create Osman's Auth user in Supabase. Copy its UUID and bootstrap the owner profile with a service-role SQL operation:

```sql
insert into public.hq_profiles (id, full_name, email, role)
values (
  '<AUTH_USER_UUID>',
  'Osman Perez',
  '<AUTHORIZED_EMAIL>',
  'owner'
);
```

No client-side route may create an `owner` or change a user's role.

## 5. Configure Vercel environment variables

Add the following variables to Preview and Production as appropriate:

- `HQ_SUPABASE_URL`
- `HQ_SUPABASE_ANON_KEY`
- `HQ_ALLOWED_EMAILS`
- `HQ_SESSION_SECRET`
- `HQ_SUPABASE_SERVICE_ROLE_KEY` (required for future owner-only invitations and trusted mutations)

`HQ_ALLOWED_EMAILS` is comma-separated. Start with one owner-controlled email address.

Generate `HQ_SESSION_SECRET` with at least 32 random bytes, for example:

```bash
openssl rand -base64 48
```

Never prefix the session secret or service-role key with `NEXT_PUBLIC_`.

## 6. Current authentication boundary

The current implementation:

- Validates email/password against Supabase Auth on the server.
- Rejects accounts not present in `HQ_ALLOWED_EMAILS`.
- Creates a signed 12-hour `httpOnly`, `sameSite=lax` session cookie.
- Provides no public registration.
- Protects the `/hq` dashboard at the server-rendering layer.
- Keeps database service credentials out of browser code.

Before inviting managers, add:

- MFA enrollment and enforcement.
- Database-backed role resolution instead of assigning the initial owner role from the allowlist.
- Owner-only invitation and revocation screens.
- Login rate limiting at Cloudflare or Vercel firewall level.
- Audit events for login, logout, invitation, revocation, and permission changes.

## 7. Subdomain

After the preview is approved:

1. Add `hq.osmanventures.io` to the Vercel project.
2. Configure the required DNS record.
3. Keep the apex `osmanventures.io` as the public website.
4. Verify that `/` on the HQ hostname rewrites to the private `/hq` application.
5. Place Cloudflare Access in front of the HQ as a second identity barrier when practical.

## 8. Production rule

Do not store real AutoRx financial, payroll, employee, customer, or legal information until:

- Authentication is configured.
- MFA is enforced.
- RLS policies have been tested using owner, operator, department-manager, finance-reviewer, and auditor test accounts.
- The repository and deployment access model have been reviewed.
- Audit logging is writing immutable events through trusted server routes.
