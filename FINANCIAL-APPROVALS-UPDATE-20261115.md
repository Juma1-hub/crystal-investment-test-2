# Financial approvals UI update — 15 November 2026

## Included in this update
- Deposit and withdrawal request tables now expose Approve and Reject actions for requests in pending/review states.
- Actions call the existing `public.admin_review_financial_request(text, uuid, text)` Supabase RPC; the browser does not directly update financial request rows.
- The UI checks the current Supabase MFA assurance level (`aal2`) before enabling a review attempt. The database function independently enforces MFA, admin role/permission, status transitions, transaction locks, allocation/ledger posting and audit logging.
- Request lists refresh after a successful or failed decision.

## Required existing migrations
The RPC and the eight-division allocation/proportional withdrawal logic are defined in the existing migration:
`supabase/migrations/202611130008_integrated_financial_controls.sql`

The analytics summary RPC and granular admin read policies are defined in:
`supabase/migrations/202611150001_admin_permissions_and_access_hardening.sql`

The project also contains a duplicate migration version prefix (`202611110002`) for two different SQL files. Inspect Supabase migration history before applying or reconciling any migration. Do not blindly replay migrations.

## Conditions enforced by the database before approving a deposit
- `financial_operations_enabled` must be explicitly enabled by Supa Admin using the protected control.
- All eight fixed investment divisions must be active and support the deposit currency.
- An effective annual interest rate must exist.
- The deposit must still be pending/reviewable.
- The approval transaction creates exactly eight allocations and a ledger credit atomically.

## Conditions enforced by the database before approving a withdrawal
- The withdrawal must still be pending/reviewable.
- MFA and withdrawal permission are required.
- Investor/currency locking and reserved-request checks run server-side.
- Principal is reduced proportionally across active allocations; eligible accrued earnings are redeemed if needed.
- Ledger debit and audit record are written in the same transaction.

## Not included / external prerequisites
- No Safaricom Daraja STK Push credentials, initiation endpoint, callback endpoint, callback signature/receipt validation, or provider reconciliation integration exists in this source. Therefore M-Pesa cannot be automatically confirmed by this update; manual review remains the only truthful option until a real provider integration is configured and tested.
- No automatic bank confirmation integration is present.
- Automatic approval must never be based on investor-entered references alone.

## Operational warning
The previously reported live Supabase data has significant deposit/ledger/allocation/withdrawal discrepancies, including unusually large test-looking amounts. Do not enable real-money financial operations until those records are reconciled against source evidence and the live schema/migration history is inspected. This update does not change live data, execute migrations, or turn the financial operations switch on.
