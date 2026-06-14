"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { signOut, useSession } from "@/lib/auth-client";

export default function Home() {
  const router = useRouter();
  const { data: session } = useSession();

  async function handleSignOut() {
    await signOut();
    router.push("/auth/login");
  }

  return (
    <div className="flex flex-1 flex-col items-start gap-4 p-6">
      <p>Signed in as {session?.user.email ?? "…"}</p>
      <Button variant="outline" onClick={handleSignOut}>
        Sign out
      </Button>
    </div>
  );
}
