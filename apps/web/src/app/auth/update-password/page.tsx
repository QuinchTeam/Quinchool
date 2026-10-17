import { Suspense } from "react";

import { UpdatePasswordForm } from "@/features/auth/components/update-password-form";

export const metadata = { title: "Update password" };

export default function UpdatePasswordPage() {
  return (
    <Suspense>
      <UpdatePasswordForm />
    </Suspense>
  );
}
