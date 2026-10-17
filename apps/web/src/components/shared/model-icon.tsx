import { BrainIcon } from "@phosphor-icons/react/dist/ssr/Brain";
import { DiamondIcon } from "@phosphor-icons/react/dist/ssr/Diamond";
import { MoonIcon } from "@phosphor-icons/react/dist/ssr/Moon";
import { SparkleIcon } from "@phosphor-icons/react/dist/ssr/Sparkle";
import { AppIcon } from "@/components/ui/icon";
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
      return (
        <AppIcon
          icon={SparkleIcon}
          aria-hidden="true"
          className={iconClassName}
        />
      );
    case TEXT_GENERATION_MODEL_IDS.GEMMA_4_26B_A4B:
      return (
        <AppIcon
          icon={DiamondIcon}
          aria-hidden="true"
          className={iconClassName}
        />
      );
    case TEXT_GENERATION_MODEL_IDS.KIMI_K2_7_CODE:
    case TEXT_GENERATION_MODEL_IDS.KIMI_K2_6:
      return (
        <AppIcon icon={MoonIcon} aria-hidden="true" className={iconClassName} />
      );
    case TEXT_GENERATION_MODEL_IDS.GPT_OSS_20B:
      return (
        <AppIcon
          icon={BrainIcon}
          aria-hidden="true"
          className={iconClassName}
        />
      );
  }
}
