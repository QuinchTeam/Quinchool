import type { Metadata } from "next";

import { ResumeBuilderPage } from "@/features/resume-builder/components/resume-builder-page";

export const metadata: Metadata = { title: "Resume Builder - Quinchool" };

export default function Page() {
  return <ResumeBuilderPage />;
}
