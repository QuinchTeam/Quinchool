import { createAuthClient } from "better-auth/react";

import { apiUrl } from "@/lib/api";

// The API issues sessions now, so the client has to be told where they live.
// Its default base path (/api/auth) is what the API mounts the handler on.
export const authClient = createAuthClient({ baseURL: apiUrl("") });

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  requestPasswordReset,
  resetPassword,
} = authClient;
