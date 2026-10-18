"use client";

import { createContext, type ReactNode, useContext } from "react";

const FinanceScopeContext = createContext<string | null>(null);

/** `scope` is an opaque per-login key that partitions the finance query cache. */
export function FinanceScope({
  scope,
  children,
}: {
  scope: string;
  children: ReactNode;
}) {
  return (
    <FinanceScopeContext.Provider value={scope}>
      {children}
    </FinanceScopeContext.Provider>
  );
}

export function useFinanceScope() {
  const scope = useContext(FinanceScopeContext);
  if (!scope) throw new Error("Finance components require FinanceScope.");
  return scope;
}
