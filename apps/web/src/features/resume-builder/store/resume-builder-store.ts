import { create } from "zustand";

import type { ResumeLayout } from "@/features/resume-builder/hooks/use-resume-layout";

interface ResumeBuilderState {
  excluded: Set<string>;
  order: ResumeLayout["order"];
  // Header slot lets the PDF preview portal its actions into the shared layout header.
  headerSlot: HTMLElement | null;
  load: (layout: ResumeLayout) => void;
  toggle: (id: string) => void;
  setIncluded: (ids: string[], included: string[]) => void;
  reorder: (prefix: string, ids: string[]) => void;
  reset: () => void;
  setHeaderSlot: (element: HTMLElement | null) => void;
}

export const useResumeBuilderStore = create<ResumeBuilderState>()((set) => ({
  excluded: new Set(),
  order: {},
  headerSlot: null,
  load: (layout) =>
    set({ excluded: new Set(layout.excluded), order: layout.order }),
  toggle: (id) =>
    set((state) => {
      const excluded = new Set(state.excluded);
      if (excluded.has(id)) excluded.delete(id);
      else excluded.add(id);
      return { excluded };
    }),
  setIncluded: (ids, included) =>
    set((state) => {
      const excluded = new Set(state.excluded);
      for (const id of ids) {
        if (included.includes(id)) excluded.delete(id);
        else excluded.add(id);
      }
      return { excluded };
    }),
  reorder: (prefix, ids) =>
    set((state) => ({
      order: {
        ...state.order,
        [prefix]: ids.map((id) => Number(id.split(":").at(-1))),
      },
    })),
  reset: () => set({ excluded: new Set(), order: {} }),
  setHeaderSlot: (headerSlot) => set({ headerSlot }),
}));
