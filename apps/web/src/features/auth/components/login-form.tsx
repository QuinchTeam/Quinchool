"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import {
  AuthCard,
  AuthField,
  AuthFooter,
  AuthLink,
} from "@/features/auth/components/auth-form-parts";
import {
  type LoginValues,
  loginSchema,
} from "@/features/auth/validations/auth";
import { signIn } from "@/lib/auth-client";

export function LoginForm() {
  const router = useRouter();
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

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
      description="Enter your email and password to continue."
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
          <AuthField
            control={form.control}
            name="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            action={
              <AuthLink href="/auth/forget-password">Forgot password?</AuthLink>
            }
          />
          <Button
            type="submit"
            className="w-full"
            disabled={form.formState.isSubmitting}
          >
            Sign in
          </Button>
          <AuthFooter
            text="Don't have an account?"
            href="/auth/register"
            linkLabel="Sign up"
          />
        </form>
      </Form>
    </AuthCard>
  );
}
