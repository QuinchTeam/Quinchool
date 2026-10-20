import { Injectable, Logger } from "@nestjs/common";
import { observeDomain } from "../../core/observability/logger";

import { callAiService } from "../../shared/clients/ai/ai-client";
import type {
  GenerateTextResult,
  TextGenerationModelId,
} from "../text-generation/text-generation.types";
import type { ChatMessage, ToolAction } from "./chatbot.contract";
import { ToolRegistry } from "./tools/tool.registry";
import { ToolExecutionError, type ToolForm } from "./tools/tool.types";

interface AIToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

interface AIChatbotResult extends GenerateTextResult {
  toolCall: AIToolCall | null;
}

// Writes stay pending until the user confirms the form.
export interface PendingToolAction extends ToolForm {
  tool: string;
  arguments: Record<string, unknown>;
}

export interface ChatbotResult extends GenerateTextResult {
  toolUsed: boolean;
  pendingAction?: PendingToolAction;
}

interface ToolResult {
  name: string;
  result: unknown;
}

// The summary stands in for messages outside the recent window.
export interface ChainInput {
  messages: ChatMessage[];
  modelId: TextGenerationModelId;
  summary?: string;
  userId: string;
}

const FALLBACK = "The assistant could not respond. Try again.";

// Cap tool reads so a model loop cannot keep spending tokens.
const MAX_TOOL_STEPS = 4;

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);

  constructor(private readonly tools: ToolRegistry) {}

  respond(input: ChainInput): Promise<ChatbotResult> {
    return this.runChain(input, []);
  }

  // Resume the model after a confirmed write so it can respond to the result.
  async runAction(
    userId: string,
    action: Pick<ToolAction, "tool" | "arguments" | "values">,
    context: Omit<ChainInput, "userId">,
  ): Promise<ChatbotResult> {
    const tool = this.tools.require(action.tool);

    if (tool.kind !== "write") {
      throw new ToolExecutionError(
        `${action.tool} is not a confirmable action`,
      );
    }

    const args = tool.arguments.safeParse(action.arguments);
    const values = tool.values.safeParse(action.values);

    if (!args.success || !values.success) {
      throw new ToolExecutionError("That action is no longer valid.");
    }

    const result = await observeDomain("chatbot.tool.write", () =>
      tool.run(userId, args.data, values.data),
    );

    return this.runChain({ ...context, userId }, [{ name: tool.name, result }]);
  }

  /* FastAPI selects tools; Nest validates and executes them.
     Reads feed the next pass; writes stop for user confirmation.
     The step cap forces a final answer if reads keep chaining. */
  private async runChain(
    { messages, modelId, summary, userId }: ChainInput,
    seed: ToolResult[],
  ): Promise<ChatbotResult> {
    const toolResults = [...seed];

    for (let step = 0; step < MAX_TOOL_STEPS; step += 1) {
      const answer = await this.ask({
        messages,
        modelId,
        summary,
        toolResults,
      });

      if (!answer.toolCall) {
        return {
          ...stripToolCall(answer),
          toolUsed: toolResults.length > 0,
        };
      }

      const tool = this.tools.find(answer.toolCall.name);

      if (!tool) {
        this.logger.warn("chat.tool.unknown");
        return { ...stripToolCall(answer), toolUsed: toolResults.length > 0 };
      }

      const parsed = tool.arguments.safeParse(answer.toolCall.arguments);

      if (!parsed.success) {
        this.logger.warn("chat.tool.invalid-arguments");
        return {
          ...stripToolCall(answer),
          text: "I could not work out the details for that. Could you rephrase it?",
          toolUsed: toolResults.length > 0,
        };
      }

      if (tool.kind === "write") {
        const form = await observeDomain("chatbot.tool.prepare", () =>
          tool.prepare(userId, parsed.data),
        );

        return {
          ...stripToolCall(answer),
          text: answer.text || form.description || "",
          toolUsed: toolResults.length > 0,
          pendingAction: {
            ...form,
            tool: tool.name,
            arguments: parsed.data as Record<string, unknown>,
          },
        };
      }

      toolResults.push({
        name: tool.name,
        result: await observeDomain("chatbot.tool.read", () =>
          tool.run(userId, parsed.data),
        ),
      });
    }

    this.logger.warn("chat.tool.step-limit");

    const final = await this.ask({ messages, modelId, summary, toolResults });

    return { ...stripToolCall(final), toolUsed: true };
  }

  protected ask(body: {
    messages: ChatMessage[];
    modelId: TextGenerationModelId;
    summary?: string;
    toolResults: ToolResult[];
  }): Promise<AIChatbotResult> {
    return callAiService<AIChatbotResult>("/chatbot/respond", body, FALLBACK);
  }
}

function stripToolCall({
  toolCall: _toolCall,
  ...result
}: AIChatbotResult): GenerateTextResult {
  return result;
}
