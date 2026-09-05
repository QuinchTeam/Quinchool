"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { useId } from "react";
import { toast } from "sonner";
import { useReorderWallets } from "@/hooks/use-finance-tracker/use-wallets";
import type { Wallet } from "@/lib/finance-tracker/types";
import { WalletCard } from "./wallet-card";

export function WalletGrid({ wallets }: { wallets: Wallet[] }) {
  const id = useId();
  const reorder = useReorderWallets();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function dragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id || reorder.isPending) return;
    const from = wallets.findIndex((wallet) => wallet.id === active.id);
    const to = wallets.findIndex((wallet) => wallet.id === over.id);
    if (from < 0 || to < 0) return;
    reorder.mutate(
      arrayMove(wallets, from, to).map((wallet) => wallet.id),
      {
        onError: (error) => toast.error(error.message),
      },
    );
  }

  return (
    <DndContext
      id={id}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={dragEnd}
    >
      <SortableContext items={wallets} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {wallets.map((wallet) => (
            <WalletCard
              key={wallet.id}
              wallet={wallet}
              disabled={reorder.isPending}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
