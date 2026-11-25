import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const activeRoots = ['app', 'components', 'lib'];
const sourceFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const relative = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(relative);
    else if (/\.(tsx?|jsx?)$/.test(entry.name)) sourceFiles.push(relative);
  }
}
activeRoots.forEach(walk);
const source = sourceFiles.map(file => fs.readFileSync(path.join(root, file), 'utf8')).join('\n');
const migrationPath = 'supabase/migrations/202611240001_live_security_and_processing_controls.sql';
const migration = fs.readFileSync(path.join(root, migrationPath), 'utf8');
const workflowMigration = fs.readFileSync(path.join(root, 'supabase/migrations/202611250001_complete_financial_review_and_payout_workflows.sql'), 'utf8');
const financialUi = fs.readFileSync(path.join(root, 'components/AdminFinancialRequests.tsx'), 'utf8');
const reconciliationMigration = fs.readFileSync(path.join(root, 'supabase/migrations/202611250002_approved_deposit_reconciliation_and_provider_gates.sql'), 'utf8');
const migrationFiles = fs.readdirSync(path.join(root, 'supabase/migrations')).filter(name => name.endsWith('.sql'));
const migrationVersions = migrationFiles.map(name => name.split('_', 1)[0]);
const migrationVersionsUnique = new Set(migrationVersions).size === migrationVersions.length;
const gitignore = fs.readFileSync(path.join(root, '.gitignore'), 'utf8');
const middleware = fs.readFileSync(path.join(root, 'middleware.ts'), 'utf8');
const nextConfig = fs.readFileSync(path.join(root, 'next.config.ts'), 'utf8');
const securityGuide = fs.readFileSync(path.join(root, 'SECURITY-AND-SETUP.md'), 'utf8');
const checks = [
  ['No browser-local financial/account storage', !/\b(localStorage|sessionStorage)\b/.test(source)],
  ['No USD/GBP currency selector in active UI', !/<option(?:\s+value=["'](?:USD|GBP)["'])?\s*>(?:USD|GBP)<\/option>/.test(source)],
  ['KES-only transaction RPC', /p_currency<>'KES'/.test(migration)],
  ['Legacy admin wrappers use crystal_admin_memberships', /create or replace function public\.crystal_is_admin\(\)[\s\S]*?from public\.crystal_admin_memberships/.test(migration)],
  ['Direct authenticated distribution writes are revoked', /revoke insert, update, delete, truncate[^;]*investment_distributions from anon, authenticated/i.test(migration)],
  ['Referral commissions limited to interest earnings', /new\.earning_type='interest'/.test(migration)],
  ['Manual verification is enforced', /check\(manual_enabled = true\)/.test(migration)],
  ['Rate changes use immediate server timestamp', /v_effective_at timestamptz:=clock_timestamp\(\)/.test(migration)],
  ['Daily accrual splits rate segments', /rate_components jsonb/.test(migration) && /lead\(b\.start_at\)/.test(migration)],
  ['M-Pesa server functions included', fs.existsSync(path.join(root, 'supabase/functions/mpesa-stk-push/index.ts')) && fs.existsSync(path.join(root, 'supabase/functions/mpesa-callback/index.ts'))],
  ['Service-role daily accrual endpoint included', fs.existsSync(path.join(root, 'supabase/functions/crystal-daily-accrual/index.ts'))],
  ['M-Pesa manual-reference fallback is available', source.includes('M-Pesa manual reference') && migration.includes('M-Pesa manual reference')],
  ['Public site is unpublished by default', fs.existsSync(path.join(root, 'middleware.ts')) && fs.readFileSync(path.join(root, 'middleware.ts'), 'utf8').includes('CRYSTAL_SITE_PUBLISHED')],
  ['Clear-view actions are present without browser storage', source.includes('Clear view') && !/\b(localStorage|sessionStorage)\b/.test(source)],
  ['No service-role key in browser client', !/NEXT_PUBLIC_[A-Z0-9_]*SERVICE_ROLE/i.test(fs.readFileSync(path.join(root, 'lib/supabase.ts'), 'utf8'))],
  ['.env files are ignored by Git', /(^|\n)\.env\*?(\n|$)/.test(gitignore) && /!\.env\.example/.test(gitignore)],
  ['Environment example contains no real secret values', !/^(?:SUPABASE_SERVICE_ROLE_KEY|SUPABASE_DB_PASSWORD|MPESA_CONSUMER_SECRET|MPESA_PASSKEY|MPESA_CALLBACK_SECRET|SMTP_API_KEY)=\S+/m.test(fs.readFileSync(path.join(root, '.env.example'), 'utf8'))],
  ['Production HTTP redirects to HTTPS', /request\.nextUrl\.protocol === \"http:\"/.test(middleware) && /secureUrl\.protocol = \"https:\"/.test(middleware)],
  ['HSTS and security response headers are configured', /Strict-Transport-Security/.test(middleware) && /X-Content-Type-Options/.test(nextConfig) && /X-Frame-Options/.test(nextConfig)],
  ['Security guide covers RLS/IDOR, Supabase Auth/MFA, validation, Cloudflare WAF and rate limits', ['IDOR','RLS','Supabase Auth','TOTP MFA','parameterized','Cloudflare','rate-limit'].every(term => securityGuide.includes(term))],
  ['KYC bucket is private', /values\('investor-documents','investor-documents',false/.test(migration)],
  ['Branch/team deactivation is soft', migration.includes("set status='Inactive'") && !source.includes('admin_delete_branch')],
  ['Site configuration is read through RPC', !source.includes('from("crystal_site_configuration")')],
  ['Eight agreed divisions are seeded', ['Energy & Petroleum','Agriculture & Agribusiness','Real Estate & Infrastructure','Mining & Minerals','Shipping & Logistics','Technology & Innovation','Global Markets & Securities','General Investments & Acquisitions'].every(name => migration.includes(`'${name}'`))],
  ['Distribution payout requires confirmation evidence', /p_provider_reference[\s\S]*p_confirmation_note/.test(migration) && /payment_confirmation_source/.test(migration)],
  ['Deposit and withdrawal submissions are idempotent', migration.includes('deposit_requests_investor_client_request_uidx') && migration.includes('withdrawal_requests_investor_client_request_uidx')],
  ['Opportunity activation requires reviewed terms and risk disclosure', migration.includes('Complete and approve the opportunity terms and transaction-specific risk disclosure before activation')],
  ['Financial analytics use posted ledger totals and flag unposted approvals', migration.includes("l.source_type='Deposit' and l.entry_type='Credit'") && migration.includes('approved_unposted_deposit_count') && migration.includes('approved_unposted_withdrawal_count')],
  ['Manual deposit approvals use an AAL2-protected RPC', workflowMigration.includes('admin_review_financial_request_v2') && financialUi.includes('admin_review_financial_request_v2') && workflowMigration.includes('perform public.crystal_require_admin_mfa()')],
  ['Deposit approval creates eight equal allocations and one ledger credit', workflowMigration.includes('opportunity_id,source_deposit_id') && workflowMigration.includes('v_deposit.amount-(round(v_deposit.amount/8,6)*7)') && workflowMigration.includes("'Deposit',p_request_id,'Credit'")],
  ['All eight divisions activate for the unpublished test site', workflowMigration.includes("set status='Active'") && workflowMigration.includes('investment_division_activated_for_test')],
  ['Withdrawal approval reserves balance before payout', workflowMigration.includes("set status='approved',reviewed_by=v_actor") && workflowMigration.includes('admin_confirm_withdrawal_payout_manual')],
  ['Withdrawal payout confirmation requires evidence and posts the ledger debit', workflowMigration.includes('p_provider_reference') && workflowMigration.includes('p_confirmation_note') && workflowMigration.includes("'Withdrawal',p_withdrawal_id,'Debit'")],
  ['Approved unpaid withdrawals can be cancelled without ledger mutation', workflowMigration.includes('admin_cancel_approved_withdrawal') && workflowMigration.includes('cancellation_reason')],
  ['Withdrawal balance includes ledger cash and unredeemed interest', workflowMigration.includes('v_available:=v_ledger_cash+v_earnings-v_reserved')],
  ['Daily accrual worker uses the current allocation record', !workflowMigration.includes('v_allocation.') && !migration.includes('v_allocation.')],
  ['Internal eight-division allocation remains automatically enabled', workflowMigration.includes("values('allocations',true,true,now())") && workflowMigration.includes('Automatic equal allocation across the eight divisions is a required processing rule')],
  ['Financial action buttons are connected to the review and payout RPCs', financialUi.includes('admin_review_financial_request_v2') && financialUi.includes('admin_confirm_withdrawal_payout_manual') && !financialUi.includes('disabled={true}')],
  ['Website UI contains no unfinished/development status messages', !/['\"`][^'\"`]*(?:Supabase is not configured|under development|migration has not been installed)[^'\"`]*['\"`]/i.test(source)],
  ['Auth requests use the same-origin rate-limited proxy', fs.readFileSync(path.join(root, 'lib/supabase.ts'), 'utf8').includes('authProxyFetch') && nextConfig.includes('/auth/v1/:path*') && nextConfig.includes('SUPABASE_URL')],
  ['Public registration API remains closed before publication', middleware.includes('/auth/v1/signup') && middleware.includes('CRYSTAL_SITE_PUBLISHED')],
  ['Direct-origin bypass is rejected when Cloudflare edge enforcement is enabled', middleware.includes('CRYSTAL_REQUIRE_CLOUDFLARE_EDGE') && middleware.includes('CRYSTAL_EDGE_ORIGIN_TOKEN') && fs.readFileSync(path.join(root, 'cloudflare/src/index.mjs'), 'utf8').includes('X-Crystal-Edge-Token')],
  ['Cloudflare edge redirects HTTP to HTTPS', fs.readFileSync(path.join(root, 'cloudflare/src/index.mjs'), 'utf8').includes('Response.redirect(url.toString(), 301)')],
  ['Cloudflare Durable Object rate limits password, signup and recovery endpoints', fs.existsSync(path.join(root, 'cloudflare/src/index.mjs')) && fs.existsSync(path.join(root, 'cloudflare/wrangler.toml.example')) && fs.readFileSync(path.join(root, 'cloudflare/src/index.mjs'), 'utf8').includes('password-recovery')],
  ['Cloudflare rate limiter excludes refresh-token renewal', fs.readFileSync(path.join(root, 'cloudflare/src/index.mjs'), 'utf8').includes('grant_type') && fs.readFileSync(path.join(root, 'cloudflare/tests/rate-limiter.test.mjs'), 'utf8').includes('refresh_token')],
  ['Supabase migration versions are unique', migrationVersionsUnique],
  ['Previously approved deposits have an explicit idempotent reconciliation RPC', reconciliationMigration.includes('admin_reconcile_approved_deposit_v2') && reconciliationMigration.includes('Only a previously reviewed and approved deposit can be reconciled') && reconciliationMigration.includes('on conflict(source_type,source_id,entry_type)')],
  ['Approved-deposit reconciliation preserves original approval fields', !/update public\.deposit_requests[\s\S]*?set status/.test(reconciliationMigration) && reconciliationMigration.includes('approved_deposit_reconciled')],
  ['Approved-deposit reconciliation requires Supa Admin MFA', reconciliationMigration.includes('crystal_is_supa_admin()') && reconciliationMigration.includes('crystal_require_admin_mfa()')],
  ['Admin can reconcile previously approved deposits from the financial queue', financialUi.includes('admin_reconcile_approved_deposit_v2') && financialUi.includes('Verify / complete posting')],
  ['Automatic processing can be enabled only after recent provider verification', reconciliationMigration.includes("p.verified_at>now()-interval '24 hours'") && reconciliationMigration.includes('Manual verification must remain enabled')],
];
let failed = 0;
for (const [label, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'}  ${label}\n`);
  if (!ok) failed++;
}
process.stdout.write(`\n${checks.length - failed}/${checks.length} project-rule checks passed.\n`);
process.exitCode = failed ? 1 : 0;
