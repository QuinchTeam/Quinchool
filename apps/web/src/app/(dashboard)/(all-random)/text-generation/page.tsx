import type { Metadata } from "next";

import { TextGenerationPage } from "@/features/text-generation/components/text-generation-page";

export const metadata: Metadata = { title: "Text Generation - Quinchool" };

export default function Page() {
  return <TextGenerationPage />;
}
