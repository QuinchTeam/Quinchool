"use client";

import Image from "next/image";

import { Button } from "@/components/ui/button";

const SUGGESTIONS = [
  "Summarize my career profile.",
  "Help me plan a software project.",
  "Explain a technical concept simply.",
] as const;

export function ChatEmptyState({
  onSelect,
}: {
  onSelect: (suggestion: string) => void;
}) {
  return (
    <section className="flex min-h-full w-full flex-col items-center justify-center gap-6 px-6 py-12 text-center">
      <Image
        src="/quinchool-icon.webp"
        alt=""
        width={64}
        height={64}
        priority
      />
      <div className="grid gap-2">
        <h1 className="text-2xl font-semibold">Quinch Bot</h1>
        <p className="text-sm text-muted-foreground">
          What would you like to work on?
        </p>
      </div>
      <div className="flex max-w-2xl flex-wrap justify-center gap-2">
        {SUGGESTIONS.map((suggestion) => (
          <Button
            key={suggestion}
            type="button"
            variant="outline"
            onClick={() => onSelect(suggestion)}
          >
            {suggestion}
          </Button>
        ))}
      </div>
    </section>
  );
}
