# CRYSTAL INVESTMENTS — pre-payment integration test release

This source bundle contains the Next.js frontend, incremental Supabase migrations, verification SQL, Edge Function source, and security/deployment documentation. It is intended for controlled testing before payment-provider integration.

## Project rules preserved

- CRYSTAL INVESTMENTS remains separate from SUPA AI.
- Supabase is the authoritative backend; investor, financial, admin and audit data are not stored in browser storage.
- KES is the only currency for new accounts and transactions. Historical foreign-currency records are preserved unchanged.
- Manual review remains available alongside automatic processing. Manual verification is always enabled.
- The eight agreed divisions are activated for the unpublished test site. Each approved deposit is allocated equally at 12.5% across the eight divisions.
- Annual interest rates accrue daily on the agreed 360/365 basis, with intraday splits at the exact effective timestamp of a rate change.
- Referral commission is 20% of verified KES interest earnings only.
- Sensitive admin actions require database-side authorization, RLS/RPC enforcement, audit logging and AAL2.
- No financial record is deleted, overwritten, reset or silently adjusted.
- Secret keys remain server-side; `.env*` files are excluded from Git except `.env.example`.

## Included

- `app/`, `components/`, `lib/`, `public/`: Next.js frontend and browser-safe backend client.
- `supabase/migrations/`: historical migrations, the 24 November security baseline, and the 25 November financial workflow migration.
- `supabase/verification/`: read-only post-migration verification SQL.
- `supabase/diagnostics/`: read-only financial reconciliation queries and guide.
- `supabase/functions/`: M-Pesa STK initiation, callback verification, and daily accrual Edge Function source.
- `supabase/schedules/`: Vault-backed daily accrual cron setup and verification.
- `SECURITY-AND-SETUP.md`, `LIVE-DATABASE-DEPLOYMENT.md`, `SUPABASE-SETUP.md`: security and deployment guidance.
- `cloudflare/`: same-origin Supabase Auth proxy/rate-limit Worker and deployment template.
- `STAGING-TEST-PLAN.md`: controlled end-to-end acceptance plan.

## Financial workflows in this source release

- **Deposits:** authorised admins can approve or reject pending KES deposits with an AAL2-protected review note. Approval atomically posts one idempotent ledger credit and creates eight equal active allocations.
- **Withdrawals:** investor submissions are checked against ledger-backed account value and existing reservations. Admin approval reserves the amount but does not debit the ledger or mark the request paid.
- **Payout completion:** an approved withdrawal can be marked paid only after an administrator enters the actual provider reference and a meaningful independent verification note. The database then posts the debit and proportionally reduces unallocated cash, investment principal and/or recorded interest.
- **Payout failure:** an approved unpaid withdrawal can be cancelled with an audited reason, releasing its reservation without changing the ledger.
- **Divisions:** all eight agreed divisions are activated for the unpublished test site. The equal allocation step is automatic after manual deposit approval.
- **Daily earnings:** the corrected service-role-only accrual function records completed Kenya-local days and time-weights intraday interest-rate changes. A protected scheduler still needs to be configured.

## Local frontend verification

1. Install Node.js 22 or later.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`; set the browser-safe Supabase URL/publishable key and the server-side `SUPABASE_URL` destination.
4. Run `npm run check:project-rules`.
5. Run `npx tsc --noEmit` and `npm run build`.
6. Keep `CRYSTAL_SITE_PUBLISHED=false` until you explicitly approve publication.

## Database verification

This project already has an existing database. Do not run fresh-install SQL against it. First take a backup, inspect actual migration history/schema, run the read-only diagnostics, test both incremental migrations against a clone, and review every function/RLS/grant. Apply to the live database only after the staging tests pass and the user explicitly approves it.

Apply in order on the clone:

1. `supabase/migrations/202611240001_live_security_and_processing_controls.sql`
2. `supabase/migrations/202611250001_complete_financial_review_and_payout_workflows.sql`
3. `supabase/migrations/202611250002_approved_deposit_reconciliation_and_provider_gates.sql`

Then run `VERIFY_LIVE_SECURITY_BASELINE_20261125.sql`, `VERIFY_FINANCIAL_WORKFLOWS_20261125.sql`, and `VERIFY_APPROVED_DEPOSIT_RECONCILIATION_20261125.sql` from `supabase/verification/`.

## Payment integration boundary

M-Pesa STK initiation and callback-verification source is included. Real Daraja credentials, callback URL, deployment and sandbox tests are still required. The callback records provider verification evidence; manual approval remains available. Automatic deposit processing must not be enabled until the payment adapter can verify provider results and invoke an idempotent approval path. No bank payout adapter is included. Manual payout confirmation is available after the external transfer has actually succeeded. Automatic withdrawal processing remains off until a trusted payout adapter and callback are deployed and tested.

## Historical financial records

The KES 7 trillion deposit remains in its existing manually approved state, as confirmed by the user. It is not automatically credited again or rewritten. The approved KES 7 withdrawal remains unchanged and is not marked paid without actual payout evidence. New requests use the new workflow; these older records are not silently reconciled by the migration.

## Test-release limitation

The new SQL has been reviewed at source level and the frontend files have passed syntax parsing, but PostgreSQL execution, staging-clone migration tests, semantic TypeScript checking, the Next.js production build, and end-to-end financial tests have not yet passed. Do not treat this source bundle as certified for real-money production use until those tests are completed.
