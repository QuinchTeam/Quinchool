import type { ZodType } from "zod";

/**
 * Nest's half of tool calling. It knows nothing about prompts, descriptions or
 * models: FastAPI owns all of that and hands back a name plus arguments. This
 * side only answers "what does that name run, and is it safe to run now".
 */

/** A tool that only reads. Safe to run the moment the model asks. */
export interface ReadTool<Arguments> {
  readonly name: string;
  readonly kind: "read";
  /** Arguments arrive from a language model, so nothing is trusted. */
  readonly arguments: ZodType<Arguments>;
  run(userId: string, args: Arguments): Promise<unknown>;
}

/**
 * A tool that changes stored data. Never runs straight from a model decision:
 * `prepare` turns the model's partial arguments into a form the user confirms,
 * and only the submitted values reach `run`.
 */
export interface WriteTool<Arguments, Values> {
  readonly name: string;
  readonly kind: "write";
  readonly arguments: ZodType<Arguments>;
  /** Validates what the user submitted back from the form. */
  readonly values: ZodType<Values>;
  prepare(userId: string, args: Arguments): Promise<ToolForm>;
  run(userId: string, args: Arguments, values: Values): Promise<unknown>;
}

// biome-ignore lint/suspicious/noExplicitAny: the registry is heterogeneous by design
export type AnyTool = ReadTool<any> | WriteTool<any, any>;

/** What the browser needs to render a confirmation form for one write. */
export interface ToolForm {
  /** Groups the chat UI by domain, e.g. "career-profile". */
  readonly domain: string;
  readonly title: string;
  readonly description?: string;
  /** Empty for a plain confirm, such as a delete. */
  readonly fields: ToolField[];
  /** Field name to the value the model proposed or the profile already holds. */
  readonly values: Record<string, unknown>;
  readonly submitLabel: string;
  readonly destructive?: boolean;
}

export interface ToolField {
  readonly name: string;
  readonly label: string;
  readonly type: "text" | "email" | "month" | "checkbox" | "list" | "textarea";
  readonly placeholder?: string;
  readonly required?: boolean;
  /** For `list`, the label of one entry, e.g. "Skill". */
  readonly itemLabel?: string;
}

export class ToolExecutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ToolExecutionError";
  }
}
