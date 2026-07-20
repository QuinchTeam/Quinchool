import { useRef } from "react";

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
  onValueChange,
  value,
}: {
  label: string;
  onValueChange: (modelId: TextGenerationModelId) => void;
  value: TextGenerationModelId;
}) {
  const anchor = useRef<HTMLDivElement>(null);
  const selectedModel = models.find((model) => model.id === value);

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
        <ComboboxContent anchor={anchor}>
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
