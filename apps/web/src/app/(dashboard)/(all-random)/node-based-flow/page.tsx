import type { Metadata } from "next";
import { Canvas } from "@/features/node-based-builder/components/canvas";

export const metadata: Metadata = {
  title: "Node Based Flow — Quinchool",
};

export default function NodeBasedFlowPage() {
  return <Canvas />;
}
