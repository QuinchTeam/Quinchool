import type { Metadata } from "next";

import { ToolsPage } from "@/features/tools/components/tools-page";

export const metadata: Metadata = { title: "Tools - Quinchool" };

export default function Page() {
  return <ToolsPage />;
}
