import type { Metadata } from "next";

import { RegisterPage } from "@/features/auth/components/register-page";

export const metadata: Metadata = { title: "Register - Quinchool" };

export default function Page() {
  return <RegisterPage />;
}
