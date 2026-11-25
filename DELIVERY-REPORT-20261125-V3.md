# CRYSTAL INVESTMENTS — Frontend + Backend Test Release V3

Date: 25 November 2026

## Included

- Next.js 15 / React 19 investor and public-site frontend.
- Admin console, investor portal, KYC, statements, support, referrals, branches, opportunities, distributions, roles/permissions, analytics and system health components.
- Supabase schema migrations, Edge Functions, daily accrual scheduler template, diagnostics and read-only verification SQL.
- Cloudflare Auth rate-limiting Worker, origin-protection configuration and Worker tests.
- Security controls: server-side secrets, `.env` exclusions, Supabase Auth, RLS/ownership permissions, AAL2 admin financial actions, server-side validation, HTTPS/HSTS, Cloudflare rate limits/WAF setup.

## Financial workflow behavior

- New KES deposits can be manually approved with AAL2. The database transaction posts one idempotent ledger credit and creates eight equal active allocations.
- Previously approved deposits that have no matching posting can be reconciled through a separate Super-Admin-only, AAL2-protected RPC and admin queue action. It verifies existing postings, creates missing ledger/allocation records once, preserves the original approval status/reviewer/time, and writes an audit record. It never runs automatically.
- Withdrawals are approved as balance reservations. They are not debited or marked paid until a separate payout confirmation has a provider reference and independent verification note. Approved unpaid withdrawals can be cancelled with an audit record.
- Daily accrual uses a service-role-only RPC and time-weighted interest-rate segments. A protected Edge Function and Vault/pg_cron schedule template are included.
- Referral commissions remain limited to 20% of verified KES interest earnings.
- The eight canonical divisions are activated in the incremental test-site migration; the public publication gate remains separate.
- Manual review remains mandatory for all categories. Automatic internal equal allocation is enabled and required. External automatic deposit/withdrawal/distribution/referral processing can only be enabled after a trusted provider adapter is deployed and recently verified.

## Migration ordering correction

The two historical migration files previously shared version prefix `202611110002`. The referral migration has been renamed to `20261111000230_referral_program.sql`, preserving the required order after the financial foundation and before `202611110003_central_backend_and_referral_admin.sql`. All active migration version prefixes are now unique.

## Checks completed in this workspace

- Project-rule checks: **51/51 passed**.
- Cloudflare Worker tests: **5/5 passed**.
- Active app TypeScript/TSX syntax transpilation: **54 files, 0 syntax errors**.
- All 13 migration filename version prefixes are unique.
- SQL dollar-quote delimiters are balanced; incremental migrations 24, 25 and 26 each have one `BEGIN` and one `COMMIT`.
- ZIP integrity and secret-pattern scan passed; no actual secrets are included.

## Not certified / still requires external validation

- `npm install` timed out in this workspace; full semantic TypeScript checking and the Next.js production build have not been completed.
- No PostgreSQL client/server was available; SQL parser/execution and staging-clone migration tests have not been completed.
- No Supabase migrations or Edge Functions have been deployed. No live financial records were changed.
- The M-Pesa STK and callback source still require Daraja credentials, callback configuration, deployment and sandbox verification. Automatic provider approval/payout must remain off until those adapters are integrated and verified. No bank payout adapter is included.
- The Cloudflare Worker, Vercel origin token, Auth CAPTCHA/rate limits and daily accrual schedule still require account/domain configuration and deployment.

## Historical records

The user confirms the KES 7 trillion deposit was manually approved. Its existing request record is preserved. The new explicit reconciliation RPC is available to the Super Admin with MFA and a detailed audit note; it does not automatically post a credit. The KES 7 approved withdrawal remains unchanged and is not marked paid without actual payout evidence.

## Deployment position

This is the most complete source test bundle prepared in this workspace, ready for controlled staging validation. It is not yet certified for real-money production use. Do not upload it to the production branch or apply migrations to the live database until staging migration, full build, security and end-to-end tests pass and the user explicitly approves deployment.
