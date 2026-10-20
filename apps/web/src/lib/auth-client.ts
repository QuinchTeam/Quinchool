import { createAuthClient } from "better-auth/react";

import { apiUrl } from "@/lib/api";
import { apiFetch } from "@/lib/observability/operation";

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
