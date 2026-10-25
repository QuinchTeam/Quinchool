import { PlayIcon } from "@phosphor-icons/react/dist/ssr/Play";
import { TrashIcon } from "@phosphor-icons/react/dist/ssr/Trash";
import { AppIcon } from "@/components/ui/icon";

import { Button } from "@/components/ui/button";
import { useRunFlow } from "@/features/node-based-builder/hooks/use-run-flow";
import { useFlowStore } from "@/features/node-based-builder/store/flow-store";

export function CanvasMainToolbar() {
  const isRunning = useFlowStore((state) => state.isRunning);
  const onClear = useFlowStore((state) => state.clear);
  const onRun = useRunFlow();

  return (
    <div className="flex items-center gap-2 rounded-xl border bg-card p-2 shadow-sm">
      <Button
        loading={isRunning}
        loadingText="Running..."
        onClick={onRun}
        size="sm"
        type="button"
      >
        <AppIcon icon={PlayIcon} />
        Run Flow
      </Button>
      <Button
        disabled={isRunning}
        onClick={onClear}
        size="icon-sm"
        type="button"
        variant="outline"
      >
        <AppIcon icon={TrashIcon} />
        <span className="sr-only">Clear canvas</span>
      </Button>
    </div>
  );
}
