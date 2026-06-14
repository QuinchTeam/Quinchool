"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
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
import { resetPassword } from "@/lib/auth-client";

function UpdatePasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      toast.error("Missing or invalid reset token");
      return;
    }
    setLoading(true);
    const { error } = await resetPassword({ newPassword: password, token });
    setLoading(false);

    if (error) {
      toast.error(error.message ?? "Could not update password");
      return;
    }
    toast.success("Password updated");
    router.push("/auth/login");
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Update password</CardTitle>
        <CardDescription>
          Choose a new password for your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading || !token}>
            Update password
          </Button>
          <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
            <span>Back to</span>
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

export default function UpdatePasswordPage() {
  return (
    <Suspense>
      <UpdatePasswordForm />
    </Suspense>
  );
}
