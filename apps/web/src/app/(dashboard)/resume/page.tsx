import type { Metadata } from "next";

import { ResumePage } from "@/features/resume-builder/components/resume-page";

export const metadata: Metadata = { title: "Resume - Quinchool" };

export default function Page() {
  return <ResumePage />;
}
