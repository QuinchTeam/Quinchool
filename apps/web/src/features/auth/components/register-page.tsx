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
  withEmail,
} from "@/features/auth/components/auth-form-parts";
import {
  type RegisterValues,
  registerSchema,
} from "@/features/auth/validations/auth";
import { signUp } from "@/lib/auth-client";

export function RegisterPage() {
  const router = useRouter();
  const initialEmail = useSearchParams().get("email") ?? "";
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: initialEmail, password: "" },
  });
  const email = form.watch("email");

  async function onSubmit(values: RegisterValues) {
    const { error } = await signUp.email(values);
    if (error) {
      toast.error(error.message ?? "Could not create account");
      return;
    }
    toast.success("Account created");
    router.push("/");
  }

  return (
    <AuthCard
      title="Create an account"
      scene="register"
      description="Sign up with your email and password."
      footer={
        <AuthFooter
          text="Already have an account?"
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
            name="name"
            label="Name"
            autoComplete="name"
            placeholder="Your name"
          />
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
            autoComplete="new-password"
            placeholder="At least 8 characters"
          />
          <Button
            type="submit"
            className="w-full"
            loading={form.formState.isSubmitting}
            loadingText="Creating account..."
          >
            Create account
          </Button>
        </form>
      </Form>
    </AuthCard>
  );
}
