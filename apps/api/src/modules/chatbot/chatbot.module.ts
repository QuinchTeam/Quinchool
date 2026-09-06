import { Module } from "@nestjs/common";

import { CareerProfileModule } from "../career-profile/career-profile.module";
import { ChatbotController } from "./chatbot.controller";
import { ChatbotService } from "./chatbot.service";
import { CareerProfileTools } from "./tools/career-profile.tools";
import { ToolRegistry } from "./tools/tool.registry";

@Module({
  imports: [CareerProfileModule],
  controllers: [ChatbotController],
  providers: [ChatbotService, ToolRegistry, CareerProfileTools],
})
export class ChatbotModule {}
