import type { Metadata } from "next";

import { ToolsHub } from "@/components/tools/tools-hub";

export const metadata: Metadata = {
  title: "All Random Tools — Quinchool",
};

export default function ToolsPage() {
  return <ToolsHub />;
}
