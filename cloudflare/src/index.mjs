const AUTH_POLICIES = [
  { key: "password-login", path: "/auth/v1/token", method: "POST", grant: "password", limit: 5, windowMs: 60_000 },
  { key: "signup", path: "/auth/v1/signup", method: "POST", limit: 3, windowMs: 10 * 60_000 },
  { key: "password-recovery", path: "/auth/v1/recover", method: "POST", limit: 3, windowMs: 60 * 60_000 },
  { key: "email-verification", path: "/auth/v1/verify", method: "POST", limit: 6, windowMs: 60_000 },
  { key: "otp-request", path: "/auth/v1/otp", method: "POST", limit: 5, windowMs: 60_000 },
  { key: "password-update", path: "/auth/v1/user", method: "PUT", limit: 5, windowMs: 10 * 60_000 },
];

export function policyFor(requestUrl, method) {
  const url = new URL(requestUrl);
  return AUTH_POLICIES.find(policy => {
    if (url.pathname !== policy.path || method.toUpperCase() !== policy.method) return false;
    if (policy.grant && url.searchParams.get("grant_type") !== policy.grant) return false;
    return true;
  }) || null;
}

export class AuthRateLimiter {
  constructor(ctx) {
    this.ctx = ctx;
    this.queue = Promise.resolve();
  }

  async fetch(request) {
    const { limit, windowMs, now = Date.now() } = await request.json();
    const operation = this.queue.then(async () => {
      let bucket = await this.ctx.storage.get("window");
      if (!bucket || now - bucket.startedAt >= windowMs || now < bucket.startedAt) {
        bucket = { startedAt: now, count: 0 };
      }
      if (bucket.count >= limit) {
        const retryAfter = Math.max(1, Math.ceil((bucket.startedAt + windowMs - now) / 1000));
        return { allowed: false, retryAfter };
      }
      bucket.count += 1;
      await this.ctx.storage.put("window", bucket, { expirationTtl: Math.ceil(windowMs / 1000) + 5 });
      return { allowed: true, remaining: Math.max(0, limit - bucket.count) };
    });
    this.queue = operation.then(() => undefined, () => undefined);
    const result = await operation;
    return Response.json(result, { status: result.allowed ? 200 : 429 });
  }
}

function rateLimitedResponse(retryAfter) {
  return Response.json(
    { code: 429, error: "rate_limit_exceeded", message: "Too many attempts. Please wait before trying again." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
    },
  );
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.protocol === "http:") {
      url.protocol = "https:";
      return Response.redirect(url.toString(), 301);
    }
    const policy = policyFor(url, request.method);
    if (policy) {
      const ip = request.headers.get("CF-Connecting-IP");
      if (!ip) return new Response("Forbidden", { status: 403 });
      const id = env.AUTH_RATE_LIMITER.idFromName(`${ip}:${policy.key}`);
      const limiter = env.AUTH_RATE_LIMITER.get(id);
      const resultResponse = await limiter.fetch("https://rate-limit.internal/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: policy.limit, windowMs: policy.windowMs, now: Date.now() }),
      });
      const result = await resultResponse.json();
      if (!result.allowed) return rateLimitedResponse(result.retryAfter);
    }

    if (!env.ORIGIN_URL || !env.ORIGIN_TOKEN) {
      return new Response("Service unavailable", {
        status: 503,
        headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
      });
    }
    const origin = new URL(env.ORIGIN_URL);
    const upstreamUrl = new URL(request.url);
    upstreamUrl.protocol = origin.protocol;
    upstreamUrl.hostname = origin.hostname;
    upstreamUrl.port = origin.port;
    const upstreamHeaders = new Headers(request.headers);
    upstreamHeaders.delete("host");
    upstreamHeaders.set("X-Crystal-Edge-Token", env.ORIGIN_TOKEN);
    const upstreamInit = { method: request.method, headers: upstreamHeaders, redirect: request.redirect };
    if (request.method !== "GET" && request.method !== "HEAD") {
      upstreamInit.body = request.body;
      upstreamInit.duplex = "half";
    }
    const upstreamRequest = new Request(upstreamUrl.toString(), upstreamInit);
    const upstreamResponse = await fetch(upstreamRequest);
    const headers = new Headers(upstreamResponse.headers);
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    headers.set("X-Frame-Options", "DENY");
    headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    if (url.pathname.startsWith("/auth/v1/")) headers.set("Cache-Control", "no-store");
    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers,
    });
  },
};
