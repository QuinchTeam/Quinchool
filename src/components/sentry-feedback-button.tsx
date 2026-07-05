"use client";

import { MegaphoneIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function SentryFeedbackButton() {
  const [isOpening, setIsOpening] = useState(false);

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
        addIntegration(feedbackSyncIntegration({ autoInject: false }));
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
