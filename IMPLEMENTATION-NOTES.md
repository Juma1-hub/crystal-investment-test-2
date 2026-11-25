# CRYSTAL INVESTMENTS — implementation notes (25 November 2026)

## Source archive and workflow

- Current source of truth: `crysatlinvestments-test-version--main.zip`, uploaded 23 November 2026.
- Use the active Next.js app under `app/` and `components/`. Root-level historical prototype files are not the active production application.
- Keep CRYSTAL INVESTMENTS separate from SUPA AI.
- Supabase is the sole authoritative backend. Preserve existing financial records. Do not use local browser storage for account, admin, financial, settings or market records.
- Never request or expose Supabase service-role keys, passwords or provider secrets in chat or browser code.
- Work one step at a time and inspect the live schema before database changes.

## Existing frontend retained

- Public corporate site, division pages, contact/legal pages, investor login/registration and investor dashboard. The eight public investment divisions are now read from the Supabase public RPC rather than a hard-coded page list; editable public copy is read through an allow-listed Supabase RPC.
- Responsive investor navigation and public header/footer branding.
- Admin console with analytics, investors, roles, KYC, opportunities, portfolio, deposits, withdrawals, distributions, team/branches, reports/audit, website content, market conditions, platform settings, system health, interest rates, support and admin conversations.
- PWA manifest, service worker and install assets. Public routes are 404-gated until `CRYSTAL_SITE_PUBLISHED=true`; admin setup and password recovery remain available.
- Supabase authentication/profile reads and database RPC usage.

## Changes made in this revision

### Investor and public UI

- New account currency is fixed to KES; country defaults to Kenya.
- Kenyan phone validation accepts `+254`, `07` and `01` formats.
- No USD/GBP currency selectors remain in active app/components. Historic USD/GBP transactions continue to display in their original currency where returned by Supabase.
- Investor dashboard always includes a KES account card; an empty KES account displays zero values. A failed balance RPC displays an error rather than a misleading zero.
- Dashboard includes latest recorded daily income and cumulative recorded daily income.
- M-Pesa deposit action calls the server-side `mpesa-stk-push` Edge Function. The UI does not claim payment is confirmed when a prompt is merely sent.
- Withdrawal submission checks ledger-backed account value and existing reservations. Approval reserves the amount; payout completion requires a separate manually verified provider reference and evidence note.

### Admin UI

- Admin deposit approval calls the new AAL2-protected review RPC and atomically posts a ledger credit plus eight equal allocations. Withdrawal approval reserves funds; manual payout confirmation posts the debit only after external payment verification.
- Portfolio UI displays the automatically generated eight-division allocations; no manual principal-edit action is exposed.
- Distribution manager separates Draft approval, cancellation and payout confirmation. It does not offer an unverified Mark Paid action.
- Manual distribution payout confirmation requires provider reference, a verification note and AAL2; the backend writes status, ledger credit and audit evidence atomically.
- Super Admin transaction processing controls keep manual verification always on and automatic mode off until a verified provider adapter is registered.
- The eight agreed divisions are activated by the 25 November test migration, with their division-level risk disclosures retained. Final project-specific disclosures must be reviewed before publication.
- Investor KYC document uploads use a private Supabase Storage bucket; only the owner and KYC-authorized reviewers can read the file. Review status changes require the audited AAL2 RPC.
- Branch records use permission-checked RPCs; the Deactivate action retains the branch row instead of deleting it.
- Supa Admin Clear view actions clear only the current frontend display for audit, recent activity, support inbox and admin conversations; they never delete database rows.
- Admin financial summaries show amounts by recorded currency rather than silently converting historic USD/GBP records into KES.

### Supabase backend additions

`supabase/migrations/202611240001_live_security_and_processing_controls.sql` is an incremental migration draft for the existing database. It:

- Unifies old admin helper functions on `crystal_admin_memberships`.
- Removes broad financial RLS policies and authenticated direct financial writes, including distribution TRUNCATE.
- Enforces KES for new financial rows while allowing status updates to existing historic USD/GBP rows without changing their currency.
- Enforces KES-only investment opportunity metadata.
- Adds M-Pesa provider request metadata and an Edge Function verification event table.
- Adds interest-rate save-at-server-time logic, time-weighted Kenya-local daily accrual, rate segment metadata and investor daily-income summary.
- Restricts new referral commissions to verified interest earnings at 20% and audits manual commission review.
- Adds distribution approval/cancellation and provider/manual payout confirmation functions with idempotent ledger posting.
- Adds processing mode settings; manual verification is mandatory, automatic processing is provider-gated and currently off.
- Keeps legacy financial RPCs revoked and exposes new, separately permissioned manual review and payout RPCs. The daily accrual worker is service-role-only and its allocation variable reference is corrected in the follow-on migration.

## Provider integration source

- `supabase/functions/mpesa-stk-push` initiates an STK prompt after authenticating the investor and creating a pending KES request.
- `supabase/functions/mpesa-callback` performs a Daraja STK Query, matches callback metadata to the request, and records provider verification evidence. It does not approve the deposit or post a ledger credit.
- `supabase/functions/crystal-daily-accrual` protects the service-role accrual RPC with a separate cron secret.
- Deployments and secrets are documented in `supabase/functions/README.md` and `LIVE-DATABASE-DEPLOYMENT.md`.
- No bank payout adapter or fully automatic deposit/withdrawal approval adapter is included.

## Verification status (updated 25 November)

- TypeScript/JSX syntax transpilation: 102 source files parsed, zero syntax diagnostics.
- Project-rule static checks: 45/45 passed.
- `npm install` timed out in this environment; `node_modules` was not installed, so `npm run build` and full type-check could not be completed.
- SQL migration was not executed or PostgreSQL-parsed in this environment. It remains a review draft.
- No Supabase schema, settings, payment, investor, ledger or financial records have been changed by this work.

## Outstanding blockers

1. Test the 24 November security migration and 25 November financial workflow migration on a clone of the live database, not a fresh-install DB.
2. Preserve the existing KES 7 trillion deposit and KES 7 withdrawal rows; do not automatically post or reverse either. Use a separate authorised audit process if the ledger later needs reconciliation.
3. Configure and test M-Pesa and bank provider integrations after the core manual workflows pass staging tests.
4. Deploy and sandbox-test M-Pesa Edge Functions with credentials held only in Supabase secrets.
5. Configure and verify the daily accrual scheduler.
6. Complete and independently review eight-division deposit allocation, reserved-balance withdrawal, payout and referral commission payment workflows before enabling financial mutations.
7. Run a full production build and end-to-end tests after dependencies can be installed.

No production deployment or database migration should be performed until the user explicitly approves the reviewed plan and all preflight checks pass.
