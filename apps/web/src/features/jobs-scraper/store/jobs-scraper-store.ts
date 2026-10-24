import { create } from "zustand";

interface JobsScraperState {
  // One resume generates at a time across every job section.
  generatingJobId: string | null;
  setGeneratingJobId: (id: string | null) => void;
}

export const useJobsScraperStore = create<JobsScraperState>()((set) => ({
  generatingJobId: null,
  setGeneratingJobId: (generatingJobId) => set({ generatingJobId }),
}));
