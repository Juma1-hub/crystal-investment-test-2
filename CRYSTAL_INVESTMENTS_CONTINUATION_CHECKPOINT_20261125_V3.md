# CRYSTAL INVESTMENTS — continuation checkpoint V3
Date: 25 November 2026

## Project rules
- Keep CRYSTAL INVESTMENTS separate from SUPA AI.
- Use the latest V3 frontend/backend source ZIP as the source of truth; inspect before editing.
- Preserve existing working features. Supabase is the authoritative backend.
- Never expose/request service-role keys, passwords, provider secrets or origin tokens. `.env*` stays out of Git except `.env.example`.
- Enforce Supabase Auth, RLS, ownership checks, server-side authorization, MFA/AAL2 for admin financial actions, server-side validation, HTTPS, Cloudflare WAF/rate limits.
- Never delete, overwrite, reset or silently alter existing financial records. Obtain explicit approval before live database changes.
- Do not show development, setup, migration or Supabase-background status messages on the website.
- Keep the public site unpublished until the user chooses.
- Do not claim 100% operational completion until full build, PostgreSQL/staging migration and end-to-end tests pass.

## Business rules
- Eight divisions: Energy & Petroleum; Agriculture & Agribusiness; Real Estate & Infrastructure; Mining & Minerals; Shipping & Logistics; Technology & Innovation; Global Markets & Securities; General Investments & Acquisitions.
- No packages/tiers. Individual investor accounts; shared-project returns/losses allocated by contribution.
- KES only for new transactions; preserve historical USD/GBP rows.
- Each new approved deposit is allocated equally (12.5%) across all eight divisions.
- Deposit methods: M-Pesa prompt, M-Pesa manual reference, bank transfer/manual review.
- Manual approval remains available at all times. Automatic processing only after trusted provider adapter deployment and recent verification; uncertain/failed transactions route to manual review.
- Withdrawal approval reserves funds; never debit/mark paid before confirmed payout. Manual payout confirmation requires provider reference and independent evidence.
- Super Admin annual rate, daily accrual at 360/365 basis, exact effective timestamp and intraday split; never rewrite historical earnings.
- Referral commission is 20% of verified KES interest earnings only.

## Latest source
- ZIP: `/mnt/data/CRYSTAL_INVESTMENTS_FRONTEND_BACKEND_TEST_RELEASE_20261125_V3.zip`.
- Working tree: `/mnt/data/crystal_v3_review/crysatlinvestments-test-version--main`.
- Delivery report: `DELIVERY-REPORT-20261125-V3.md`.

## New V3 changes
- Resolved duplicate Supabase migration version: `202611110002_referral_program.sql` renamed to `20261111000230_referral_program.sql`, preserving order before `202611110003`.
- Added migration `202611250002_approved_deposit_reconciliation_and_provider_gates.sql`.
- Added explicit, idempotent, Super-Admin/AAL2-only reconciliation RPC for previously approved deposits. It verifies or creates one ledger credit and eight allocations, preserves the original deposit request approval fields, and audits the action. It is not automatically executed.
- Added “Verify / complete posting” action to the approved-deposit admin queue.
- Provider auto-processing mode can be enabled only when a matching provider capability has been verified within 24 hours; manual verification must remain on. Internal allocation stays automatic and mandatory.
- Added `VERIFY_APPROVED_DEPOSIT_RECONCILIATION_20261125.sql`.
- Updated setup, migration-order, and staging-test documentation.

## Validation
- Project rules 51/51 passed.
- Cloudflare Worker tests 5/5 passed.
- Active app TypeScript/TSX syntax parse 54 files, zero syntax errors.
- 13 migration versions unique; SQL dollar quote delimiters balanced; migrations 24/25/26 each have BEGIN/COMMIT.
- ZIP integrity and secret scan passed.
- `npm install` timed out. No full semantic TS check or Next build.
- No PostgreSQL server/client available; migrations not parser/execution tested on clone.
- No live Supabase migration, Edge Function, Cloudflare Worker or scheduler deployed. No live financial records changed.

## Financial records
- User confirms KES 7 trillion deposit was manually approved. Preserve the request. Do not auto-credit it. Use the new explicit Super-Admin reconciliation action only with AAL2 and a detailed note, after reviewing the record; the function is idempotent and audits the posting.
- KES 7 approved withdrawal remains unchanged and unpaid without actual payout evidence.

## Next steps
1. Run full npm install, `npx tsc --noEmit`, and `npm run build` in a network-enabled environment.
2. Review migration 24, 25, 26 against live schema/history and test all on a staging clone; never run fresh-install SQL against existing live database.
3. Run verification SQL and the full staging plan, including approved-deposit reconciliation with a synthetic staging request, not a real payment.
4. Configure/deploy Cloudflare, Supabase Auth CAPTCHA/rate limits, Vercel origin protection, daily accrual scheduler and M-Pesa sandbox adapter.
5. Only after staging passes and explicit user approval, deploy to production.
