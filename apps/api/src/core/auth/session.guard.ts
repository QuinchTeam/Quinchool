import {
  type CanActivate,
  createParamDecorator,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

import { PrismaService } from "../database/prisma/prisma.service";

// HTTPS session cookies use the __Secure- prefix.
const COOKIE_NAMES = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token",
];

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
      throw new UnauthorizedException({
        code: "UNAUTHENTICATED",
        message: "Sign in to continue.",
      });
    }

    const session = await this.prisma.session.findUnique({
      where: { token },
      select: { expiresAt: true, userId: true },
    });

    if (!session || session.expiresAt <= new Date()) {
      throw new UnauthorizedException({
        code: "SESSION_EXPIRED",
        message: "Your session expired. Sign in again.",
      });
    }

    request.userId = session.userId;
    return true;
  }
}

// Only routes protected by SessionGuard have a resolved user ID.
export const UserId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().userId as string,
);

// Session lookup validates the token; strip the cookie signature before lookup.
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
