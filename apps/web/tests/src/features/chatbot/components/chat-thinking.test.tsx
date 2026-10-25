import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { test } from "vite-plus/test";

import { ChatThinking } from "@/features/chatbot/components/chat-thinking";
import { THINKING_WORDS } from "@/features/chatbot/lib/thinking-words";

test("offers more than 100 distinct thinking words", () => {
  assert.ok(THINKING_WORDS.length > 100);
  assert.equal(new Set(THINKING_WORDS).size, THINKING_WORDS.length);
});

test("keeps the animated status decorative with a steady accessible label", () => {
  const html = renderToStaticMarkup(<ChatThinking />);

  assert.match(html, /role="status"/);
  assert.match(html, /class="sr-only">Thinking<\/span>/);
  assert.match(html, /aria-hidden="true" class="flex items-center/);
  assert.match(html, /motion-reduce:animate-none/);
});
