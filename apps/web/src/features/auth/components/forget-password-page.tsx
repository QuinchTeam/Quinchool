"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import {
  AuthCard,
  AuthField,
  AuthFooter,
  withEmail,
} from "@/features/auth/components/auth-form-parts";
import {
  type ForgetPasswordValues,
  forgetPasswordSchema,
} from "@/features/auth/validations/auth";
import { requestPasswordReset } from "@/lib/auth-client";

export function ForgetPasswordPage() {
  const initialEmail = useSearchParams().get("email") ?? "";
  const form = useForm<ForgetPasswordValues>({
    resolver: zodResolver(forgetPasswordSchema),
    defaultValues: { email: initialEmail },
  });
  const email = form.watch("email");

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
      scene="forget"
      description="Enter your email and we'll send you a reset link."
      footer={
        <AuthFooter
          text="Remembered it?"
          href={withEmail("/auth/login", email)}
          linkLabel="Sign in"
        />
      }
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
            placeholder="you@example.com"
          />
          <Button
            type="submit"
            className="w-full"
            loading={form.formState.isSubmitting}
            loadingText="Sending..."
          >
            Send reset link
          </Button>
        </form>
      </Form>
    </AuthCard>
  );
}
