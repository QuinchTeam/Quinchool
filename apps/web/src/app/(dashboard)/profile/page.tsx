import type { Metadata } from "next";

import { ProfilePage } from "@/features/profile/components/profile-page";

export const metadata: Metadata = { title: "Profile - Quinchool" };

export default function Page() {
  return <ProfilePage />;
}
