"use client";

import { useEffect, useState } from "react";

import { DitherLoader } from "@/components/ui/dither-loader";
import { ChatAvatar } from "@/features/chatbot/components/chat-message";
import { THINKING_WORDS } from "@/features/chatbot/lib/thinking-words";

export function ChatThinking() {
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setWordIndex(
        (previous) =>
          (previous +
            1 +
            Math.floor(Math.random() * (THINKING_WORDS.length - 1))) %
          THINKING_WORDS.length,
      );
    }, 3000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-3" role="status">
      <ChatAvatar />
      <span className="sr-only">Thinking</span>
      <div aria-hidden="true" className="flex items-center gap-3">
        <DitherLoader />
        <span className="font-mono text-sm italic text-shimmer">
          {THINKING_WORDS[wordIndex]}...
        </span>
      </div>
    </div>
  );
}
