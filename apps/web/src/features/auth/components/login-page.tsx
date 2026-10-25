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
  AuthLink,
  withEmail,
} from "@/features/auth/components/auth-form-parts";
import {
  type LoginValues,
  loginSchema,
} from "@/features/auth/validations/auth";
import { signIn } from "@/lib/auth-client";

export function LoginPage() {
  const router = useRouter();
  const initialEmail = useSearchParams().get("email") ?? "";
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: initialEmail, password: "" },
  });
  const email = form.watch("email");

  async function onSubmit(values: LoginValues) {
    const { error } = await signIn.email(values);
    if (error) {
      toast.error(error.message ?? "Could not sign in");
      return;
    }
    toast.success("Signed in");
    router.push("/");
  }

  return (
    <AuthCard
      title="Sign in"
      scene="login"
      description="Enter your email and password to continue."
      footer={
        <AuthFooter
          text="Don't have an account?"
          href={withEmail("/auth/register", email)}
          linkLabel="Sign up"
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
          <AuthField
            control={form.control}
            name="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            action={
              <AuthLink href={withEmail("/auth/forget-password", email)}>
                Forgot password?
              </AuthLink>
            }
          />
          <Button
            type="submit"
            className="w-full"
            loading={form.formState.isSubmitting}
            loadingText="Signing in..."
          >
            Sign in
          </Button>
        </form>
      </Form>
    </AuthCard>
  );
}
