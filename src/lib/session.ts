import { headers } from "next/headers";

import { auth } from "@/lib/auth";

// Proxy only checks for the session cookie and skips /api entirely, so route
// handlers must validate the session themselves before touching user data.
export async function getSessionUserId(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() });

  return session?.user.id ?? null;
}
