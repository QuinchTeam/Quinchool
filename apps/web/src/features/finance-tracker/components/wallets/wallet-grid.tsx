"use client";

import { arrayMove } from "@dnd-kit/sortable";
import { toast } from "sonner";
import { SortableList } from "@/components/ui/sortable";
import { useReorderWallets } from "@/features/finance-tracker/hooks/use-wallets";
import type { Wallet } from "@/features/finance-tracker/lib/types";
import { WalletCard } from "./wallet-card";

export function WalletGrid({ wallets }: { wallets: Wallet[] }) {
  const reorder = useReorderWallets();

  return (
    <SortableList
      wrap
      autoScroll={false}
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
      ids={wallets.map((wallet) => wallet.id)}
      onMove={(from, to) => {
        if (reorder.isPending) return;
        reorder.mutate(
          arrayMove(wallets, from, to).map((wallet) => wallet.id),
          { onError: (error) => toast.error(error.message) },
        );
      }}
    >
      {wallets.map((wallet) => (
        <WalletCard
          key={wallet.id}
          wallet={wallet}
          disabled={reorder.isPending}
        />
      ))}
    </SortableList>
  );
}
