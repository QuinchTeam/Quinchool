"use client";

import { initialsOf } from "@/lib/utils";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ModeToggle } from "@/components/shared/mode-toggle";
import { SentryFeedbackButton } from "@/components/shared/sentry-feedback-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { signOut, useSession } from "@/lib/auth-client";
import { NameEditor } from "@/features/profile/components/name-editor";

const memberSince = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "long",
  timeZone: "Asia/Manila",
});

export function ProfilePage() {
  const router = useRouter();
  const { data: session, isPending, refetch } = useSession();
  const user = session?.user;

  async function handleSignOut() {
    await signOut();
    router.push("/auth/login");
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-8 p-6">
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
