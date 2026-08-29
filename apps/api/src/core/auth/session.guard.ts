/**
 * Session checking for a better-auth session issued by the web app.
 *
 * better-auth stores every session in Postgres and hands the browser an opaque
 * token, so validating one is a lookup rather than a signature check. That
 * keeps better-auth itself a web-only dependency.
 */

import {
  type CanActivate,
  createParamDecorator,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

import { PrismaService } from "../database/prisma/prisma.service";

// better-auth prefixes the cookie with __Secure- once it sets it over HTTPS.
const COOKIE_NAMES = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token",
];

// Structural, so the guard does not pull in express types the API does not
// otherwise depend on.
interface AuthenticatedRequest {
  headers: { cookie?: string };
  userId?: string;
}

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = readSessionToken(request.headers.cookie);

    if (!token) {
      throw new UnauthorizedException({ error: "Unauthorized" });
    }

    const session = await this.prisma.session.findUnique({
      where: { token },
      select: { expiresAt: true, userId: true },
    });

    if (!session || session.expiresAt <= new Date()) {
      throw new UnauthorizedException({ error: "Unauthorized" });
    }

    request.userId = session.userId;
    return true;
  }
}

/** The id the guard resolved. Only valid on a route the guard protects. */
export const UserId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().userId as string,
);

/**
 * Pulls the session token out of a Cookie header. The cookie value is
 * `<token>.<signature>`; better-auth signs it to detect tampering, but the
 * token is a random secret either way, so the database lookup is what decides.
 *
 * ponytail: hand-parsed to keep cookie-parser out of the dependency list. Swap
 * it in if anything else here needs cookies.
 */
function readSessionToken(header: string | undefined): string | null {
  if (!header) return null;

  for (const part of header.split(";")) {
    const separator = part.indexOf("=");

    if (separator === -1) continue;

    const name = part.slice(0, separator).trim();

    if (!COOKIE_NAMES.includes(name)) continue;

    const value = decodeURIComponent(part.slice(separator + 1).trim());
    const token = value.split(".")[0];

    return token || null;
  }

  return null;
}
