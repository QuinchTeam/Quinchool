"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
  type ForgetPasswordValues,
  forgetPasswordSchema,
} from "@/features/auth/validations/auth";
import { requestPasswordReset } from "@/lib/auth-client";

export function ForgetPasswordForm() {
  const form = useForm<ForgetPasswordValues>({
    resolver: zodResolver(forgetPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgetPasswordValues) {
    const { error } = await requestPasswordReset({
      email: values.email,
      redirectTo: "/auth/update-password",
    });
    if (error) {
      toast.error(error.message ?? "Could not send reset link");
      return;
    }
    toast.success("If that email exists, a reset link has been sent");
  }

  return (
    <AuthCard
      title="Forgot password"
      description="Enter your email and we'll send you a reset link."
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <AuthField
            control={form.control}
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
          />
          <Button
            type="submit"
            className="w-full"
            disabled={form.formState.isSubmitting}
          >
            Send reset link
          </Button>
          <AuthFooter
            text="Remembered it?"
            href="/auth/login"
            linkLabel="Sign in"
          />
        </form>
      </Form>
    </AuthCard>
  );
}
