import { ArrowDown01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useRef, useState } from "react";

import { ModelIcon } from "@/components/model-icon";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import {
  TEXT_GENERATION_MODELS,
  type TextGenerationModelConfig,
} from "@/lib/ai/text-generation/models";
import type { TextGenerationModelId } from "@/lib/ai/text-generation/types";

const models: readonly TextGenerationModelConfig[] = TEXT_GENERATION_MODELS;

export function TextModelSelector({
  label,
  inCanvas = false,
  onValueChange,
  value,
}: {
  label: string;
  inCanvas?: boolean;
  onValueChange: (modelId: TextGenerationModelId) => void;
  value: TextGenerationModelId;
}) {
  const anchor = useRef<HTMLDivElement>(null);
  const selectedModel = models.find((model) => model.id === value);

  if (inCanvas) {
    return (
      <CanvasTextModelSelector
        label={label}
        onValueChange={onValueChange}
        value={value}
      />
    );
  }

  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Combobox
        filter={null}
        items={models}
        itemToStringValue={(model) => model.name}
        value={selectedModel}
        onValueChange={(model) => {
          if (model) {
            onValueChange(model.id);
          }
        }}
      >
        <div ref={anchor} className="w-full">
          <ComboboxTrigger
            render={
              <Button
                className="h-auto w-full justify-between py-2"
                type="button"
                variant="outline"
              />
            }
          >
            {selectedModel ? (
              <span className="flex min-w-0 items-center gap-3">
                <ModelIcon className="size-5" modelId={selectedModel.id} />
                <span className="truncate font-bold">{selectedModel.name}</span>
              </span>
            ) : (
              "Select a model"
            )}
          </ComboboxTrigger>
        </div>
        <ComboboxContent anchor={anchor} className="min-w-0">
          <ComboboxEmpty>No model found.</ComboboxEmpty>
          <ComboboxList>
            {(model) => {
              const providerCount = Object.keys(model.providerModels).length;

              return (
                <ComboboxItem key={model.id} value={model}>
                  <div className="rounded-lg bg-muted p-2">
                    <ModelIcon modelId={model.id} />
                  </div>
                  <span className="grid min-w-0 gap-1">
                    <span className="flex items-center gap-2">
                      <span className="font-bold">{model.name}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        ({providerCount} Provider
                        {providerCount === 1 ? "" : "s"})
                      </span>
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {model.description}
                    </span>
                  </span>
                </ComboboxItem>
              );
            }}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}

function CanvasTextModelSelector({
  label,
  onValueChange,
  value,
}: {
  label: string;
  onValueChange: (modelId: TextGenerationModelId) => void;
  value: TextGenerationModelId;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selectedModel = models.find((model) => model.id === value);

  useEffect(() => {
    if (!open) {
      return;
    }

    const closeOnOutsidePress = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as globalThis.Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", closeOnOutsidePress);
    return () =>
      document.removeEventListener("pointerdown", closeOnOutsidePress);
  }, [open]);

  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <div ref={wrapperRef} className="relative">
        <button
          aria-expanded={open}
          aria-haspopup="listbox"
          className="nodrag flex h-9 w-full items-center justify-between rounded-md border bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          onClick={() => setOpen((current) => !current)}
          onPointerDown={(event) => event.stopPropagation()}
          type="button"
        >
          <span className="flex min-w-0 items-center gap-2">
            {selectedModel ? (
              <ModelIcon className="size-4" modelId={selectedModel.id} />
            ) : null}
            <span className="truncate">
              {selectedModel?.name ?? "Select a model"}
            </span>
          </span>
          <HugeiconsIcon
            className="size-4 shrink-0 opacity-50"
            icon={ArrowDown01Icon}
            strokeWidth={2}
          />
        </button>
        {open ? (
          <div
            className="nodrag nowheel absolute top-full right-0 left-0 z-50 mt-1 max-h-60 overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
            role="listbox"
          >
            {models.map((model) => {
              const selected = model.id === value;

              return (
                <button
                  aria-selected={selected}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground"
                  key={model.id}
                  onClick={() => {
                    onValueChange(model.id);
                    setOpen(false);
                  }}
                  onPointerDown={(event) => event.stopPropagation()}
                  role="option"
                  type="button"
                >
                  <ModelIcon className="size-4 shrink-0" modelId={model.id} />
                  <span className="min-w-0 flex-1 truncate">{model.name}</span>
                  {selected ? (
                    <HugeiconsIcon
                      className="size-4 shrink-0"
                      icon={Tick02Icon}
                      strokeWidth={2}
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
