import { Injectable } from "@nestjs/common";

import { CareerProfileTools } from "./career-profile.tools";
import { type AnyTool, ToolExecutionError } from "./tool.types";

/**
 * Every tool Nest can run, keyed by the name FastAPI sends back. Add a domain
 * by writing a `*.tools.ts` provider and listing it here; nothing else in the
 * chatbot module needs to know it exists.
 */
@Injectable()
export class ToolRegistry {
  private readonly byName = new Map<string, AnyTool>();

  constructor(careerProfile: CareerProfileTools) {
    for (const tool of [...careerProfile.tools()]) {
      this.byName.set(tool.name, tool);
    }
  }

  find(name: string): AnyTool | undefined {
    return this.byName.get(name);
  }

  /** Throws rather than returning undefined: a bad name is a real failure. */
  require(name: string): AnyTool {
    const tool = this.find(name);

    if (!tool) {
      throw new ToolExecutionError(`Unknown tool: ${name}`);
    }

    return tool;
  }
}
