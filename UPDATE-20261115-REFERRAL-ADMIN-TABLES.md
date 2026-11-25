# CRYSTAL INVESTMENTS — Referral and Admin Table Update

This update is based on the repository ZIP supplied on 15 November 2026.

## Included source changes
- Added an optional referral-code field to investor registration.
- Prefills the registration referral field from `/register?ref=CODE`.
- Sends the referral code in Supabase Auth signup user metadata. The existing `handle_new_crystal_investor` database trigger consumes this metadata and links a valid code to the new investor.
- Reorganized the investor referral page into currency summary, referral relationship, and commission-history tables.
- Reorganized the Junior Admin permission editor into a table with one grant/revoke checkbox per permission.
- Kept the Admin roles navigation item and rendering restricted to Supa Admin; Junior Admin navigation is filtered by assigned permissions and explicitly excludes Admin roles.
- Improved deposit and withdrawal request tables with request/investor references, amount, method or destination, payment reference/sender, status, received date, and review date, plus request-status counts.
- Changed referral administration to use the existing `admin_list_referral_investors` RPC for investor display names rather than selecting the investor profile table directly.

## Important boundaries
- No SQL migration was added or executed. The existing referral trigger migration already consumes `referral_code` from signup metadata.
- Deposit and withdrawal request screens remain review tables only. This update does not add approval buttons or activate financial mutations because the existing financial records and ledger reconciliation remain unresolved. Enabling approval without the verified transactional RPCs, eight-way allocation, withdrawal reservations, proportional reductions, and account locks would be unsafe.
- The ZIP does not prove a live Supabase connection or successful production build. The runtime dependencies were not installed in this environment; TypeScript checks were attempted and reported missing project dependencies/types. No build success is claimed.
