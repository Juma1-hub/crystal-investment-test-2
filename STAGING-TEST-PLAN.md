# CRYSTAL INVESTMENTS — controlled staging test plan

Run these tests only on a protected Vercel Preview deployment connected to a restored staging/clone database. Do not use real investor money or alter the live database during this test pass.

## A. Access and security

1. Keep Production `CRYSTAL_SITE_PUBLISHED=false`. Confirm public routes return 404 and public registration API `/auth/v1/signup` is blocked.
2. Set Preview `CRYSTAL_SITE_PUBLISHED=true` only while Vercel Deployment Protection is enabled. Confirm the Preview URL requires authorised access.
3. Confirm Supa Admin can sign in, enrol TOTP MFA and reach AAL2. Confirm sensitive admin actions fail without AAL2.
4. Confirm Junior Admins can access only the modules/permissions assigned to them; attempt direct RPC calls to unauthorised admin functions and expect denial.
5. Create two investor accounts. Attempt to read or mutate the other investor's profile, deposits, withdrawals, KYC files, statements and earnings by changing IDs. All attempts must be denied.
6. Confirm direct browser writes to ledger, allocations, earnings, payouts, admin membership and audit tables are denied.
7. Confirm no service-role or provider secret appears in page source, browser bundles, network responses or Git-tracked files.

## B. Cloudflare Auth protection

1. Configure the Cloudflare Worker and origin token as described in `cloudflare/README.md`.
2. Confirm a direct request to the Vercel origin is rejected when `CRYSTAL_REQUIRE_CLOUDFLARE_EDGE=true`.
3. Submit five password-login attempts from one test IP in one minute; the sixth should receive HTTP 429.
4. Confirm signup, recovery, verification, OTP and password-update limits match the Worker policy.
5. Confirm refresh-token renewal is not rate-limited by the password-login policy.
6. Confirm Supabase Auth CAPTCHA and built-in Auth limits are enabled as a second layer.

## C. Divisions and deposit approval

1. Apply migrations 24, 25 and 26 to the staging clone in order, then run all matching verification SQL.
2. Confirm exactly eight canonical divisions are Active, KES-only, and each has a terms version and non-empty risk disclosure.
3. Submit a new KES 800.00 bank-transfer/manual-reference deposit from a staging investor using a unique client request ID.
4. Confirm the request appears in the admin Deposit approvals queue and is not credited before approval.
5. As an authorised admin with AAL2, approve it with a meaningful review note.
6. Confirm exactly one KES 800.00 ledger Credit exists for the deposit source ID.
7. Confirm exactly eight active allocations exist for that deposit, each KES 100.00, and their sum is exactly KES 800.00.
8. Confirm the deposit approval and allocation events appear in the audit log.
9. Confirm a reused idempotency key with changed amount/details is rejected and no duplicate credit/allocation is created.
10. Reject a separate pending deposit and confirm it creates no ledger credit or allocations.

## D. Withdrawal reservation and payout

1. Submit a KES 50.00 withdrawal request with valid M-Pesa or bank destination details.
2. Confirm the request is pending and the available balance reflects the reservation.
3. Approve it with AAL2 and a review note. Confirm no ledger Debit is posted and the request remains unpaid/approved.
4. Cancel a second approved unpaid request. Confirm its reservation is released and no ledger entry is created.
5. For the first request, use a staging-only simulated payout reference and a detailed verification note. Confirm the payout through the separate admin action.
6. Confirm the request becomes Paid, one KES 50.00 ledger Debit exists, the payout reference is unique, and principal/interest/unallocated cash reductions reconcile to KES 50.00.
7. Attempt to confirm the same payout again or reuse its provider reference. The duplicate must be rejected.
8. Confirm an approved payout cannot be marked Paid with a blank/short reference or inadequate verification note.

## E. Earnings, referrals and reporting

1. Confirm the effective annual rate and day-count basis are present in the rate history.
2. Configure the Vault-backed pg_cron job on staging using `supabase/schedules/README.md`; confirm it runs at 01:05 EAT.
3. Invoke the daily accrual worker using service-role credentials in staging for a completed Kenya-local day. Confirm one accrual per active allocation/day and no duplicate rows on retry.
4. Confirm an authenticated investor cannot invoke the daily accrual worker/RPC.
5. Confirm rate changes use their exact effective timestamp and daily accrual segments split correctly around an intraday rate change.
6. Confirm referral commission is 20% of verified KES interest earnings only; non-interest earnings must not create commissions.
7. Confirm admin analytics totals derive from ledger postings and pending request totals are separate.
8. Confirm investor statements show ledger entries, daily income and reconciled balances.

## F. Acceptance criteria

- No cross-investor data access or unauthorised admin action succeeds.
- No duplicate deposit credit, allocation, withdrawal debit, payout reference or daily accrual is possible.
- Manual review remains enabled for every financial category.
- Eight-division allocation is automatic after an authorised deposit approval.
- Withdrawals are not debited or marked Paid before separately verified payout confirmation.
- All financial actions have audit records.
- No test operation modifies live financial records.
- Full Next.js production build and PostgreSQL migration tests pass before live deployment.

Automatic M-Pesa deposit approval and automatic withdrawal payout are separate payment-integration tasks. Keep them disabled until their provider adapters, verified callbacks, idempotency and sandbox tests pass.
