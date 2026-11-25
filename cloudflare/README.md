# CRYSTAL INVESTMENTS — Cloudflare security gateway

This Worker proxies the public domain to the Vercel origin and rate-limits Supabase Auth requests that the browser routes through the app domain. It uses a Durable Object counter, so attempts are shared across Worker instances rather than stored in process memory.

## Protected authentication requests

| Supabase Auth route | Limit per source IP |
|---|---:|
| Password sign-in (`/auth/v1/token?grant_type=password`) | 5 per minute |
| Sign-up (`/auth/v1/signup`) | 3 per 10 minutes |
| Password recovery (`/auth/v1/recover`) | 3 per hour |
| Email/phone verification (`/auth/v1/verify`) | 6 per minute |
| OTP request (`/auth/v1/otp`) | 5 per minute |
| Password update (`PUT /auth/v1/user`) | 5 per 10 minutes |

Refresh-token requests are deliberately excluded so normal sessions are not interrupted.

## Deployment

1. Add the custom domain to Cloudflare and enable the proxy.
2. Copy `wrangler.toml.example` to `wrangler.toml` and set `ORIGIN_URL` to the Vercel deployment hostname. Replace the example route and zone with the actual domain.
3. Generate a long random origin token. Set it as a Cloudflare Worker secret with `npx wrangler secret put ORIGIN_TOKEN`.
4. In Vercel, set `CRYSTAL_EDGE_ORIGIN_TOKEN` to the same value and set `CRYSTAL_REQUIRE_CLOUDFLARE_EDGE=true` only after the Worker route is active and tested. This blocks direct-origin requests that bypass Cloudflare.
5. From this directory, deploy with `npx wrangler deploy` using the Cloudflare account authorised for the domain.
6. In Cloudflare, enable managed WAF rules, DDoS protection and bot protections for the zone. Keep the Worker route attached to the public hostname.
7. In the hosting environment, set `SUPABASE_URL` to the actual Supabase project URL. This is a server-side URL setting, not a secret.
8. In Supabase Auth settings, enable CAPTCHA and configure the provider's own Auth rate limits as a second layer.
9. Test password sign-in, refresh-token renewal, signup, recovery, verification and password update from both normal and rate-limited IP test cases; also verify that direct requests to the Vercel origin are rejected when edge enforcement is on.

The Worker redirects plain HTTP requests to HTTPS and does not contain Supabase keys or payment credentials. The Vercel origin hostname and Supabase project URL are configuration values, not secret keys. The origin token is a secret and must be stored only as a Cloudflare Worker secret and a private Vercel environment variable. Keep all actual private credentials in their respective encrypted secret stores.

Do not enable the Cloudflare route until the origin URL and custom domain are correct. Cloudflare WAF/DDoS settings and the Worker route require explicit configuration in the Cloudflare account; source files alone do not activate them.
