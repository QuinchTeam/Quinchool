/**
 * Where the NestJS API lives, for the browser to call directly.
 *
 * Spell the host as localhost rather than 127.0.0.1: the session cookie is set
 * on localhost and is not sent to 127.0.0.1, and the two also count as
 * different sites for SameSite purposes.
 */
const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"
).replace(/\/$/, "");

export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

/**
 * Every API request needs the session cookie, which the browser only sends
 * cross-origin when asked.
 */
export const withCredentials = { credentials: "include" } as const;
