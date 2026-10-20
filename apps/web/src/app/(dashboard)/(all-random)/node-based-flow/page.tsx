import type { Metadata } from "next";

import { NodeBasedFlowPage } from "@/features/node-based-builder/components/node-based-flow-page";

export const metadata: Metadata = { title: "Node Based Flow - Quinchool" };

export default function Page() {
  return <NodeBasedFlowPage />;
}
