"use client";

import {
  Add01Icon,
  ChatBotIcon,
  SentIcon,
  UserAiIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import ReactMarkdown, { type Components } from "react-markdown";

import { TextModelSelector } from "@/components/text-model-selector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { DEFAULT_TEXT_GENERATION_MODEL_ID } from "@/lib/ai/text-generation/models";
import type { TextGenerationModelId } from "@/lib/ai/text-generation/types";
import { apiUrl, withCredentials } from "@/lib/api";
import type { ChatMessage } from "@/lib/validations/chatbot";

interface DisplayMessage extends ChatMessage {
  id: string;
  toolUsed?: boolean;
}

interface ChatbotResponse {
  error?: string;
  text?: string;
  toolUsed?: boolean;
}

const suggestions = [
  "Summarize my career profile.",
  "Help me plan a software project.",
  "Explain a technical concept simply.",
] as const;

const markdownComponents: Components = {
  a: ({ node: _node, ...props }) => (
    <a {...props} rel="noreferrer" target="_blank" />
  ),
};

export function Chatbot() {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [modelId, setModelId] = useState<TextGenerationModelId>(
    DEFAULT_TEXT_GENERATION_MODEL_ID,
  );
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const lastMessageId = messages.at(-1)?.id;

  useEffect(() => {
    if (lastMessageId || isPending) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [lastMessageId, isPending]);

  async function sendMessage(content: string) {
    const trimmed = content.trim();

    if (!trimmed || isPending) {
      return;
    }

    const userMessage: DisplayMessage = {
      content: trimmed,
      id: crypto.randomUUID(),
      role: "user",
    };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput("");
    setError("");
    setIsPending(true);

    try {
      const response = await fetch(apiUrl("/chatbot"), {
        ...withCredentials,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.slice(-24).map(({ content, role }) => ({
            content,
            role,
          })),
          modelId,
        }),
      });
      const body = (await response.json()) as ChatbotResponse;

      if (!response.ok || !body.text) {
        throw new Error(body.error || "The assistant could not respond.");
      }

      setMessages((current) => [
        ...current,
        {
          content: body.text as string,
          id: crypto.randomUUID(),
          role: "assistant",
          toolUsed: body.toolUsed,
        },
      ]);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The assistant could not respond.",
      );
    } finally {
      setIsPending(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      void sendMessage(input);
    }
  }

  function startNewChat() {
    setMessages([]);
    setInput("");
    setError("");
  }

  return (
    <div className="flex h-svh min-h-0 flex-col bg-background">
      <header className="border-b bg-background px-4 py-3">
        <div className="mx-auto flex max-w-4xl items-end justify-between gap-3">
          <div className="w-full max-w-xs">
            <TextModelSelector
              label="Model"
              value={modelId}
              onValueChange={setModelId}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            disabled={isPending || messages.length === 0}
            onClick={startNewChat}
          >
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
            New chat
          </Button>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <section className="mx-auto flex min-h-full max-w-3xl flex-col items-center justify-center gap-6 px-4 py-12 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <HugeiconsIcon icon={ChatBotIcon} strokeWidth={2} />
            </div>
            <div className="grid gap-2">
              <h1 className="text-2xl font-semibold">Quinchool Assistant</h1>
              <p className="text-sm text-muted-foreground">
                What would you like to work on?
              </p>
            </div>
            <div className="flex max-w-2xl flex-wrap justify-center gap-2">
              {suggestions.map((suggestion) => (
                <Button
                  key={suggestion}
                  type="button"
                  variant="outline"
                  onClick={() => void sendMessage(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </section>
        ) : (
          <div className="mx-auto grid max-w-3xl gap-8 px-4 py-8">
            {messages.map((message) =>
              message.role === "user" ? (
                <div key={message.id} className="flex justify-end">
                  <p className="max-w-2xl rounded bg-muted px-4 py-3 text-sm whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>
              ) : (
                <article key={message.id} className="flex gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <HugeiconsIcon icon={ChatBotIcon} strokeWidth={2} />
                  </div>
                  <div className="grid min-w-0 flex-1 gap-2 pt-1">
                    {message.toolUsed ? (
                      <Badge variant="outline" className="w-fit">
                        <HugeiconsIcon icon={UserAiIcon} strokeWidth={2} />
                        Career profile used
                      </Badge>
                    ) : null}
                    <div className="grid gap-3 text-sm leading-relaxed [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_blockquote]:border-l-2 [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground [&_code]:font-mono [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:text-base [&_h3]:font-semibold [&_hr]:border-border [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 [&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:border [&_pre]:bg-muted [&_pre]:p-4 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
                      <ReactMarkdown components={markdownComponents}>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </article>
              ),
            )}
            {isPending ? (
              <div className="flex gap-3" aria-live="polite">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <HugeiconsIcon icon={ChatBotIcon} strokeWidth={2} />
                </div>
                <p className="pt-2 text-sm text-muted-foreground animate-pulse">
                  Thinking...
                </p>
              </div>
            ) : null}
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <div ref={endRef} />
          </div>
        )}
      </main>

      <footer className="border-t bg-background px-4 py-4">
        <form
          className="mx-auto max-w-3xl"
          onSubmit={handleSubmit}
          aria-label="Chat message"
        >
          <InputGroup className="min-h-24 items-end bg-background">
            <InputGroupTextarea
              aria-label="Message"
              autoFocus
              className="max-h-48 min-h-16"
              disabled={isPending}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message Quinchool Assistant"
              value={input}
            />
            <InputGroupAddon align="block-end" className="justify-end">
              <InputGroupButton
                aria-label="Send message"
                disabled={!input.trim() || isPending}
                size="icon-sm"
                type="submit"
                variant="default"
              >
                <HugeiconsIcon icon={SentIcon} strokeWidth={2} />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </form>
      </footer>
    </div>
  );
}
