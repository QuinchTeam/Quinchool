import { getSessionCookie } from "better-auth/cookies";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Optimistic auth gating. This only checks for the presence of the session
// cookie (no DB lookup) — the Next.js docs recommend keeping Proxy fast and
// doing real session validation in the routes/server actions themselves.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthRoute = pathname.startsWith("/auth");
  const sessionCookie = getSessionCookie(request);

  // Signed-in users have no business on the auth pages.
  if (sessionCookie && isAuthRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Everything outside /auth is gated behind a session.
  if (!sessionCookie && !isAuthRoute) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run on all routes except API (incl. /api/auth), Next internals, and the
  // favicon, so auth endpoints and static assets stay reachable.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
