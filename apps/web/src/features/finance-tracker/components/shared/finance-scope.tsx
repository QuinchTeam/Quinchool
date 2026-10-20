"use client";

import { createContext, type ReactNode, useContext } from "react";

const FinanceScopeContext = createContext<string | null>(null);

// Scope is an opaque per-login cache key, never the session cookie.
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
