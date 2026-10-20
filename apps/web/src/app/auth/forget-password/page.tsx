import type { Metadata } from "next";

import { ForgetPasswordPage } from "@/features/auth/components/forget-password-page";

export const metadata: Metadata = { title: "Forgot Password - Quinchool" };

export default function Page() {
  return <ForgetPasswordPage />;
}
