# CRYSTAL INVESTMENTS — Integrated financial and administration update

This update is based on the latest project archive supplied on 13 November 2026. It preserves the existing app structure and adds the integrated changes described below.

## Supabase migration

New migration:

`supabase/migrations/202611130008_integrated_financial_controls.sql`

Apply it only after the existing CRYSTAL INVESTMENTS base migrations (investor profiles, referral programme, financial/admin foundation, and interest/support controls) are present. The migration is written to preserve existing financial records and add the missing fields/functions. It seeds the eight fixed website divisions if they are absent; it does not overwrite existing division records.

The eight allocation destinations are fixed:

1. Energy & Petroleum
2. Agriculture & Agribusiness
3. Real Estate & Infrastructure
4. Mining & Minerals
5. Shipping & Logistics
6. Technology & Innovation
7. Global Markets & Securities
8. General Investments & Acquisitions

Newly seeded divisions start in `Draft`. All eight must be changed to `Active`, support the deposit currency, and have an effective Supa Admin interest rate before an approved deposit can be automatically invested. The platform financial-operations switch also defaults to **disabled**. This is intentional: do not enable deposits or investment approvals until the required legal/regulatory authorisations and definitive opportunity terms are in place.

## Agreed financial rules

- Each approved deposit is allocated equally across the eight fixed divisions (12.5% each). Allocation precision is six decimal places; the final division receives the exact remainder so the eight allocations equal the approved deposit.
- Allocation creation is atomic and idempotent per deposit/division. The manual allocation RPCs are disabled; the portfolio screen is a record view.
- The active global annual rate and day-count basis are copied to each new allocation. Only Supa Admin can change the global rate.
- A withdrawal request is checked against the investor's available balance on the server. Pending withdrawals reserve funds.
- On approval, principal is reduced proportionally across the investor's active allocations in that currency. Accrued earnings are redeemed if the withdrawal exceeds principal. The ledger records the full debit.
- KES, USD and GBP remain separate. Consolidated admin totals require current FX rates entered by Supa Admin; totals are not guessed when rates are missing.
- Manual deposit review remains available. A provider-event table with unique provider event IDs is prepared for a future automatic verification webhook; no payment-provider credentials or live webhook are included.

## Administration and security

- Supa Admin-only history controls archive eligible activity, support inbox and administrator conversation history. They do not delete financial transactions or audit evidence.
- Admin actions written to the audit log receive the acting administrator's display name. Administrators can set their own display name.
- Junior Admin directory information is masked; complete administrator details and role/permission controls are Supa Admin-only.
- Junior Admin module permissions are enforced by database functions and RLS. Admin reads/actions require a verified AAL2/MFA session.
- Financial operations remain disabled by default. The Supa Admin-only switch is in Platform Settings.

## Validation status

- TypeScript/TSX syntax transpilation was run across the active `app`, `components` and `lib` source trees with no syntax diagnostics.
- ZIP integrity is checked after packaging.
- A full `next build` was **not** verified in this environment because dependencies could not be installed (the npm registry was unavailable and the offline cache did not contain the required packages).
- The SQL migration has **not** been executed against the live Supabase project in this environment. Review/test it on a staging project before applying to production.

## Provider integration still requiring configuration

The manual deposit request/review flow is retained. A real M-Pesa STK push and automatic provider verification require the organisation's authorised Daraja/payment-provider account, server-side secrets, callback URL and provider testing. The database event table is a preparation point, not a claim that provider verification is already live.
