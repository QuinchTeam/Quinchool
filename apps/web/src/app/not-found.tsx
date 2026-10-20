import type { Metadata } from "next";

import { NotFoundPage } from "@/components/shared/not-found-page";

export const metadata: Metadata = { title: "Not Found - Quinchool" };

export default function NotFound() {
  return <NotFoundPage />;
}
