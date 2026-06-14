"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "@/lib/auth-client";

export default function ForgetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const { error } = await requestPasswordReset({
      email,
      redirectTo: "/auth/update-password",
    });
    setLoading(false);

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
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
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
      </CardContent>
    </Card>
  );
}
