import type { ZodType } from "zod";

export interface ReadTool<Arguments> {
  readonly name: string;
  readonly kind: "read";
  // Model-supplied arguments are untrusted.
  readonly arguments: ZodType<Arguments>;
  run(userId: string, args: Arguments): Promise<unknown>;
}

// Prepare a confirmation form; only user-submitted values may reach run.
export interface WriteTool<Arguments, Values> {
  readonly name: string;
  readonly kind: "write";
  readonly arguments: ZodType<Arguments>;
  readonly values: ZodType<Values>;
  prepare(userId: string, args: Arguments): Promise<ToolForm>;
  run(userId: string, args: Arguments, values: Values): Promise<unknown>;
}

// biome-ignore lint/suspicious/noExplicitAny: the registry is heterogeneous by design
export type AnyTool = ReadTool<any> | WriteTool<any, any>;

export interface ToolForm {
  readonly domain: string;
  readonly title: string;
  readonly description?: string;
  // Delete confirmations can have no fields.
  readonly fields: ToolField[];
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
  readonly itemLabel?: string;
}

export class ToolExecutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ToolExecutionError";
  }
}
