import { Gemini, Gemma, Kimi, OpenAI, ZAI } from "@lobehub/icons";
import {
  TEXT_GENERATION_MODEL_IDS,
  type TextGenerationModelId,
} from "@/lib/ai/text-generation/types";
import { cn } from "@/lib/utils";

export function ModelIcon({
  className,
  modelId,
}: {
  className?: string;
  modelId: TextGenerationModelId;
}) {
  const iconClassName = cn("size-8 text-foreground", className);

  switch (modelId) {
    case TEXT_GENERATION_MODEL_IDS.GEMINI_3_5_FLASH:
    case TEXT_GENERATION_MODEL_IDS.GEMINI_3_1_FLASH_LITE:
      return <Gemini aria-hidden="true" className={iconClassName} />;
    case TEXT_GENERATION_MODEL_IDS.GEMMA_4_26B_A4B:
      return <Gemma aria-hidden="true" className={iconClassName} />;
    case TEXT_GENERATION_MODEL_IDS.GLM_5_2:
      return <ZAI aria-hidden="true" className={iconClassName} />;
    case TEXT_GENERATION_MODEL_IDS.KIMI_K2_7_CODE:
    case TEXT_GENERATION_MODEL_IDS.KIMI_K2_6:
      return <Kimi aria-hidden="true" className={iconClassName} />;
    case TEXT_GENERATION_MODEL_IDS.GPT_OSS_20B:
      return <OpenAI aria-hidden="true" className={iconClassName} />;
  }
}
