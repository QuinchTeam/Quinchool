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
import { signIn } from "@/lib/auth-client";
import { type LoginValues, loginSchema } from "@/lib/validations/auth";

export default function LoginPage() {
  const router = useRouter();
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginValues) {
    const { error } = await signIn.email({
      email: values.email,
      password: values.password,
    });

    if (error) {
      toast.error(error.message ?? "Could not sign in");
      return;
    }
    toast.success("Signed in");
    router.push("/");
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>
          Enter your email and password to continue.
        </CardDescription>
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
                  <div className="flex items-center justify-between">
                    <FormLabel>Password</FormLabel>
                    <Button
                      variant="link"
                      size="sm"
                      nativeButton={false}
                      className="px-0"
                      render={<Link href="/auth/forget-password" />}
                    >
                      Forgot password?
                    </Button>
                  </div>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="current-password"
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
              Sign in
            </Button>
            <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
              <span>Don&apos;t have an account?</span>
              <Button
                variant="link"
                size="sm"
                nativeButton={false}
                className="px-0"
                render={<Link href="/auth/register" />}
              >
                Sign up
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
