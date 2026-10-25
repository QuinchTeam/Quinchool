import { getSessionCookie } from "better-auth/cookies";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Check cookie presence here for fast redirects; only the API validates the session.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthRoute = pathname.startsWith("/auth");
  const sessionCookie = getSessionCookie(request);

  if (sessionCookie && isAuthRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!sessionCookie && !isAuthRoute) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Leave framework assets and metadata images public.
  matcher: [
    "/((?!api|_next/static|_next/image|icon|apple-icon|opengraph-image|quinchool-icon-v2.webp|textures).*)",
  ],
};
