import * as assert from "node:assert/strict";
import { test } from "node:test";

import { ChatbotService } from "../../../src/modules/chatbot/chatbot.service";
import type { ToolRegistry } from "../../../src/modules/chatbot/tools/tool.registry";
import type { AnyTool } from "../../../src/modules/chatbot/tools/tool.types";

interface Scripted {
  text: string;
  toolCall: { name: string; arguments: Record<string, unknown> } | null;
}

class FakeChatbotService extends ChatbotService {
  readonly asked: number[] = [];

  constructor(
    tools: ToolRegistry,
    private readonly script: Scripted[],
  ) {
    super(tools);
  }

  protected override ask(body: {
    toolResults: { name: string; result: unknown }[];
  }) {
    this.asked.push(body.toolResults.length);
    const next = this.script.shift() ?? { text: "done", toolCall: null };

    return Promise.resolve({
      modelId: "gemini-3.5-flash-lite",
      providerId: "google-ai-studio",
      providerModelId: "gemini-3.5-flash-lite",
      text: next.text,
      toolCall: next.toolCall,
    } as never);
  }
}

function registry(...tools: AnyTool[]): ToolRegistry {
  const byName = new Map(tools.map((tool) => [tool.name, tool]));

  return {
    find: (name: string) => byName.get(name),
    require: (name: string) => byName.get(name),
  } as unknown as ToolRegistry;
}

function readTool(name: string, result: unknown, ran: string[]): AnyTool {
  return {
    name,
    kind: "read",
    // biome-ignore lint/suspicious/noExplicitAny: minimal stand-in for a zod schema
    arguments: {
      safeParse: (value: any) => ({ success: true, data: value }),
    } as any,
    run: async () => {
      ran.push(name);
      return result;
    },
  } as AnyTool;
}

const INPUT = {
  messages: [{ content: "hi", role: "user" as const }],
  modelId: "gemini-3.5-flash-lite" as const,
  userId: "user-1",
};

test("answers directly when the model asks for no tool", async () => {
  const service = new FakeChatbotService(registry(), [
    { text: "Just an answer.", toolCall: null },
  ]);

  const result = await service.respond(INPUT);

  assert.equal(result.text, "Just an answer.");
  assert.equal(result.toolUsed, false);
  assert.deepEqual(service.asked, [0]);
});

test("chains several reads in one request before answering", async () => {
  const ran: string[] = [];
  const service = new FakeChatbotService(
    registry(
      readTool("a.get", { a: 1 }, ran),
      readTool("b.get", { b: 2 }, ran),
    ),
    [
      { text: "", toolCall: { name: "a.get", arguments: {} } },
      { text: "", toolCall: { name: "b.get", arguments: {} } },
      { text: "Here is everything.", toolCall: null },
    ],
  );

  const result = await service.respond(INPUT);

  assert.deepEqual(ran, ["a.get", "b.get"]);
  assert.equal(result.text, "Here is everything.");
  assert.equal(result.toolUsed, true);
  assert.deepEqual(service.asked, [0, 1, 2]);
});

test("stops the chain at a write and returns a form instead of saving", async () => {
  const ran: string[] = [];
  const write = {
    name: "a.add",
    kind: "write",
    // biome-ignore lint/suspicious/noExplicitAny: minimal stand-in for a zod schema
    arguments: {
      safeParse: (value: any) => ({ success: true, data: value }),
    } as any,
    // biome-ignore lint/suspicious/noExplicitAny: minimal stand-in for a zod schema
    values: {
      safeParse: (value: any) => ({ success: true, data: value }),
    } as any,
    prepare: async () => ({
      domain: "demo",
      title: "Add",
      fields: [],
      values: {},
      submitLabel: "Add",
    }),
    run: async () => {
      ran.push("a.add");
      return null;
    },
  } as unknown as AnyTool;

  const service = new FakeChatbotService(registry(write), [
    { text: "", toolCall: { name: "a.add", arguments: {} } },
    { text: "never reached", toolCall: null },
  ]);

  const result = await service.respond(INPUT);

  assert.equal(result.pendingAction?.tool, "a.add");
  assert.deepEqual(ran, [], "a write must not run before the user confirms");
});

test("caps a model that keeps asking for tools", async () => {
  const ran: string[] = [];
  const service = new FakeChatbotService(
    registry(readTool("a.get", {}, ran)),
    Array.from({ length: 10 }, () => ({
      text: "",
      toolCall: { name: "a.get", arguments: {} },
    })),
  );

  const result = await service.respond(INPUT);

  assert.equal(ran.length, 4, "the step cap bounds how many tools can run");
  assert.equal(result.toolUsed, true);
});

test("an unknown tool falls back to the model's prose", async () => {
  const service = new FakeChatbotService(registry(), [
    { text: "Sorry, not sure.", toolCall: { name: "nope.get", arguments: {} } },
  ]);

  const result = await service.respond(INPUT);

  assert.equal(result.text, "Sorry, not sure.");
  assert.equal(result.pendingAction, undefined);
});
