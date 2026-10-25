import * as assert from "node:assert/strict";
import { test } from "node:test";

import { endOnUserTurn } from "../../../src/modules/chatbot/chat.service";
import type { StoredMessage } from "../../../src/modules/chatbot/chat.repository";

function message(
  role: "user" | "assistant",
  content: string,
  position: number,
): StoredMessage {
  return {
    id: `m${position}`,
    role,
    content,
    position,
    toolUsed: false,
    pendingAction: undefined,
    actionOutcome: undefined,
  };
}

test("a history already ending on the user is left alone", () => {
  const window = [
    message("user", "hi", 1),
    message("assistant", "hello", 2),
    message("user", "add a skill", 3),
  ];

  assert.deepEqual(endOnUserTurn(window), window);
});

test("resuming after a confirmed write drops the assistant's form message", () => {
  const window = [
    message("user", "add Rust to my skills", 1),
    message("assistant", "", 2),
  ];

  const trimmed = endOnUserTurn(window);

  assert.equal(trimmed.length, 1);
  assert.equal(trimmed.at(-1)?.role, "user");
});

test("several trailing assistant turns all come off", () => {
  const trimmed = endOnUserTurn([
    message("user", "go", 1),
    message("assistant", "a", 2),
    message("assistant", "b", 3),
  ]);

  assert.equal(trimmed.length, 1);
  assert.equal(trimmed.at(-1)?.content, "go");
});

test("a window with no user turn is passed through rather than emptied", () => {
  const window = [message("assistant", "a", 1)];

  assert.deepEqual(endOnUserTurn(window), window);
});
