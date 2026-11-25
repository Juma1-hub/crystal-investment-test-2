# CRYSTAL INVESTMENTS — Supabase and hosting setup

This project uses Supabase Auth and PostgreSQL as its authoritative backend. Financial and administrator changes are performed through permission-checked RPCs and RLS; the browser uses only the publishable/anon key.

## 1. Hosting environment variables

In Vercel, open **Settings → Environment Variables** and set:

- `NEXT_PUBLIC_SUPABASE_URL` — the project's Supabase URL, used by the browser for Data API, Storage and Functions.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — the project's publishable key (or the legacy anon key if that is what the project currently uses).
- `SUPABASE_URL` — the same Supabase project URL, used server-side by the same-origin Auth rewrite.
- `CRYSTAL_SITE_PUBLISHED=false` in Production. For controlled testing only, set it to `true` in a Vercel Preview environment protected by Deployment Protection.
- `CRYSTAL_EDGE_ORIGIN_TOKEN` and `CRYSTAL_REQUIRE_CLOUDFLARE_EDGE=true` — set only after the Cloudflare Worker is deployed and the same random token is stored as the Worker secret. Keep edge enforcement false until then.

Set these for Preview and Production. The Supabase URL is configuration, not a secret. Never place the service-role key, database password, Daraja credentials, SMTP credentials or callback secrets in any `NEXT_PUBLIC_*` variable or frontend file. Keep private values in encrypted server-side environment settings only.

For local development, copy `.env.example` to `.env.local` and fill the same URL and publishable-key values. Never upload `.env.local` to GitHub.

## 2. Database migration path

This project already has an existing Supabase database and financial records. Do not run `FRESH_DATABASE_INSTALL.sql` or historical initial migrations against the existing project.

Before changing the live database:

1. Back up the database and inspect the actual migration history and schema.
2. Run the read-only diagnostics in `supabase/diagnostics/`.
3. Restore a clone/staging database from the backup.
4. Apply the incremental migrations to the clone in this order:
   - `supabase/migrations/202611240001_live_security_and_processing_controls.sql`
   - `supabase/migrations/202611250001_complete_financial_review_and_payout_workflows.sql`
   - `supabase/migrations/202611250002_approved_deposit_reconciliation_and_provider_gates.sql`
5. Run the matching read-only verification SQL in `supabase/verification/`.
6. Test investor isolation, admin permissions, manual deposit approval, eight-division allocations, withdrawal reservation, manual payout confirmation/cancellation, daily accrual and audit records.
7. Only after staging passes and the user explicitly approves, schedule the live migration.

The migrations preserve existing financial rows. The previously manually approved KES 7 trillion deposit and the approved KES 7 withdrawal are not silently credited, debited, reversed or marked paid by these migrations.

## 3. Authentication, MFA and recovery

- Supabase Auth handles password storage, sessions, email verification and recovery. Do not build a custom login system.
- Require verified email and TOTP MFA for administrators. Sensitive financial/admin RPCs also require AAL2 at the database boundary.
- In Supabase **Authentication → URL Configuration**, set the actual production website as the Site URL and add exact Preview/Production redirect URLs for `/login` and `/reset-password`. Avoid wildcard production redirects.
- Configure a reliable SMTP sender and test registration, email confirmation, sign-in, sign-out and password recovery.
- Enable Supabase Auth CAPTCHA and configure Supabase Auth rate limits.

The browser Supabase client routes Auth requests through the same-site `/auth/v1/*` path. Next.js rewrites that path to the server-side `SUPABASE_URL`; the Cloudflare Worker can then rate-limit password sign-in, signup, recovery, verification, OTP and password-update attempts.

## 4. Cloudflare edge protection

The `cloudflare/` folder contains the Durable Object rate-limit Worker and a Wrangler configuration template.

1. Add the production domain to Cloudflare and enable the proxy.
2. Copy `cloudflare/wrangler.toml.example` to `cloudflare/wrangler.toml`.
3. Replace the example `ORIGIN_URL` with the Vercel deployment hostname and replace the route/zone placeholders with the actual domain.
4. Deploy the Worker using `npx wrangler deploy` from the `cloudflare/` directory.
5. Enable Cloudflare managed WAF rules, DDoS protection and bot protections.
6. Test that repeated password sign-in/signup/recovery attempts receive HTTP 429, while refresh-token renewal continues to work.

Cloudflare account configuration and Worker deployment are external steps; source code alone does not activate the domain protection.

## 5. Daily earnings schedule

The service-role-only daily accrual Edge Function is included. Use `supabase/schedules/README.md` and `supabase/schedules/202611250001_schedule_daily_accrual.sql` to configure the Vault-backed pg_cron job. Set the private Edge Function secrets and Vault secrets first, test the job on staging, and verify it with `supabase/verification/VERIFY_DAILY_ACCRUAL_SCHEDULE.sql`. The source package does not create a live cron job automatically.

## 5. Payment-provider integration boundary

The source includes M-Pesa STK initiation and callback verification. Real Daraja credentials, callback URL, deployment and sandbox tests are still required. Callback verification does not itself credit an investor. An authorised manual approval can post the deposit credit and eight allocations. Automatic deposit approval and automatic withdrawal payout remain gated until their provider adapters, callback verification, idempotency and sandbox tests are completed. Manual approval remains available at all times.

## 7. Publication and final testing

Keep `CRYSTAL_SITE_PUBLISHED=false` in Production until the user explicitly chooses to publish. A protected Vercel Preview may use `true` for testing. Before public launch, complete the production build, PostgreSQL migration tests, RLS/IDOR tests, MFA/role-escalation tests, Cloudflare rate-limit tests, payment-provider sandbox tests and final review of the project-specific opportunity terms and risk disclosures.
