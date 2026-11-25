# CRYSTAL INVESTMENTS — Source package delivery

**Prepared:** 24 November 2026  
**Source baseline:** `crysatlinvestments-test-version--main.zip` uploaded 23 November 2026  
**Scope:** Frontend, Supabase backend, Edge Function source, incremental migration draft, verification SQL and deployment notes.

## Project rules retained

- CRYSTAL INVESTMENTS remains separate from SUPA AI.
- Supabase remains the sole authoritative application backend. No browser-local storage is used for investor accounts or financial records.
- KES is the only currency for new transactions. Historical USD/GBP records are preserved and not rewritten.
- The agreed eight investment divisions remain the only divisions; the migration seeds missing divisions as Draft and does not activate them automatically.
- The Super Admin's annual interest rate remains the source for daily accruals. Rate changes are time-effective immediately and daily accrual calculations split the day at rate-change timestamps using the configured 360/365 basis.
- Referral commissions are 20% of verified KES interest earnings only; they are not generated from realised profit or distribution earnings.
- Withdrawal requests are checked against unallocated KES ledger cash and unredeemed recorded interest, less pending allocations and existing withdrawal reservations. Submission does not debit or pay funds.
- Existing financial rows are not deleted, reset, credited, debited or silently corrected by this package.
- Service-role credentials and provider secrets are not included in source files and must never be pasted into chat.

The active deployment entry point is the Next.js `app/` tree with `components/`, `lib/` and `supabase/` backend. Older root-level prototype components are retained from the supplied source archive for traceability; they are not imported by the active app and are not the deployment entry point.

## Frontend work included

- Investor KYC upload and document history.
- Private-document review screen with short-lived signed URLs.
- Investor account statement with recorded balances, posted ledger entries and daily interest history; CSV export.
- KES-only deposit request UI with idempotency key support and M-Pesa prompt/manual-reference/bank-transfer methods.
- KES withdrawal request form with idempotency, available-balance display and reservation checks.
- Admin system-health panel with no secret disclosure, including counts of approved requests missing matching ledger postings.
- Admin financial totals and daily transaction history are derived from posted ledger entries rather than request status alone, so the disputed KES 7T deposit and KES 7 withdrawal are not counted as posted money.
- Admin team directory and branch management; deactivation is soft, not deletion.
- Admin opportunity terms and risk-disclosure editing before activation.
- Referral commission approval/void and manual paid confirmation with provider reference and audit.
- Existing dashboards, site-content controls, role permissions, support inbox, admin conversations, reports, PWA and public-site publication gate retained.

## Backend work included

- `supabase/migrations/202611240001_live_security_and_processing_controls.sql` — incremental, transactional migration draft for the inspected live schema.
- `supabase/verification/202611240001_VERIFY_LIVE_SECURITY_BASELINE.sql` — read-only post-migration verification.
- Supabase Edge Function source for M-Pesa STK initiation/callback verification and protected daily accrual.
- RLS and grants that remove direct authenticated financial-table writes and standardize the legacy admin helper functions on `crystal_admin_memberships`.
- Private KYC Storage bucket and owner/reviewer policies.
- Permission-checked, MFA-protected admin RPCs for editable website settings, KYC, branches/team, opportunity terms, referral management, distributions, analytics and system health.
- Idempotent deposit and withdrawal request submission.

## Deliberately paused financial actions

The live database inspection found an approved KES 7,000,000,000,000 deposit with no matching ledger credit, and an approved KES 7 withdrawal with no matching ledger debit. These records remain untouched. The migration does not infer that either represents a completed real-world payment.

For that reason, the package keeps these actions disabled until a separately reviewed reconciliation and release step:

- Deposit approval and ledger credit.
- Withdrawal approval and payout completion.
- Investment allocation activation and equal 12.5% allocation across all eight divisions.
- Automated financial processing.
- Refund/reversal execution.

KES deposit requests can be submitted and M-Pesa prompts can be initiated after Edge Function deployment and secrets configuration, but provider callbacks do not credit the ledger. KES withdrawal requests can be submitted and reserved, but they are not paid. Distribution and referral payout completion require a separate provider-confirmed/manual evidence action. No bank payout adapter is included.

The eight divisions are seeded as Draft. No division is automatically activated. Daily accrual is defined in the migration and Edge Function source, but the migration, Edge Function deployment and a protected scheduler still need to be applied/configured and verified.

## Validation performed

- 58 TypeScript/TSX files passed TypeScript transpilation syntax checks (zero syntax failures).
- 22/22 static project-rule checks passed.
- Migration has one `BEGIN` and one `COMMIT`; 45 unique function signatures were found in the draft.
- No full Next.js production build or semantic TypeScript type-check was completed because dependencies were not installed in this working session.
- The SQL migration was not run against Supabase and was not tested against a local PostgreSQL instance.
- No Supabase, Vercel, payment-provider or production deployment changes were made.

## Before deployment

1. Review the migration and verification SQL against the live Supabase schema and current migration history. The project migration history was not available in the expected schema during diagnostics.
2. Test on a separate Supabase staging project restored from a safe backup, including RLS, RPC signatures, KYC Storage policies, M-Pesa retries, idempotency and ledger constraints.
3. Complete documentary reconciliation of the two historical anomalies without changing their records until evidence and a signed correction plan exist.
4. Review the frontend with the actual Supabase project and test accounts; run `npm ci`, `npm run typecheck` (if configured) and `npm run build`.
5. Only then approve and apply the incremental migration, deploy Edge Functions, configure secrets in Supabase, and set a protected daily accrual schedule.

**This is a review-ready source package, not a claim that the platform is production-ready or deployed. Do not run the migration against the live database yet.**
