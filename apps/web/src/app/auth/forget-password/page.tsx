import type { Metadata } from "next";
import { Suspense } from "react";

import { ForgetPasswordPage } from "@/features/auth/components/forget-password-page";

export const metadata: Metadata = { title: "Forgot Password - Quinchool" };

export default function Page() {
  return (
    <Suspense>
      <ForgetPasswordPage />
    </Suspense>
  );
}
