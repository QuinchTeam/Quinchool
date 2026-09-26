"use client";

import { createContext, type ReactNode, useContext } from "react";

const FinanceUserContext = createContext<string | null>(null);

export function FinanceScope({
  userId,
  children,
}: {
  userId: string;
  children: ReactNode;
}) {
  return (
    <FinanceUserContext.Provider value={userId}>
      {children}
    </FinanceUserContext.Provider>
  );
}

export function useFinanceUserId() {
  const userId = useContext(FinanceUserContext);
  if (!userId) throw new Error("Finance components require FinanceScope.");
  return userId;
}
