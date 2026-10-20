import type { Metadata } from "next";

import { LoginPage } from "@/features/auth/components/login-page";

export const metadata: Metadata = { title: "Login - Quinchool" };

export default function Page() {
  return <LoginPage />;
}
