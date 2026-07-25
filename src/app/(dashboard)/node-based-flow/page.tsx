import type { Metadata } from "next";
import { Canvas } from "@/components/node-based-builder/canvas";

export const metadata: Metadata = {
  title: "Node Based Flow — Quinchool",
};

export default function NodeBasedFlowPage() {
  return (
    <Canvas />
  );
}
