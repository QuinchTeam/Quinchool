import type { Metadata } from "next";

import { UpdatePasswordPage } from "@/features/auth/components/update-password-page";

export const metadata: Metadata = { title: "Update Password - Quinchool" };

export default function Page() {
  return <UpdatePasswordPage />;
}
