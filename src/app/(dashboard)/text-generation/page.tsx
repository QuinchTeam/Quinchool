"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";

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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  DEFAULT_TEXT_GENERATION_MODEL_ID,
  TEXT_GENERATION_MODELS,
  type TextGenerationModelConfig,
} from "@/lib/ai/text-generation/models";
import {
  type TextGenerationValues,
  textGenerationSchema,
} from "@/lib/validations/text-generation";

interface GenerateTextResponse {
  error?: string;
  text?: string;
}

const models: readonly TextGenerationModelConfig[] = TEXT_GENERATION_MODELS;

export default function TextGenerationPage() {
  const [generatedText, setGeneratedText] = useState("");
  const [generationError, setGenerationError] = useState("");
  const modelComboboxAnchor = useRef<HTMLDivElement>(null);
  const form = useForm<TextGenerationValues>({
    resolver: zodResolver(textGenerationSchema),
    defaultValues: {
      modelId: DEFAULT_TEXT_GENERATION_MODEL_ID,
      prompt: "",
    },
  });

  async function onSubmit(values: TextGenerationValues) {
    setGeneratedText("");
    setGenerationError("");

    const response = await fetch("/api/text-generation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = (await response.json()) as GenerateTextResponse;

    if (!response.ok) {
      setGenerationError(data.error ?? "Failed to generate text");
      return;
    }

    setGeneratedText(data.text ?? "");
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">Text Generation</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <FormField
            control={form.control}
            name="modelId"
            render={({ field }) => {
              const selectedModel = models.find(
                (model) => model.id === field.value,
              );

              return (
                <FormItem>
                  <FormLabel>Model</FormLabel>
                  <Combobox
                    items={models}
                    itemToStringValue={(model) => model.name}
                    value={selectedModel}
                    onValueChange={(model) => {
                      if (model) {
                        field.onChange(model.id);
                      }
                    }}
                  >
                    <div ref={modelComboboxAnchor} className="w-full">
                      <FormControl>
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
                              <ModelIcon
                                className="size-5"
                                modelId={selectedModel.id}
                              />
                              <span className="truncate font-bold">
                                {selectedModel.name}
                              </span>
                            </span>
                          ) : (
                            "Select a model"
                          )}
                        </ComboboxTrigger>
                      </FormControl>
                    </div>
                    <ComboboxContent anchor={modelComboboxAnchor}>
                      <ComboboxEmpty>No model found.</ComboboxEmpty>
                      <ComboboxList>
                        {(model) => {
                          const providerCount = Object.keys(
                            model.providerModels,
                          ).length;

                          return (
                            <ComboboxItem key={model.id} value={model}>
                              <div className="bg-muted p-2 rounded-lg">
                                <ModelIcon modelId={model.id} />
                              </div>
                              <span className="grid min-w-0 gap-1">
                                <span className="flex items-center gap-2">
                                  <span className="font-bold">
                                    {model.name}
                                  </span>
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
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          <FormField
            control={form.control}
            name="prompt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prompt</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Write what you want to generate."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={form.formState.isSubmitting}>
            Submit
          </Button>
        </form>
      </Form>
      {(generatedText || generationError) && (
        <section className="grid gap-2 rounded-md border bg-muted/30 p-4">
          <h2 className="text-sm font-medium">Result</h2>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
            {generationError || generatedText}
          </p>
        </section>
      )}
    </div>
  );
}
