import type { Metadata } from "next";

import { ResumeTailorPage } from "@/features/resume-builder/components/resume-tailor-page";

export const metadata: Metadata = { title: "Resume Tailor - Quinchool" };

export default function Page() {
  return <ResumeTailorPage />;
}
