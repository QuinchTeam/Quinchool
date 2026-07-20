"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { TextModelSelector } from "@/components/text-model-selector";
import { Button } from "@/components/ui/button";
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
} from "@/lib/ai/text-generation/models";
import {
  type TextGenerationValues,
  textGenerationSchema,
} from "@/lib/validations/text-generation";

interface GenerateTextResponse {
  error?: string;
  text?: string;
}

export default function TextGenerationPage() {
  const [generatedText, setGeneratedText] = useState("");
  const [generationError, setGenerationError] = useState("");
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
              return (
                <FormItem>
                  <TextModelSelector
                    label="Model"
                    value={field.value}
                    onValueChange={(modelId) => field.onChange(modelId)}
                  />
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
