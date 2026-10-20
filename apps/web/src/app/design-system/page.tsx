import type { Metadata } from "next";

import { DesignSystemPage } from "@/features/design-system/components/design-system-page";

export const metadata: Metadata = { title: "Design System - Quinchool" };

export default function Page() {
  return <DesignSystemPage />;
}
