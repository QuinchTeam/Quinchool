import { createAuthClient } from "better-auth/react";

import { apiUrl } from "@/lib/api";
import { apiFetch } from "@/lib/observability/operation";

// The API issues sessions now, so the client has to be told where they live.
// Its default base path (/api/auth) is what the API mounts the handler on.
export const authClient = createAuthClient({
  baseURL: apiUrl(""),
  fetchOptions: { customFetchImpl: apiFetch },
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  requestPasswordReset,
  resetPassword,
  updateUser,
} = authClient;
