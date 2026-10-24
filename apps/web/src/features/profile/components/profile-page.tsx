"use client";

import { useRouter } from "next/navigation";
import { UserCircleIcon } from "@phosphor-icons/react/dist/ssr/UserCircle";
import { PaletteIcon } from "@phosphor-icons/react/dist/ssr/Palette";
import { ChatCircleTextIcon } from "@phosphor-icons/react/dist/ssr/ChatCircleText";
import { SignOutIcon } from "@phosphor-icons/react/dist/ssr/SignOut";
import { AppHeader } from "@/components/shared/app-header";
import {
  DitherCanvas,
  type DitherSceneFn,
} from "@/components/shared/dither-canvas";
import { AppIcon } from "@/components/ui/icon";
import { ModeToggle } from "@/components/shared/mode-toggle";
import { SentryFeedbackButton } from "@/components/shared/sentry-feedback-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { signOut, useSession } from "@/lib/auth-client";
import { AvatarUploader } from "@/features/profile/components/avatar-uploader";
import { NameEditor } from "@/features/profile/components/name-editor";
import { CyberpunkAlley } from "@/features/profile/components/cyberpunk-alley";

const memberSince = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "long",
  timeZone: "Asia/Manila",
});

const PROFILE_TEXTURE: DitherSceneFn = (x, y, t) =>
  (0.5 + 0.5 * Math.sin(x * 8 + y * 5 - t * 0.25)) *
  (0.5 + 0.5 * Math.cos(y * 10 - x * 3 + t * 0.15));

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
      <AppHeader
        title="Profile"
        icon={UserCircleIcon}
        description="Your corner of Quinchool. Make it feel like you."
      />
      {isPending ? (
        <ProfileSkeleton />
      ) : user ? (
        <div className="grid w-full items-stretch gap-8 lg:grid-cols-2">
          <div className="grid min-w-0 gap-6">
            <section
              aria-label="Your profile"
              className="flex min-w-0 flex-col overflow-hidden rounded-xl border bg-card"
            >
              <div className="relative h-40 shrink-0 overflow-hidden border-b bg-primary/5 text-primary">
                <DitherCanvas
                  scene={PROFILE_TEXTURE}
                  pixelSize={3}
                  className="pixelated absolute inset-0 size-full opacity-60"
                />
              </div>
              <div className="relative flex flex-1 flex-col gap-5 px-6 pb-6">
                <div className="-mt-12 w-fit rounded-full bg-card p-1.5">
                  <AvatarUploader
                    image={user.image}
                    name={user.name}
                    onUploaded={() => refetch()}
                  />
                </div>
                <div className="grid gap-2">
                  <NameEditor
                    email={user.email}
                    name={user.name}
                    onSaved={() => refetch()}
                  />
                  <p className="text-xs text-muted-foreground">
                    Click your photo to change it.
                  </p>
                </div>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t pt-4">
                  <span className="font-mono text-xs text-muted-foreground">
                    Your personal workspace
                  </span>
                  <Badge variant={user.emailVerified ? "secondary" : "outline"}>
                    {user.emailVerified ? "Email verified" : "Email unverified"}
                  </Badge>
                </div>
              </div>
            </section>
            <div className="contents">
              <section className="min-w-0 overflow-hidden rounded-xl border bg-card">
                <div className="border-b px-6 py-5">
                  <h2 className="text-sm font-semibold">Account details</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    The essentials behind your workspace.
                  </p>
                </div>
                <dl className="grid min-w-0 gap-5 p-6 sm:grid-cols-2">
                  <Detail label="Email">
                    <span className="break-all">{user.email}</span>
                  </Detail>
                  <Detail label="Member since">
                    {memberSince.format(new Date(user.createdAt))}
                  </Detail>
                </dl>
              </section>
              <section
                aria-label="Preferences and feedback"
                className="min-w-0 divide-y overflow-hidden rounded-xl border bg-card"
              >
                <div className="flex min-w-0 flex-wrap items-center justify-between gap-4 p-6">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted/50 text-primary">
                      <AppIcon icon={PaletteIcon} />
                    </span>
                    <div>
                      <h2 className="text-sm font-medium">Appearance</h2>
                      <p className="text-xs text-muted-foreground">
                        Light, dark, or match your system.
                      </p>
                    </div>
                  </div>
                  <ModeToggle />
                </div>
                <div className="flex min-w-0 flex-wrap items-center justify-between gap-4 p-6">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted/50 text-primary">
                      <AppIcon icon={ChatCircleTextIcon} />
                    </span>
                    <div>
                      <h2 className="text-sm font-medium">Feedback</h2>
                      <p className="text-xs text-muted-foreground">
                        Something broken? Send a bug report with a screenshot.
                      </p>
                    </div>
                  </div>
                  <SentryFeedbackButton />
                </div>
              </section>
              <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                <p className="text-xs text-muted-foreground">
                  All done for now? Your workspace will be here.
                </p>
                <Button variant="outline" onClick={handleSignOut}>
                  <AppIcon icon={SignOutIcon} />
                  Sign out
                </Button>
              </div>
            </div>
          </div>
          <CyberpunkAlley />
        </div>
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
    <output
      className="grid w-full items-stretch gap-8 lg:grid-cols-2"
      aria-label="Loading profile"
      aria-busy="true"
    >
      <div className="grid min-w-0 gap-6">
        <div className="flex min-w-0 flex-col overflow-hidden rounded-xl border bg-card">
          <div className="h-40 shrink-0 overflow-hidden border-b">
            <Skeleton className="size-full rounded-none" />
          </div>
          <div className="relative flex flex-1 flex-col gap-5 px-6 pb-6">
            <div className="-mt-12 w-fit rounded-full bg-card p-1.5">
              <Skeleton className="size-24 rounded-full" />
            </div>
            <div className="grid gap-2">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                <div className="grid min-w-0 flex-1 gap-2">
                  <Skeleton className="h-7 w-40 max-w-full" />
                  <Skeleton className="h-5 w-56 max-w-full" />
                </div>
                <Skeleton className="h-12 w-28 shrink-0 rounded-lg" />
              </div>
              <Skeleton className="h-4 w-44 max-w-full" />
            </div>
            <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t pt-4">
              <Skeleton className="h-4 w-44 max-w-full" />
              <Skeleton className="h-7 w-28 rounded-full" />
            </div>
          </div>
        </div>
        <div className="min-w-0 overflow-hidden rounded-xl border bg-card">
          <div className="grid gap-2 border-b px-6 py-5">
            <Skeleton className="h-5 w-28 max-w-full" />
            <Skeleton className="h-4 w-60 max-w-full" />
          </div>
          <div className="grid min-w-0 gap-5 p-6 sm:grid-cols-2">
            {["email", "member-since"].map((detail) => (
              <div key={detail} className="grid min-w-0 gap-1.5">
                <Skeleton className="h-4 w-20 max-w-full" />
                <Skeleton className="h-5 w-40 max-w-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="min-w-0 divide-y overflow-hidden rounded-xl border bg-card">
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-4 p-6">
            <div className="flex min-w-0 items-center gap-3">
              <Skeleton className="size-10 shrink-0 rounded-lg" />
              <div className="grid min-w-0 gap-2">
                <Skeleton className="h-5 w-24 max-w-full" />
                <Skeleton className="h-4 w-48 max-w-full" />
              </div>
            </div>
            <Skeleton className="size-14 shrink-0 rounded-lg" />
          </div>
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-4 p-6">
            <div className="flex min-w-0 items-center gap-3">
              <Skeleton className="size-10 shrink-0 rounded-lg" />
              <div className="grid min-w-0 gap-2">
                <Skeleton className="h-5 w-20 max-w-full" />
                <Skeleton className="h-4 w-80 max-w-full" />
              </div>
            </div>
            <Skeleton className="h-14 w-44 shrink-0 rounded-lg" />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <Skeleton className="h-4 w-72 max-w-full" />
          <Skeleton className="h-14 w-36 shrink-0 rounded-lg" />
        </div>
      </div>
      <CyberpunkAlley loading />
    </output>
  );
}
