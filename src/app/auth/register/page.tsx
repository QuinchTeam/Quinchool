"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { signUp } from "@/lib/auth-client";
import { type RegisterValues, registerSchema } from "@/lib/validations/auth";

export default function RegisterPage() {
  const router = useRouter();
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: RegisterValues) {
    const { error } = await signUp.email({
      email: values.email,
      password: values.password,
      name: values.email.split("@")[0],
    });

    if (error) {
      toast.error(error.message ?? "Could not create account");
      return;
    }
    toast.success("Account created");
    router.push("/");
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>Sign up with your email and password.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" autoComplete="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              Create account
            </Button>
            <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
              <span>Already have an account?</span>
              <Button
                variant="link"
                size="sm"
                nativeButton={false}
                className="px-0"
                render={<Link href="/auth/login" />}
              >
                Sign in
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
