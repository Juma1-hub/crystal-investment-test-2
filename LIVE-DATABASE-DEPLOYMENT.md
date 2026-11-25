# CRYSTAL INVESTMENTS — live database deployment and safety notes

## Current source of truth

Use this repository based on `crysatlinvestments-test-version--main.zip`, uploaded 23 November 2026 (184 entries). Do not substitute older archives or root-level prototype copies for the active Next.js application under `app/` and `components/`.

## Non-negotiable project rules

- Keep CRYSTAL INVESTMENTS separate from SUPA AI.
- Supabase is the sole authoritative backend. Do not use browser localStorage/sessionStorage for investor, financial, admin, market or settings records.
- Preserve every existing financial record. Never reset, truncate, delete, overwrite or silently rewrite ledger/request/allocation/earnings/distribution/referral rows.
- Never create a compensating credit/debit for the historical KES 7 trillion deposit or KES 7 withdrawal without independently verified bank/provider evidence and an audited correction plan.
- New transactions use KES only. Historical USD/GBP rows remain in their original currency and are not converted or deleted.
- The eight investment divisions receive equal 12.5% allocations after all required controls and opportunities are active.
- Shared-project economic returns/losses are proportional to actual contribution.
- Withdrawals must not exceed the investor's available unreserved balance.
- Super Admin controls the annual rate. Daily accrual uses the selected 360/365 basis. A saved rate takes effect immediately at its effective timestamp; historical accruals are not rewritten.
- Referral commission is 20% of verified interest earnings only, not deposits, principal, realised profit or unrelated distribution categories.
- Every transaction category must retain manual verification alongside automatic processing. Automatic mode must remain disabled until a real provider adapter, callback verification and idempotent ledger posting are deployed and verified.
- Junior Admin permissions must be checked in trusted database functions/RLS, not merely hidden in the UI. Supa Admin-only role/rate/security actions require AAL2.
- Never expose service-role keys, provider secrets, database passwords or credentials in the browser or chat.

## What this revision changes

### Frontend

- Registration defaults country to Kenya and validates Kenyan phone formats beginning with `+254`, `07` or `01`.
- New account currency and new transaction forms are KES-only. Historic foreign-currency rows continue to display in their original currency where returned by Supabase.
- Investor overview renders a zero-valued KES account when no balance rows are returned.
- Investor deposit form uses the requested “Request M-Pesa prompt” label but clearly states that the Daraja STK prompt is not actually sent until provider credentials and the provider function are configured.
- Investor withdrawal requests use the server-side available account value (ledger-backed capital plus unredeemed recorded interest, less existing reservations).
- Admin deposit review is available through an AAL2-protected RPC. An approved deposit posts one idempotent ledger credit and creates exactly eight equal active division allocations in the same transaction.
- Admin withdrawal review reserves the approved amount without debiting the ledger. A separate manual payout confirmation requires a provider reference and independent verification note; only then does the database post the debit and reduce unallocated cash, principal and/or recorded interest.
- An approved unpaid withdrawal can be cancelled with an audited reason, releasing its reservation without changing the ledger.
- Distribution management now separates approval from payout completion. A manual payout confirmation requires AAL2, a provider reference and an explanatory note; the database posts the ledger credit and audit record atomically. The UI no longer offers an unverified “Mark paid” action.
- The eight agreed investment divisions are activated for the unpublished test site. Their risk disclosures are retained and the public site remains behind the separate publication gate. Replace generic division-level disclosures with final project-specific documents before public investment solicitation.
- KYC uploads are stored in a private `investor-documents` bucket with owner/reviewer storage policies; reviewer links are short-lived signed URLs.
- Team and branch records are read through permission-specific RLS and written through AAL2 RPCs; deactivation is soft, not a hard delete. The admin opportunity screen uses an audited status RPC.
- Supa Admin-only Clear view actions for recent activity, audit view, support inbox and admin conversations clear only the current frontend view; they do not delete or archive database records. Support-record Archive is a separate audited action that retains the original row.
- Super Admin processing controls expose automatic/manual settings by category. Manual verification is enforced as always-on in the database; automatic remains off unless a trusted provider capability has been registered by a secured backend deployment.
- The annual-rate save RPC records the exact server save timestamp. A service-role-only accrual function calculates completed Kenya-local days and splits each day across rate changes using time-weighted segments. The investor view reads the latest recorded daily accrual and cumulative recorded accruals.

### Backend migration

`supabase/migrations/202611240001_live_security_and_processing_controls.sql` is an incremental migration. It:

