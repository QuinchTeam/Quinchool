"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import {
  AuthCard,
  AuthField,
  AuthFooter,
} from "@/features/auth/components/auth-form-parts";
import {
  type UpdatePasswordValues,
  updatePasswordSchema,
} from "@/features/auth/validations/auth";
import { resetPassword } from "@/lib/auth-client";

export function UpdatePasswordPage() {
  const router = useRouter();
  const token = useSearchParams().get("token");
  const form = useForm<UpdatePasswordValues>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: { password: "" },
  });

  async function onSubmit(values: UpdatePasswordValues) {
    if (!token) {
      toast.error("Missing or invalid reset token");
      return;
    }
    const { error } = await resetPassword({
      newPassword: values.password,
      token,
    });
    if (error) {
      toast.error(error.message ?? "Could not update password");
      return;
    }
    toast.success("Password updated");
    router.push("/auth/login");
  }

  return (
    <AuthCard
      title="Update password"
      scene="update"
      description="Choose a new password for your account."
      footer={
        <AuthFooter text="Back to" href="/auth/login" linkLabel="Sign in" />
      }
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <AuthField
            control={form.control}
            name="password"
            label="New password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
          />
          <Button
            type="submit"
            className="w-full"
            disabled={!token}
            loading={form.formState.isSubmitting}
            loadingText="Updating..."
          >
            Update password
          </Button>
        </form>
      </Form>
    </AuthCard>
  );
}
