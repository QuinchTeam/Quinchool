import type { Metadata } from "next";

import { CareerProfilePage } from "@/features/career-profile/components/career-profile-page";

export const metadata: Metadata = { title: "Career Profile - Quinchool" };

export default function Page() {
  return <CareerProfilePage />;
}
