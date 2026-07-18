import { startActiveObservation } from "@langfuse/tracing";
import { context, ROOT_CONTEXT } from "@opentelemetry/api";
import { registerLangfuse } from "@/lib/langfuse";
import {
  DEFAULT_TEXT_GENERATION_MODEL_ID,
  getProviderModelId,
} from "@/lib/ai/text-generation/models";
import { getTextGenerationProviderChain } from "@/lib/ai/text-generation/provider-chain";
import type {
  GenerateTextParams,
  GenerateTextResult,
} from "@/lib/ai/text-generation/types";

export async function generateText({
  modelId = DEFAULT_TEXT_GENERATION_MODEL_ID,
  prompt,
}: GenerateTextParams): Promise<GenerateTextResult> {
  registerLangfuse();

  return context.with(ROOT_CONTEXT, () =>
    startActiveObservation(
    "generate-text",
    async (chain) => {
      chain.update({
        input: prompt,
        metadata: { feature: "text-generation", requestedModelId: modelId },
      });

      const providerChain = getTextGenerationProviderChain(modelId);
      let lastError: unknown;

      for (const adapter of providerChain) {
        const providerModelId = getProviderModelId({
          modelId,
          providerId: adapter.providerId,
        });
        const generation = chain.startObservation(
          "generate-response",
          {
            input: [{ content: prompt, role: "user" }],
            metadata: {
              providerId: adapter.providerId,
              requestedModelId: modelId,
            },
            model: providerModelId,
          },
          { asType: "generation" },
        );

        console.info(
          "Service[Text Generation] - Provider Used: ",
          adapter.providerId,
        );

        try {
          const result = await adapter.generateText({ modelId, prompt });

          generation.update({
            output: result.text,
            usageDetails: {
              completionTokens: result.usage?.outputTokens,
              promptTokens: result.usage?.inputTokens,
            },
          });
          chain.update({
            metadata: {
              feature: "text-generation",
              providerId: result.providerId,
              providerModelId: result.providerModelId,
              requestedModelId: modelId,
            },
            output: result.text,
          });

          return result;
        } catch (error) {
          lastError = error;
          generation.update({
            level: "ERROR",
            statusMessage:
              error instanceof Error ? error.message : "Unknown provider error",
          });
        } finally {
          generation.end();
        }
      }

      const error =
        lastError instanceof Error
          ? lastError
          : new Error(`Text generation failed for model: ${modelId}`);

      chain.update({ level: "ERROR", statusMessage: error.message });
      throw error;
    },
      { asType: "chain" },
    ),
  );
}
