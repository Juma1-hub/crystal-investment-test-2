import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

const authProxyFetch: typeof fetch = async (input, init) => {
  if (typeof window === "undefined") return fetch(input, init);
  const rawUrl = input instanceof Request ? input.url : input instanceof URL ? input.toString() : input;
  const parsed = new URL(rawUrl);
  if (parsed.pathname.startsWith("/auth/v1/")) {
    const proxiedUrl = `${window.location.origin}${parsed.pathname}${parsed.search}`;
    if (input instanceof Request) return fetch(new Request(proxiedUrl, input), init);
    return fetch(proxiedUrl, init);
  }
  return fetch(input, init);
};

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (typeof window === "undefined") return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!browserClient) {
    browserClient = createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      global: { fetch: authProxyFetch },
    });
  }
  return browserClient;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}
