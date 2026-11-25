# CRYSTAL INVESTMENTS — Supabase-backed web application

This repository contains the active Next.js 15 / React 19 application, Supabase migrations, security controls, verification SQL, PWA assets and operational documentation. Older root-level prototype components are retained for traceability only; deploy the Next.js `app/` application, not those prototype files.

## Important

The source includes manual deposit approval with idempotent eight-division allocation, withdrawal approval/reservation, separately verified payout confirmation and cancellation. These workflows are delivered in incremental migrations `202611250001_complete_financial_review_and_payout_workflows.sql` and `202611250002_approved_deposit_reconciliation_and_provider_gates.sql`; they must be tested on a database clone before any live deployment. The second migration adds a Super-Admin-only, MFA-protected, idempotent reconciliation action for deposits already marked approved, without changing their original approval fields. Automatic M-Pesa/bank processing remains gated until the corresponding provider integration is deployed and verified. Do not use fresh-install SQL against an existing live database.

## Financial workflow additions in the continuation release

- New deposit requests can be manually approved with AAL2; approval posts one KES ledger credit and creates eight equal active allocations in one transaction.
- A previously approved deposit can be reconciled separately by the active Supa Admin with AAL2 and a detailed note. The reconciliation checks existing ledger/allocation records and is idempotent; it does not rewrite the original request approval fields or run automatically.
- Withdrawals are approved as reservations, then marked paid only by a separate manually verified payout action. Cancellation releases an unpaid reservation without posting a debit.
- Automatic internal allocation across the eight divisions is mandatory. External automatic deposits/withdrawals remain disabled until a trusted provider adapter is deployed and recently verified; manual review remains enabled.
- Apply incremental migrations 24, 25 and 26 in order on a staging clone. Migration 26 adds the approved-deposit reconciliation action and provider-readiness gate.

## Main application

- `app/` — public website, registration, login, investor and admin routes.
- `components/` — investor portal and admin modules.
- `lib/supabase.ts` — browser Supabase client using only the publishable/anon key.
- `supabase/migrations/` — ordered migration history and the live security baseline. Migration versions are unique; the referral migration has a distinct timestamp so the Supabase CLI can order the chain.
- `supabase/verification/` — read-only post-deployment verification.
- `supabase/schedules/` — protected daily accrual scheduler setup and verification guide.
- `public/` — PWA manifest assets, service worker and offline page.
- `cloudflare/` — Auth rate-limit Worker, origin protection and executable tests.
- `STAGING-TEST-PLAN.md` — end-to-end acceptance plan for the protected test deployment.

## Setup

1. Install dependencies with `npm install`.
2. Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in the deployment environment.
3. Do not place a Supabase service-role key or payment-provider secret in any `NEXT_PUBLIC_` variable.
4. Configure Supabase Auth redirect URLs for the production domain.
5. Keep `CRYSTAL_SITE_PUBLISHED=false` in Production. For controlled testing, set it to `true` only in a Vercel Preview environment protected by Deployment Protection; do not expose the Preview URL publicly.
6. Configure the Cloudflare Worker and the same-origin Auth proxy using `cloudflare/README.md` before relying on edge rate limits.
7. Follow `LIVE-DATABASE-DEPLOYMENT.md` before applying any migration to the existing live database.
8. Use `STAGING-TEST-PLAN.md` to validate all investor/admin workflows on a database clone.
9. Run `npm run check:project-rules`, `npm run test:cloudflare-rate-limit` and `npm run build` before deploying the frontend.

## Current safeguards

- KES is the only currency offered for new accounts and transactions.
- Historical foreign-currency financial rows are not converted or deleted.
- Referral commission is limited to 20% of verified interest earnings.
- Manual and automatic processing settings are separate; manual review is always enabled and external payment automation remains provider-gated.
- Supabase Auth requests can be routed through the included Cloudflare edge rate-limit gateway; deploy and attach it to the domain before relying on the limits.
- Distribution payout completion requires verified payment confirmation and an idempotent ledger/audit post.
- KYC documents use a private Supabase Storage bucket; reviewers receive short-lived signed links.
- Team and branch records use MFA-protected RPCs and soft deactivation.
- Manual financial actions require administrator permissions and MFA; withdrawal payout is not marked paid until independently verified.
- The previously approved KES 7 trillion deposit and KES 7 withdrawal remain preserved; neither is silently adjusted.

See `PROJECT-RULES-CHECKLIST.md` for the project decision checklist and outstanding blockers.
