import { create } from "zustand";

import type { TransactionFilters } from "@/features/finance-tracker/lib/types";

interface FinanceTrackerState {
  filters: TransactionFilters;
  page: number;
  setFilters: (filters: TransactionFilters) => void;
  setPage: (page: number) => void;
}

// History filters survive leaving and returning to the transactions page.
export const useFinanceTrackerStore = create<FinanceTrackerState>()((set) => ({
  filters: {},
  page: 1,
  setFilters: (filters) => set({ filters, page: 1 }),
  setPage: (page) => set({ page }),
}));
