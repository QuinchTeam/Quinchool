import type { Metadata } from "next";

import { ToolsHub } from "@/features/tools/components/tools-hub";

export const metadata: Metadata = {
  title: "All Random Tools — Quinchool",
};

export default function ToolsPage() {
  return <ToolsHub />;
}
