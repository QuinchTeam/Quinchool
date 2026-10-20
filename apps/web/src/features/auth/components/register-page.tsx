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
} from "@/features/auth/components/auth-form-parts";
import {
  type RegisterValues,
  registerSchema,
} from "@/features/auth/validations/auth";
import { signUp } from "@/lib/auth-client";

export function RegisterPage() {
  const router = useRouter();
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

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
      description="Sign up with your email and password."
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
          />
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
            autoComplete="new-password"
          />
          <Button
            type="submit"
            className="w-full"
            disabled={form.formState.isSubmitting}
          >
            Create account
          </Button>
          <AuthFooter
            text="Already have an account?"
            href="/auth/login"
            linkLabel="Sign in"
          />
        </form>
      </Form>
    </AuthCard>
  );
}
