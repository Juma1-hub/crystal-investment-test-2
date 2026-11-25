import test from "node:test";
import assert from "node:assert/strict";
import { AuthRateLimiter, policyFor } from "../src/index.mjs";

function makeLimiter() {
  const values = new Map();
  const ctx = { storage: {
    async get(key) { return values.get(key); },
    async put(key, value) { values.set(key, value); },
  } };
  return new AuthRateLimiter(ctx);
}

async function check(limiter, limit, windowMs, now) {
  const response = await limiter.fetch(new Request("https://rate-limit.internal/check", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ limit, windowMs, now }),
  }));
  return { status: response.status, body: await response.json() };
}

test("password sign-in is limited to five attempts per minute", async () => {
  const limiter = makeLimiter();
  for (let i = 0; i < 5; i += 1) {
    const result = await check(limiter, 5, 60_000, 1_000);
    assert.equal(result.status, 200);
    assert.equal(result.body.allowed, true);
  }
  const blocked = await check(limiter, 5, 60_000, 1_000);
  assert.equal(blocked.status, 429);
  assert.equal(blocked.body.allowed, false);
  assert.equal(blocked.body.retryAfter, 60);
  const reset = await check(limiter, 5, 60_000, 61_001);
  assert.equal(reset.status, 200);
});

test("password login is limited but refresh-token renewal is not", () => {
  assert.equal(policyFor("https://app.example/auth/v1/token?grant_type=password", "POST")?.limit, 5);
  assert.equal(policyFor("https://app.example/auth/v1/token?grant_type=refresh_token", "POST"), null);
});

test("signup and password recovery use stricter windows", () => {
  assert.deepEqual(policyFor("https://app.example/auth/v1/signup", "POST")?.limit, 3);
  assert.deepEqual(policyFor("https://app.example/auth/v1/recover", "POST")?.windowMs, 3_600_000);
});

test("edge gateway forwards a private origin token and rewrites to the configured Vercel origin", async () => {
  const worker = (await import("../src/index.mjs")).default;
  const originalFetch = globalThis.fetch;
  let forwarded;
  globalThis.fetch = async request => {
    forwarded = request;
    return new Response("ok", { status: 200 });
  };
  const env = {
    ORIGIN_URL: "https://crystal-test.vercel.app",
    ORIGIN_TOKEN: "test-only-origin-token",
    AUTH_RATE_LIMITER: { idFromName: name => name, get: () => ({ fetch: async () => Response.json({ allowed: true }) }) },
  };
  try {
    const response = await worker.fetch(new Request("https://crystal.example/auth/v1/token?grant_type=password", {
      method: "POST", headers: { "CF-Connecting-IP": "203.0.113.10", "Content-Type": "application/json" }, body: "{}",
    }), env);
    assert.equal(response.status, 200);
    assert.equal(new URL(forwarded.url).hostname, "crystal-test.vercel.app");
    assert.equal(forwarded.headers.get("X-Crystal-Edge-Token"), "test-only-origin-token");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("edge gateway redirects plain HTTP to HTTPS", async () => {
  const worker = (await import("../src/index.mjs")).default;
  const response = await worker.fetch(new Request("http://crystal.example/login"), {});
  assert.equal(response.status, 301);
  assert.equal(response.headers.get("Location"), "https://crystal.example/login");
});
