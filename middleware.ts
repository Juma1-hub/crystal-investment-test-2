import { NextRequest, NextResponse } from "next/server";

/**
 * Publication gate and transport hardening.
 * Authentication/authorization remains enforced by Supabase Auth + database RLS/RPC,
 * never by trusting a user ID supplied by the browser.
 */
export function middleware(request: NextRequest) {
  const forwardedHeaders = new Headers(request.headers);
  const suppliedEdgeToken = forwardedHeaders.get("x-crystal-edge-token");
  // When Cloudflare edge enforcement is enabled, reject direct-origin requests that bypass the Worker.
  if (process.env.NODE_ENV === "production" && process.env.CRYSTAL_REQUIRE_CLOUDFLARE_EDGE === "true") {
    const expected = process.env.CRYSTAL_EDGE_ORIGIN_TOKEN;
    if (!expected || suppliedEdgeToken !== expected) return new NextResponse(null, { status: 403 });
  }
  // The origin secret is for Vercel middleware only; never forward it to Supabase or the application.
  forwardedHeaders.delete("x-crystal-edge-token");

  // Never serve production requests over plain HTTP.
  if (process.env.NODE_ENV === "production" && request.nextUrl.protocol === "http:") {
    const secureUrl = request.nextUrl.clone();
    secureUrl.protocol = "https:";
    return NextResponse.redirect(secureUrl, 308);
  }

  if (process.env.CRYSTAL_SITE_PUBLISHED !== "true") {
    const path = request.nextUrl.pathname;
    // Keep public account creation closed until publication; administrator sign-in/recovery remain available.
    if (path === "/auth/v1/signup") return new NextResponse(null, { status: 404 });
    const allowedPrivateRoutes = ["/admin", "/forgot-password", "/reset-password"];
    const isPrivateSetupRoute = allowedPrivateRoutes.some(route => path === route || path.startsWith(`${route}/`));
    const isFrameworkAsset = path.startsWith("/_next/") || path.startsWith("/api/") || path.startsWith("/auth/v1/");
    const isStaticAsset = path === "/manifest.webmanifest" || /\.(?:avif|css|gif|ico|jpeg|jpg|js|json|png|svg|txt|webp|woff2?)$/i.test(path);

    if (!isPrivateSetupRoute && !isFrameworkAsset && !isStaticAsset) {
      return new NextResponse(null, { status: 404 });
    }
  }

  const response = NextResponse.next({ request: { headers: forwardedHeaders } });
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
