import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginPage } from "@/features/auth/components/login-page";

export const metadata: Metadata = { title: "Login - Quinchool" };

export default function Page() {
  return (
    <Suspense>
      <LoginPage />
    </Suspense>
  );
}
