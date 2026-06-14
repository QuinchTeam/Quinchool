"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
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
import { requestPasswordReset } from "@/lib/auth-client";
import {
  type ForgetPasswordValues,
  forgetPasswordSchema,
} from "@/lib/validations/auth";

export default function ForgetPasswordPage() {
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
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Forgot password</CardTitle>
        <CardDescription>
          Enter your email and we&apos;ll send you a reset link.
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
            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              Send reset link
            </Button>
            <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
              <span>Remembered it?</span>
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
