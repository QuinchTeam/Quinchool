"use client";

import type { ReactNode } from "react";
import { createPortal } from "react-dom";

import { useResumeBuilderStore } from "@/features/resume-builder/store/resume-builder-store";

// Tabs portal actions here because the shared header sits outside their PDF state.
export function ResumeHeaderActionsSlot() {
  const setHeaderSlot = useResumeBuilderStore((state) => state.setHeaderSlot);
  return <div ref={setHeaderSlot} className="contents" />;
}

export function ResumeHeaderActions({ children }: { children: ReactNode }) {
  const element = useResumeBuilderStore((state) => state.headerSlot);
  return element ? createPortal(children, element) : null;
}
