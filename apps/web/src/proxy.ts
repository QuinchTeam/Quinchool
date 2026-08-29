import { getSessionCookie } from "better-auth/cookies";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Optimistic auth gating. This only checks that a session cookie is present,
// never that it is valid: the API validates it against the session row on
// every request it serves, and keeping this fast is what the Next.js docs
// recommend.
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
  // Run on everything except Next internals and the favicon. The app serves
  // no API routes of its own; /api is matched out because nothing lives there.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