- Standardizes legacy admin helper functions on `crystal_admin_memberships`.
- Removes broad financial RLS policies and direct authenticated financial write/TRUNCATE privileges.
- Enforces KES for new financial rows and currency changes while preserving historical foreign-currency rows.
- Revokes legacy four- and five-argument deposit submission overloads and adds a six-argument KES-only pending-request RPC with per-investor idempotency keys.
- Adds M-Pesa STK request metadata and provider verification event storage; Edge Function source is included, but provider secrets and deployment remain user-controlled.
- Adds a service-role-only daily accrual RPC with intraday time-weighted rate segments and a read-only investor daily-income summary.
- The 24 November security baseline revokes legacy financial mutation RPCs. The 25 November completion migration supplies a new manual-review RPC, idempotent eight-division deposit allocation, approved-withdrawal reservation, separate verified payout confirmation and cancellation workflow. It does not rewrite previously approved requests.
- Restricts referral commission creation to verified `interest` earnings.
- Restores distribution RPCs; approval/cancellation are admin operations, while `Paid` requires a provider-confirmed or independently verified manual payout.
- Adds idempotent provider event storage for distribution payout confirmation.
- Adds Super Admin processing-mode controls with manual verification on by default and automatic processing gated by provider readiness.

The repository includes M-Pesa STK initiation and callback-verification Edge Functions, plus a protected daily-accrual endpoint. They remain source code until deployed and configured with provider secrets. The callback queries Daraja and records verification evidence; manual admin approval remains available and is required to post the deposit credit and eight allocations. Automatic deposit processing is not enabled until the payment integration adds a verified auto-approval adapter. No bank payout adapter is included; manual withdrawal payout confirmation is available after an independently verified external payment. The daily accrual RPC and Edge Function require deployment and a protected service-role scheduler; no scheduler is created by the source package itself.

## Publication gate

The Next.js middleware returns 404 for public website, login and registration routes by default. Only `/admin` setup and password-recovery routes plus framework/static assets remain available while unpublished. Set the server-side Vercel environment variable `CRYSTAL_SITE_PUBLISHED=true` only after the user explicitly approves public launch. Do not use a `NEXT_PUBLIC_` prefix for this flag.

## Required pre-deployment workflow

1. Take a Supabase database backup/snapshot using the project's approved backup process.
2. Review the current live schema and the migration SQL in a non-production copy first.
3. Preserve the previously approved KES 7 trillion deposit and KES 7 withdrawal rows. The user confirms the deposit was manually approved; do not automatically credit it again or invent a payout for the withdrawal. Use a separately authorised, audited reconciliation only if the ledger evidence requires it.
4. Review all `SECURITY DEFINER` function definitions, RLS policies and grants against the actual live schema.
5. Test `202611240001_live_security_and_processing_controls.sql` followed by `202611250001_complete_financial_review_and_payout_workflows.sql` and `202611250002_approved_deposit_reconciliation_and_provider_gates.sql` on a clone of the live database. Do not run fresh-install SQL against the live database.
6. Apply only after the user explicitly approves the reviewed migrations and preflight checks pass.
7. Run both verification scripts under `supabase/verification/` and inspect every result.
8. Run the frontend production build and test authentication, MFA, investor isolation, admin permission boundaries, deposit approval/allocation idempotency, withdrawal reservation/payout/cancellation, KES-only inserts, duplicate provider events, daily accrual and audit logs.

## Provider setup still required

To send real M-Pesa prompts, deploy `supabase/functions/mpesa-stk-push` and `supabase/functions/mpesa-callback`. Configure an approved Safaricom Daraja application, Consumer Key/Secret, shortcode, passkey, transaction type, public HTTPS callback URL and `MPESA_ENV`. The callback performs a Daraja STK Query and matches the callback amount/phone/receipt against the pending request. It records provider verification evidence but does not itself approve the deposit or post a ledger credit; an authorised admin can review and approve it manually. Automatic approval is reserved for the next payment-provider integration stage. Store credentials only as Edge Function secrets. Do not paste secrets into source files, Vercel client variables, SQL, or chat.

To accrue daily earnings, deploy `supabase/functions/crystal-daily-accrual`, set a long random `CRON_SECRET` as a Supabase Edge Function secret, and schedule a POST request to the function with header `x-cron-secret: <secret>` once daily at 21:05 UTC (00:05 Kenya time). The endpoint calls the service-role-only `crystal_accrue_all_daily_earnings()` RPC for the completed Kenya-local day. Do not expose the service-role key or cron secret to the browser.

For bank deposits and payouts, configure an approved bank/provider integration and verify provider settlement independently. A user-entered reference or screenshot is not sufficient evidence of payment.

## Important live blockers

- Live migration history is not available in the expected project migration-history table; inspect the actual schema before treating any repository migration as applied.
- The live DB previously showed only two KES 40 ledger credits and no ledger entry for the KES 7 trillion approved deposit.
- The approved KES 7 withdrawal has no matching ledger debit.
- Live allocations were pending; investment opportunities and site configuration were empty at the time of diagnostics.
- The integrated financial controls migration was not fully reflected in the live schema (12 of 13 expected columns were missing in the earlier comparison).
- M-Pesa STK Push and provider payout callbacks are not currently operational.
- The daily accrual function is prepared, but a daily scheduled invocation has not been configured.

Until those blockers are resolved, financial approval, withdrawal, allocation and automatic processing must remain disabled. Read-only investor and admin views can continue to operate subject to RLS.
