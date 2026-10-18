"use client";

import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useContext,
  useState,
} from "react";
import { createPortal } from "react-dom";

// The header lives in the layout but its buttons need the PDF state inside
// each tab, so the tab portals them into this slot.
const SlotContext = createContext<
  [HTMLElement | null, Dispatch<SetStateAction<HTMLElement | null>>] | null
>(null);

export function ResumeHeaderActionsProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <SlotContext value={useState<HTMLElement | null>(null)}>
      {children}
    </SlotContext>
  );
}

export function ResumeHeaderActionsSlot() {
  const slot = useContext(SlotContext);
  // `contents` keeps the portaled buttons in the header's flex row.
  return <div ref={slot?.[1]} className="contents" />;
}

export function ResumeHeaderActions({ children }: { children: ReactNode }) {
  const element = useContext(SlotContext)?.[0];
  return element ? createPortal(children, element) : null;
}
