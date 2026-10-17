"use client";

import { RobotIcon } from "@phosphor-icons/react/dist/ssr/Robot";
import { AppIcon } from "@/components/ui/icon";
import Image from "next/image";
import ReactMarkdown, { type Components } from "react-markdown";
import { Badge } from "@/components/ui/badge";
import { resolveToolAction } from "@/features/chatbot/components/tools/registry";
import type { ChatbotActions } from "@/features/chatbot/hooks/use-chatbot";
import type { DisplayMessage } from "@/features/chatbot/lib/types";

const markdownComponents: Components = {
  a: ({ node: _node, ...props }) => (
    <a {...props} rel="noreferrer" target="_blank" />
  ),
};

export function ChatAvatar() {
  return (
    <Image
      src="/quinchool-icon-v2.webp"
      alt=""
      width={32}
      height={32}
      className="size-8 shrink-0"
    />
  );
}

export function ChatMessage({
  action,
  message,
}: {
  action: ChatbotActions;
  message: DisplayMessage;
}) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <p className="max-w-2xl rounded bg-muted px-4 py-3 text-sm whitespace-pre-wrap">
          {message.content}
        </p>
      </div>
    );
  }

  const pending = message.pendingAction;
  const ToolAction = pending ? resolveToolAction(pending.domain) : null;

  return (
    <article className="flex gap-3">
      <ChatAvatar />
      <div className="grid min-w-0 flex-1 gap-2 pt-1">
        {message.toolUsed ? (
          <Badge variant="outline" className="w-fit">
            <AppIcon icon={RobotIcon} />
            Career profile used
          </Badge>
        ) : null}
        {message.content ? (
          <div className="grid gap-3 text-sm leading-relaxed [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_blockquote]:border-l-2 [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground [&_code]:font-mono [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:text-base [&_h3]:font-semibold [&_hr]:border-border [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 [&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:border [&_pre]:bg-muted [&_pre]:p-4 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
            <ReactMarkdown components={markdownComponents}>
              {message.content}
            </ReactMarkdown>
          </div>
        ) : null}
        {pending && ToolAction && message.actionOutcome === undefined ? (
          <ToolAction
            action={pending}
            error={action.error}
            isPending={action.isPending}
            onDismiss={() => action.dismiss(message)}
            onSubmit={(values) => action.submit(message, values)}
          />
        ) : null}
        {message.actionOutcome ? (
          <p className="text-sm text-muted-foreground">
            {message.actionOutcome === "done"
              ? "Saved to your career profile."
              : "Left your career profile unchanged."}
          </p>
        ) : null}
      </div>
    </article>
  );
}
