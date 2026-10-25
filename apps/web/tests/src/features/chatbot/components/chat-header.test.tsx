import assert from "node:assert/strict";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { test } from "vite-plus/test";

import { ChatHeader } from "@/features/chatbot/components/chat-header";

test("shows an editable heading for a saved chat", () => {
  const html = renderToStaticMarkup(
    <QueryClientProvider client={new QueryClient()}>
      <ChatHeader chatId="saved-chat" title="Career profile summary" />
    </QueryClientProvider>,
  );

  assert.match(html, /<h1/);
  assert.match(html, /Career profile summary/);
  assert.match(html, /aria-label="Edit chat title"/);
});

test("does not offer renaming before a chat is saved", () => {
  const html = renderToStaticMarkup(
    <QueryClientProvider client={new QueryClient()}>
      <ChatHeader title={null} />
    </QueryClientProvider>,
  );

  assert.doesNotMatch(html, /aria-label="Edit chat title"/);
});
