import { Injectable } from "@nestjs/common";

import { CareerProfileTools } from "./career-profile.tools";
import { type AnyTool, ToolExecutionError } from "./tool.types";

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

  require(name: string): AnyTool {
    const tool = this.find(name);

    if (!tool) {
      throw new ToolExecutionError(`Unknown tool: ${name}`);
    }

    return tool;
  }
}
