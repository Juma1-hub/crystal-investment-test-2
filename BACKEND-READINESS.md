# CRYSTAL INVESTMENTS — backend readiness checkpoint (25 November 2026)

## Source of truth

The baseline came from the 23 November 2026 archive `crysatlinvestments-test-version--main.zip` (184 entries); the current source includes the 24–25 November security and financial workflow updates, Cloudflare Auth rate limiting and daily accrual schedule template. This project is separate from SUPA AI.

## Current architecture

- Active frontend: Next.js 15 / React 19 under `app/` and `components/`.
- Backend: Supabase Auth, Postgres tables, RLS and `SECURITY DEFINER` RPCs.
- Browser client uses only the Supabase publishable/anon key. No service-role key is used in browser code.
- Active investor/admin records are loaded from Supabase. No browser `localStorage` or `sessionStorage` is used in active `app/`, `components/` or `lib/` source.
- Supabase Edge Function source is included for M-Pesa STK initiation, M-Pesa callback query/verification, and protected daily accrual. KYC uploads use a private Supabase Storage bucket with owner-only and KYC-reviewer read policies.

## Agreed rules implemented in this revision

- New account and transaction currency is KES only. Historical USD/GBP financial rows remain in their original currency and are not converted or deleted.
- Registration defaults country to Kenya and validates Kenyan phone formats beginning `+254`, `07` or `01`.
- Investor overview displays a KES zero balance when no KES balance row exists; it does not display a fabricated zero when the balance RPC fails.
- Daily income is read from recorded daily accrual rows. The new accrual RPC calculates completed Kenya-local days and splits days at exact interest-rate effective timestamps using the selected 360/365 basis.
- Interest rate changes take effect at the exact server save timestamp. The RPC ignores client-supplied backdated/future timestamps. Previously recorded accruals are not rewritten.
- The 25 November completion migration activates all eight agreed divisions for the unpublished test site; the final project-specific disclosures must be approved before public launch. The public division list is read through a Supabase RPC and does not expose draft investment status.
- Investor KYC upload and reviewer workflows use a private storage bucket, authenticated owner policies, signed URLs for reviewers and audited AAL2 review actions.
- Branch records are managed through permission-checked RPCs; deactivation is soft and retains the row.
- Daily accrual processing writes idempotent verified `interest` earnings, which trigger a single 20% referral commission when the investor has a referrer. Referral commission payout remains manual and requires a verified provider reference plus an audited AAL2 confirmation. Deposits, principal, realised profit and unrelated income types do not qualify for new commissions.
- Manual verification is enforced as always enabled in transaction-processing settings. Eight-division allocation is automatic after manual deposit approval; external payment automation remains gated until a trusted provider capability and real processing adapter are deployed and verified.
- Supa Admin Clear view controls do not delete database records; support archive is a separate audited archive operation.
- Distribution approval is separate from payout confirmation. `Paid` requires a provider event or an independently verified manual confirmation, AAL2 and an atomic ledger/audit post.
- Legacy admin helper functions are standardized on `crystal_admin_memberships` in the draft incremental migration.

## Critical live-database findings

- The live database has two admin membership systems. `admin_memberships` was empty; `crystal_admin_memberships` contained the active Supa Admin and Junior Admin.
- Broad permissive RLS policies bypassed some module-specific permissions.
- Authenticated users had direct INSERT/UPDATE/DELETE/TRUNCATE privileges on `investment_distributions`.
- Distribution RPCs expected by the active frontend were missing from the live database.
- The live integrated-financial-controls migration was incomplete: 12 of 13 expected columns were missing in the earlier comparison. The new draft migration adds the missing fields without rewriting historical financial rows.
- The KES 7 trillion approved deposit had no matching ledger credit. The KES 7 approved withdrawal had no matching ledger debit. Neither anomaly has been automatically credited/debited or otherwise changed.
- Investment allocations were pending; investment opportunities and site configuration were empty at the time of diagnostics.
- Live project migration history was not available in the expected project migration-history table.

## Financial test workflow added 25 November

The incremental migrations `202611250001_complete_financial_review_and_payout_workflows.sql` and `202611250002_approved_deposit_reconciliation_and_provider_gates.sql` add a manual deposit/withdrawal review RPC, an idempotent deposit ledger credit with eight equal active allocations, withdrawal approval as a balance reservation, separate manual payout confirmation with provider reference and independent verification note, and audited cancellation of an approved unpaid withdrawal. Withdrawal submission and investor balance summaries use the same ledger-plus-interest balance basis. The migration also fixes the daily accrual worker's allocation variable reference and aligns processing controls so automatic processing can be enabled after a trusted adapter is deployed and recently verified. Migration 26 adds a separate idempotent, MFA-protected reconciliation action for previously approved but unposted deposits; it does not rewrite their original approval fields. Manual verification remains mandatory. Automatic deposit/withdrawal payment execution remains disabled until provider integration is deployed and verified.

## Not yet production-ready

- None of the incremental migrations `202611240001_live_security_and_processing_controls.sql`, `202611250001_complete_financial_review_and_payout_workflows.sql`, or `202611250002_approved_deposit_reconciliation_and_provider_gates.sql` has been applied to the live database.
- The migrations have not been executed by PostgreSQL or tested against a clone of the live database.
- The M-Pesa Edge Function source is included but requires Daraja credentials, callback URL, deployment and sandbox testing. Callback verification records evidence but does not approve/credit a deposit.
- No bank payout adapter is included.
- The daily accrual Edge Function source and Vault/pg_cron scheduler template are included, but no scheduler/cron invocation has been installed.
- Automatic deposit and withdrawal payment execution is not enabled. The manual approval and payout-confirmation workflow is now implemented in source but still needs PostgreSQL/staging tests.
- The full Next.js production build has not been verified because dependency installation timed out in this environment. A TypeScript/JSX syntax transpilation check passed for 102 source files, and 45 static project-rule checks passed.

Do not apply either incremental migration to the live database until the live backup, schema preflight, clone tests and explicit user approval are complete. Preserve the two historical approved requests as-is; new financial workflows do not automatically reconcile or rewrite them.
