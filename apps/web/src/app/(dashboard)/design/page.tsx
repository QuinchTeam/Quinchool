import type { Metadata } from "next";
import { DesignGallery } from "@/components/design/design-gallery";

export const metadata: Metadata = { title: "Design - Quinchool" };

export default function DesignPage() {
  return <DesignGallery />;
}
