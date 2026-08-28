"use client";

import { MegaphoneIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

const SENTRY_FEEDBACK_OPTIONS = {
  autoInject: false,
  colorScheme: "dark",
  themeDark: {
    background: "var(--card)",
    accentBackground: "var(--primary)",
    accentForeground: "var(--neutral-900)",
  },
} as const;

export function SentryFeedbackButton() {
  const [isOpening, setIsOpening] = useState(false);

  if (process.env.NODE_ENV !== "production") {
    return null;
  }

  async function handleClick() {
    if (isOpening) {
      return;
    }

    setIsOpening(true);

    try {
      const { addIntegration, feedbackSyncIntegration, getFeedback } =
        await import("@sentry/browser");

      let feedback = getFeedback();

      if (!feedback) {
        addIntegration(feedbackSyncIntegration(SENTRY_FEEDBACK_OPTIONS));
        feedback = getFeedback();
      }

      const form = await feedback?.createForm();

      form?.appendToDom();
      form?.open();
    } finally {
      setIsOpening(false);
    }
  }

  return (
    <Button
      type="button"
      size="icon-lg"
      aria-label="Report a bug"
      disabled={isOpening}
      onClick={handleClick}
      className="rounded-full"
    >
      <HugeiconsIcon icon={MegaphoneIcon} strokeWidth={2} />
    </Button>
  );
}
