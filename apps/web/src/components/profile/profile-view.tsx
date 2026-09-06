"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ModeToggle } from "@/components/mode-toggle";
import { SentryFeedbackButton } from "@/components/sentry-feedback-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { signOut, updateUser, useSession } from "@/lib/auth-client";
import {
  type ProfileNameValues,
  profileNameSchema,
} from "@/lib/validations/auth";

const memberSince = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "long",
  timeZone: "Asia/Manila",
});

function initialsOf(name: string) {
  return (
    name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

export function ProfileView() {
  const router = useRouter();
  const { data: session, isPending, refetch } = useSession();
  const user = session?.user;

  async function handleSignOut() {
    await signOut();
    router.push("/auth/login");
  }

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-2xl flex-col gap-8 p-4 sm:p-6">
      <h1 className="text-2xl font-semibold">Profile</h1>
      {isPending ? (
        <ProfileSkeleton />
      ) : user ? (
        <>
          <section className="flex min-w-0 flex-wrap items-center gap-4 rounded-md border bg-card p-5">
            <Avatar size="lg" className="size-16">
              {user.image && (
                <AvatarImage
                  render={
                    <Image
                      src={user.image}
                      alt=""
                      width={64}
                      height={64}
                      unoptimized
                    />
                  }
                />
              )}
              <AvatarFallback className="text-lg">
                {initialsOf(user.name)}
              </AvatarFallback>
            </Avatar>
            <NameEditor
              email={user.email}
              name={user.name}
              onSaved={() => refetch()}
            />
          </section>
          <dl className="grid min-w-0 gap-4 sm:grid-cols-2">
            <Detail label="Email">
              <span className="break-all">{user.email}</span>
              <Badge variant={user.emailVerified ? "secondary" : "outline"}>
                {user.emailVerified ? "Verified" : "Unverified"}
              </Badge>
            </Detail>
            <Detail label="Member since">
              {memberSince.format(new Date(user.createdAt))}
            </Detail>
          </dl>
          <section className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-t pt-6">
            <div className="min-w-0">
              <h2 className="text-sm font-medium">Appearance</h2>
              <p className="text-xs text-muted-foreground">
                Light, dark, or match your system.
              </p>
            </div>
            <ModeToggle />
          </section>
          <section className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-t pt-6">
            <div className="min-w-0">
              <h2 className="text-sm font-medium">Feedback</h2>
              <p className="text-xs text-muted-foreground">
                Something broken? Send a bug report with a screenshot.
              </p>
            </div>
            <SentryFeedbackButton />
          </section>
          <div className="border-t pt-6">
            <Button variant="outline" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          You are not signed in.{" "}
          <Button
            variant="link"
            size="sm"
            onClick={() => router.push("/auth/login")}
          >
            Sign in
          </Button>
        </p>
      )}
    </div>
  );
}

/** Shows the name and email, and swaps the name for a one-field form on edit.
 * better-auth serves /update-user out of the box, so there is no API route. */
function NameEditor({
  email,
  name,
  onSaved,
}: {
  email: string;
  name: string;
  onSaved: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const form = useForm<ProfileNameValues>({
    resolver: zodResolver(profileNameSchema),
    values: { name },
  });

  async function onSubmit(values: ProfileNameValues) {
    const { error } = await updateUser({ name: values.name });

    if (error) {
      toast.error(error.message ?? "Could not update your name");
      return;
    }
    toast.success("Name updated");
    setIsEditing(false);
    onSaved();
  }

  if (!isEditing) {
    return (
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="break-words text-lg font-semibold">{name}</p>
          <p className="break-all text-sm text-muted-foreground">{email}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
          Edit name
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex min-w-0 flex-1 flex-col gap-3"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input autoComplete="name" autoFocus {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="submit"
            size="sm"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Saving..." : "Save"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              form.reset({ name });
              setIsEditing(false);
            }}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}

function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-w-0 gap-1.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
        {children}
      </dd>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <output className="grid gap-8" aria-label="Loading profile">
      <div className="flex items-center gap-4 rounded-md border bg-card p-5">
        <Skeleton className="size-16 shrink-0 rounded-full" />
        <div className="grid flex-1 gap-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {["email", "created"].map((field) => (
          <div key={field} className="grid gap-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-40" />
          </div>
        ))}
      </div>
    </output>
  );
}
